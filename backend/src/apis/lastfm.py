import os
import requests
from base64 import b64encode

LASTFM_USERNAME = "redwheeze"
LASTFM_API_KEY = os.environ.get("LASTFM_API_KEY")

url = "http://ws.audioscrobbler.com/2.0/"
params = {
    "method": "user.getrecenttracks",
    "user": LASTFM_USERNAME,
    "api_key": LASTFM_API_KEY,
    "format": "json",
    "limit": 1,
}


def get_recent():
    response = requests.get(url, params=params)
    if response.status_code == 200:
        return response.json()
    print(f"response had status code {response.status_code}")
