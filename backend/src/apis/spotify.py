"""Currently playing / most recently played track, via the Spotify Web API.

Needs ``SPOTIFY_CLIENT_ID``, ``SPOTIFY_CLIENT_SECRET`` and
``SPOTIFY_REFRESH_TOKEN``; ``scripts/spotify_auth.py`` walks through getting
the refresh token. Since July 2026 Spotify refresh tokens expire six months
after the original authorization (refreshing doesn't extend them), so that
script has to be re-run about twice a year. Until it is, ``get_recent`` returns
``None`` and ``/nowplaying`` falls back to Last.fm.
"""

from __future__ import annotations

import logging
import os
import threading
import time
from base64 import b64encode
from datetime import datetime, timezone
from typing import Any, Optional

import requests

from src.cache import TTLCache
from src.http_client import DEFAULT_TIMEOUT, USER_AGENT

logger = logging.getLogger(__name__)

TOKEN_URL = "https://accounts.spotify.com/api/token"
CURRENTLY_PLAYING_URL = "https://api.spotify.com/v1/me/player/currently-playing"
RECENTLY_PLAYED_URL = "https://api.spotify.com/v1/me/player/recently-played"
SCOPES = ("user-read-currently-playing", "user-read-recently-played")

# Development-mode apps share one quota per developer account, so however many
# visitors poll /nowplaying, Spotify should see a handful of calls a minute.
CACHE_TTL_SECONDS = 20
_cache: TTLCache[dict] = TTLCache(CACHE_TTL_SECONDS)

# After a refresh token is rejected, don't hammer the token endpoint (Spotify
# asks clients not to retry an expired refresh); try again after this long in
# case the env var was updated without a restart.
TOKEN_FAILURE_BACKOFF_SECONDS = 15 * 60

# Album art: the smallest image at least this wide (the card shows ~128 px at 2x).
PREFERRED_IMAGE_WIDTH = 300

_token_lock = threading.Lock()
_access_token: Optional[str] = None
_access_token_expires_at = 0.0
_token_failed_until = 0.0


def is_configured() -> bool:
    return all(
        os.environ.get(name)
        for name in ("SPOTIFY_CLIENT_ID", "SPOTIFY_CLIENT_SECRET", "SPOTIFY_REFRESH_TOKEN")
    )


def get_recent() -> Optional[dict]:
    """The track playing right now, or else the most recently played one."""
    return _cache.get_or_fetch(_fetch_recent)


def reset_state() -> None:
    """Forget cached data and tokens (for tests)."""
    global _access_token, _access_token_expires_at, _token_failed_until
    _cache.clear()
    with _token_lock:
        _access_token = None
        _access_token_expires_at = 0.0
        _token_failed_until = 0.0


def _fetch_recent() -> Optional[dict]:
    if not is_configured():
        return None
    token = _get_access_token()
    if not token:
        return None

    playing = _api_get(CURRENTLY_PLAYING_URL, token, {"additional_types": "track"})
    if isinstance(playing, dict) and playing.get("currently_playing_type") == "track":
        track = playing.get("item")
        if isinstance(track, dict):
            is_playing = bool(playing.get("is_playing"))
            # Paused: report when playback last changed, like a recent play.
            played_at = None if is_playing else _iso_from_millis(playing.get("timestamp"))
            return create_spotify_json(track, now_playing=is_playing, played_at=played_at)

    recent = _api_get(RECENTLY_PLAYED_URL, token, {"limit": 1})
    items = recent.get("items") if isinstance(recent, dict) else None
    if isinstance(items, list) and items and isinstance(items[0], dict):
        track = items[0].get("track")
        if isinstance(track, dict):
            return create_spotify_json(track, now_playing=False, played_at=items[0].get("played_at"))
    return None


def create_spotify_json(track: Any, *, now_playing: bool, played_at: Optional[str]) -> Optional[dict]:
    """Shape a Spotify track object like the Last.fm response, plus a direct link."""
    if not isinstance(track, dict) or not track.get("name"):
        return None
    artists = [a.get("name") for a in track.get("artists") or [] if isinstance(a, dict) and a.get("name")]
    album = track.get("album") if isinstance(track.get("album"), dict) else {}
    external_urls = track.get("external_urls") if isinstance(track.get("external_urls"), dict) else {}
    return {
        "currentlylistening": now_playing,
        "songname": str(track["name"]),
        "artist": ", ".join(artists),
        "image": _pick_image_url(album.get("images")),
        "url": str(external_urls.get("spotify") or ""),
        "played_at": played_at if isinstance(played_at, str) and played_at else None,
        "source": "spotify",
    }


def _pick_image_url(images: Any) -> str:
    sized = [
        img
        for img in images or []
        if isinstance(img, dict) and img.get("url") and isinstance(img.get("width"), (int, float))
    ]
    if not sized:
        unsized = [img["url"] for img in images or [] if isinstance(img, dict) and img.get("url")]
        return unsized[0] if unsized else ""
    big_enough = [img for img in sized if img["width"] >= PREFERRED_IMAGE_WIDTH]
    if big_enough:
        return min(big_enough, key=lambda img: img["width"])["url"]
    return max(sized, key=lambda img: img["width"])["url"]


def _iso_from_millis(value: Any) -> Optional[str]:
    if not isinstance(value, (int, float)) or value <= 0:
        return None
    return datetime.fromtimestamp(value / 1000, tz=timezone.utc).isoformat().replace("+00:00", "Z")


def _get_access_token() -> Optional[str]:
    global _access_token, _access_token_expires_at, _token_failed_until

    with _token_lock:
        now = time.monotonic()
        if _access_token and now < _access_token_expires_at:
            return _access_token
        if now < _token_failed_until:
            return None

        credentials = b64encode(
            f"{os.environ['SPOTIFY_CLIENT_ID']}:{os.environ['SPOTIFY_CLIENT_SECRET']}".encode()
        ).decode()
        try:
            response = requests.post(
                TOKEN_URL,
                headers={"Authorization": f"Basic {credentials}", "User-Agent": USER_AGENT},
                data={"grant_type": "refresh_token", "refresh_token": os.environ["SPOTIFY_REFRESH_TOKEN"]},
                timeout=DEFAULT_TIMEOUT,
            )
        except requests.RequestException as exc:
            logger.warning("Spotify token refresh failed: %s", exc)
            return None

        try:
            data = response.json()
        except ValueError:
            data = {}
        if not isinstance(data, dict):
            data = {}

        if data.get("error") == "invalid_grant":
            _token_failed_until = now + TOKEN_FAILURE_BACKOFF_SECONDS
            logger.error(
                "Spotify rejected the refresh token (invalid_grant): it expired (six months after "
                "authorization) or was revoked. Run backend/scripts/spotify_auth.py and update "
                "SPOTIFY_REFRESH_TOKEN. Falling back to Last.fm until then."
            )
            return None

        token = data.get("access_token")
        if not response.ok or not isinstance(token, str) or not token:
            logger.warning("Spotify token refresh returned HTTP %s: %.200s", response.status_code, data)
            return None

        _access_token = token
        expires_in = data.get("expires_in") if isinstance(data.get("expires_in"), (int, float)) else 3600
        # Refresh a minute early so a request never goes out with a just-expired token.
        _access_token_expires_at = now + max(expires_in - 60, 0)
        return _access_token


def _api_get(url: str, token: str, params: dict) -> Any:
    """GET a Spotify endpoint. ``None`` for 204 (nothing playing) and for any failure."""
    global _access_token
    try:
        response = requests.get(
            url,
            params=params,
            headers={
                "Authorization": f"Bearer {token}",
                "User-Agent": USER_AGENT,
                "Accept": "application/json",
            },
            timeout=DEFAULT_TIMEOUT,
        )
    except requests.RequestException as exc:
        logger.warning("Spotify request to %s failed: %s", url, exc)
        return None

    if response.status_code == 204:
        return None
    if response.status_code == 401:
        # Access token revoked early; get a new one next time.
        with _token_lock:
            _access_token = None
        logger.warning("Spotify returned 401 for %s; will refresh the access token", url)
        return None
    if response.status_code == 429:
        logger.warning("Spotify rate limit/quota hit for %s: %.200s", url, response.text)
        return None
    if not response.ok:
        logger.warning(
            "Spotify request to %s returned HTTP %s: %.200s", url, response.status_code, response.text
        )
        return None
    try:
        return response.json()
    except ValueError:
        logger.warning("Spotify request to %s returned a non-JSON body", url)
        return None
