import os
import requests
from base64 import b64encode
from time import time

SPOTIFY_CLIENT_ID = os.environ.get("SPOTIFY_CLIENT_ID")
SPOTIFY_CLIENT_SECRET = os.environ.get("SPOTIFY_CLIENT_SECRET")
SPOTIFY_REFRESH_TOKEN = os.environ.get("SPOTIFY_REFRESH_TOKEN")

_spotify_access_token = None
_spotify_access_token_expires_at = 0
_spotify_iframe = None
_spotify_iframe_last_polled_at = 0

def get_access_token():
    global _spotify_access_token
    global _spotify_access_token_expires_at

    if _spotify_access_token and time() < _spotify_access_token_expires_at:
        return _spotify_access_token

    credentials = b64encode(f"{SPOTIFY_CLIENT_ID}:{SPOTIFY_CLIENT_SECRET}".encode()).decode()

    headers = {
        "Authorization": f"Basic {credentials}",
        "Content-Type": "application/x-www-form-urlencoded"
    }

    params = {
        "grant_type": "refresh_token",
        "refresh_token": SPOTIFY_REFRESH_TOKEN
    }

    response = requests.post(
        "https://accounts.spotify.com/api/token",
        headers=headers,
        data=params
    )

    data = response.json()
    _spotify_access_token = data["access_token"]
    # refresh slightly before the official expiry time.
    _spotify_access_token_expires_at = time() + data.get("expires_in", 3600) - 60

    return _spotify_access_token

def get_spotify_iframe():
    global _spotify_iframe
    global _spotify_iframe_last_polled_at

    now = time()
    if now - _spotify_iframe_last_polled_at < 20:
        return _spotify_iframe

    _spotify_iframe_last_polled_at = now
    access_token = get_access_token()
    headers = {
        "Authorization": f"Bearer {access_token}"
    }

    response = requests.get(
        "https://api.spotify.com/v1/me/player/currently-playing",
        headers=headers
    )

    if response.status_code == 204:
        _spotify_iframe = None
        return None

    if response.status_code != 200:
        print(f"something went wrong: status code was {response.status_code}")
        return None

    track_id = response.json().get("item", {}).get("id")
    if not track_id:
        _spotify_iframe = None
        return None

    _spotify_iframe = f"https://open.spotify.com/embed/track/{track_id}"
    return _spotify_iframe
