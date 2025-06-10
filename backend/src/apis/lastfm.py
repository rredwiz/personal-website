import os
import requests

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
        return create_lastfm_json(response.json())
    print(f"something went wrong: status code was {response.status_code}")


def create_lastfm_json(response_json):
    track = response_json.get("recenttracks").get("track")[0]
    currently_listening = len(response_json.get("recenttracks").get("track")) == 2
    song_name = track.get("name")
    artist = track.get("artist").get("#text")
    image_url = track.get("image")[3].get("#text")

    schema = {
        "currentlylistening": f"{currently_listening}",
        "songname": f"{song_name}",
        "artist": f"{artist}",
        "image": f"{image_url}",
    }

    return schema
