"""Sample upstream payloads, trimmed to the fields the code looks at."""

LASTFM_IMAGES = [
    {"size": "small", "#text": "https://lastfm.freetls.fastly.net/i/u/34s/cover.jpg"},
    {"size": "medium", "#text": "https://lastfm.freetls.fastly.net/i/u/64s/cover.jpg"},
    {"size": "large", "#text": "https://lastfm.freetls.fastly.net/i/u/174s/cover.jpg"},
    {"size": "extralarge", "#text": "https://lastfm.freetls.fastly.net/i/u/300x300/cover.jpg"},
]


def lastfm_track(name="Harder, Better, Faster, Stronger", artist="Daft Punk", now_playing=False, images=None):
    track = {
        "artist": {"mbid": "", "#text": artist},
        "image": LASTFM_IMAGES if images is None else images,
        "name": name,
        "url": "https://www.last.fm/music/Daft+Punk/_/Harder,+Better,+Faster,+Stronger",
    }
    if now_playing:
        track["@attr"] = {"nowplaying": "true"}
    else:
        track["date"] = {"uts": "1700000000", "#text": "14 Nov 2023, 22:13"}
    return track


def lastfm_response(tracks):
    return {"recenttracks": {"track": tracks, "@attr": {"user": "redwheeze", "total": "12345"}}}


SPOTIFY_IMAGES = [
    {"url": "https://i.scdn.co/image/640", "width": 640, "height": 640},
    {"url": "https://i.scdn.co/image/300", "width": 300, "height": 300},
    {"url": "https://i.scdn.co/image/64", "width": 64, "height": 64},
]


def spotify_track(name="Harder, Better, Faster, Stronger", artists=("Daft Punk",), images=None):
    return {
        "id": "5W3cjX2J3tjhG8zb6u0qHn",
        "name": name,
        "artists": [{"name": artist} for artist in artists],
        "album": {"images": SPOTIFY_IMAGES if images is None else images},
        "external_urls": {"spotify": "https://open.spotify.com/track/5W3cjX2J3tjhG8zb6u0qHn"},
    }


def spotify_currently_playing(track=None, is_playing=True, kind="track", timestamp=1700000000000):
    return {
        "is_playing": is_playing,
        "timestamp": timestamp,
        "currently_playing_type": kind,
        "item": spotify_track() if track is None else track,
    }


def spotify_recently_played(track=None, played_at="2026-10-08T21:15:04.512Z"):
    return {"items": [{"track": spotify_track() if track is None else track, "played_at": played_at}]}


def monkeytype_result(wpm, language="english", mode="time", mode2="15"):
    return {"wpm": wpm, "acc": 97.5, "language": language, "mode": mode, "mode2": mode2}


MONKEYTYPE_RESULTS = {
    "message": "Results retrieved",
    "data": [
        monkeytype_result(100),
        monkeytype_result(120),
        monkeytype_result(140, language="english_1k"),
        monkeytype_result(999, language="english_1k", mode="words", mode2="25"),  # wrong mode
        monkeytype_result(999, mode2="60"),  # wrong duration
        monkeytype_result(999, language="german"),  # wrong language
    ],
}

MONKEYTYPE_PERSONAL_BESTS = {
    "message": "Personal bests retrieved",
    "data": {
        "15": [
            {"language": "english", "punctuation": True, "wpm": 130.5},
            {"language": "english", "punctuation": False, "wpm": 151.2},
            {"language": "english_1k", "punctuation": False, "wpm": 148.0},
            {"language": "german", "punctuation": False, "wpm": 400.0},
        ],
        "30": [{"language": "english", "punctuation": False, "wpm": 500.0}],
    },
}


def github_event(
    event_type="PushEvent",
    repo="rredwiz/personal-website",
    commits=None,
    head=None,
    created_at="2026-10-01T12:00:00Z",
):
    if commits is None:
        commits = [
            {
                "sha": "abc123",
                "message": "fix: things\n\nlonger body",
                "url": "https://api.github.com/repos/x/commits/abc123",
            }
        ]
    payload = {"commits": commits}
    if head is not None:
        payload["head"] = head
    return {
        "type": event_type,
        "repo": {"name": repo, "url": f"https://api.github.com/repos/{repo}"},
        "payload": payload,
        "created_at": created_at,
    }
