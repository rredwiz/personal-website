"""Currently playing track as a Spotify embed URL.

Not wired up to a route yet (see ``app.py``); kept here so the integration can
be enabled without changing production behaviour in the meantime.
"""

from __future__ import annotations

import logging
import os
from base64 import b64encode
from time import time
from typing import Optional

import requests

from src.http_client import DEFAULT_TIMEOUT, fetch_json

logger = logging.getLogger(__name__)

TOKEN_URL = "https://accounts.spotify.com/api/token"
CURRENTLY_PLAYING_URL = "https://api.spotify.com/v1/me/player/currently-playing"
POLL_INTERVAL_SECONDS = 20

_spotify_access_token: Optional[str] = None
_spotify_access_token_expires_at = 0.0
_spotify_iframe: Optional[str] = None
_spotify_iframe_last_polled_at = 0.0


def get_access_token() -> Optional[str]:
    global _spotify_access_token
    global _spotify_access_token_expires_at

    if _spotify_access_token and time() < _spotify_access_token_expires_at:
        return _spotify_access_token

    client_id = os.environ.get("SPOTIFY_CLIENT_ID")
    client_secret = os.environ.get("SPOTIFY_CLIENT_SECRET")
    refresh_token = os.environ.get("SPOTIFY_REFRESH_TOKEN")
    if not (client_id and client_secret and refresh_token):
        logger.error("Spotify credentials are not fully configured")
        return None

    credentials = b64encode(f"{client_id}:{client_secret}".encode()).decode()
    headers = {
        "Authorization": f"Basic {credentials}",
        "Content-Type": "application/x-www-form-urlencoded",
    }
    payload = {"grant_type": "refresh_token", "refresh_token": refresh_token}

    try:
        response = requests.post(TOKEN_URL, headers=headers, data=payload, timeout=DEFAULT_TIMEOUT)
        data = response.json() if response.ok else {}
    except (requests.RequestException, ValueError) as exc:
        logger.warning("Spotify token refresh failed: %s", exc)
        return None

    access_token = data.get("access_token")
    if not access_token:
        logger.warning("Spotify token refresh returned no access token (HTTP %s)", response.status_code)
        return None

    _spotify_access_token = access_token
    # Refresh slightly before the official expiry time.
    _spotify_access_token_expires_at = time() + data.get("expires_in", 3600) - 60
    return _spotify_access_token


def get_spotify_iframe() -> Optional[str]:
    global _spotify_iframe
    global _spotify_iframe_last_polled_at

    now = time()
    if now - _spotify_iframe_last_polled_at < POLL_INTERVAL_SECONDS:
        return _spotify_iframe
    _spotify_iframe_last_polled_at = now

    access_token = get_access_token()
    if not access_token:
        return None

    # Spotify answers 204 (no body) when nothing is playing; fetch_json treats
    # that as a 2xx with an unparseable body and returns None, which is right.
    data = fetch_json(CURRENTLY_PLAYING_URL, headers={"Authorization": f"Bearer {access_token}"})
    track_id = ((data or {}).get("item") or {}).get("id") if isinstance(data, dict) else None
    if not track_id:
        _spotify_iframe = None
        return None

    _spotify_iframe = f"https://open.spotify.com/embed/track/{track_id}"
    return _spotify_iframe
