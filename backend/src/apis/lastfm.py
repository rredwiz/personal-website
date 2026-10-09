"""Most recent / currently playing track, via the Last.fm API."""

from __future__ import annotations

import logging
import os
from typing import Any, Optional

from src.cache import TTLCache
from src.http_client import fetch_json

logger = logging.getLogger(__name__)

API_URL = "https://ws.audioscrobbler.com/2.0/"
DEFAULT_USERNAME = "redwheeze"

# The frontend polls this endpoint, so a short cache keeps many visitors from
# turning into many Last.fm calls while still feeling live.
CACHE_TTL_SECONDS = 15
_cache: TTLCache[dict] = TTLCache(CACHE_TTL_SECONDS)

# Last.fm image sizes, largest first.
_IMAGE_SIZE_PREFERENCE = ("extralarge", "large", "medium", "small")


def get_recent() -> Optional[dict]:
    return _cache.get_or_fetch(_fetch_recent)


def _fetch_recent() -> Optional[dict]:
    api_key = os.environ.get("LASTFM_API_KEY")
    if not api_key:
        logger.error("LASTFM_API_KEY is not set; cannot fetch recent tracks")
        return None

    params = {
        "method": "user.getrecenttracks",
        "user": os.environ.get("LASTFM_USERNAME") or DEFAULT_USERNAME,
        "api_key": api_key,
        "format": "json",
        "limit": 1,
    }
    data = fetch_json(API_URL, params=params)
    if data is None:
        return None
    return create_lastfm_json(data)


def _pick_image_url(images: Any) -> str:
    """Return the largest non-empty image URL Last.fm gave us, or ``""``."""
    if not isinstance(images, list):
        return ""
    by_size = {}
    for image in images:
        if isinstance(image, dict) and image.get("#text"):
            by_size[image.get("size")] = image["#text"]
    for size in _IMAGE_SIZE_PREFERENCE:
        if by_size.get(size):
            return by_size[size]
    # Unknown size labels: fall back to the last non-empty entry (Last.fm orders small -> large).
    return next(reversed(by_size.values()), "") if by_size else ""


def create_lastfm_json(response_json: Any) -> Optional[dict]:
    """Shape a ``user.getrecenttracks`` response into what the frontend needs.

    Handles Last.fm's quirks: ``track`` is a list normally but a bare object
    when only one track comes back, artists can be objects or strings, and the
    now-playing track is flagged with ``@attr.nowplaying``.
    """
    if not isinstance(response_json, dict):
        return None
    recent = response_json.get("recenttracks") or {}
    tracks = recent.get("track") or []
    if isinstance(tracks, dict):
        tracks = [tracks]
    if not tracks or not isinstance(tracks[0], dict):
        return None

    track = tracks[0]
    attrs = track.get("@attr") or {}
    now_playing = str(attrs.get("nowplaying", "")).lower() == "true"

    artist = track.get("artist")
    if isinstance(artist, dict):
        artist_name = artist.get("name") or artist.get("#text") or ""
    else:
        artist_name = str(artist or "")

    return {
        "currentlylistening": now_playing,
        "songname": str(track.get("name") or ""),
        "artist": artist_name,
        "image": _pick_image_url(track.get("image")),
        "url": str(track.get("url") or ""),
    }
