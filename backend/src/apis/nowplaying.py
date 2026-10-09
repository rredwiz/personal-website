"""What the music card shows: Spotify when it's set up and answering, else Last.fm.

Both sources return the same shape (``songname``, ``artist``, ``image``,
``currentlylistening``, ``url``, ``played_at``, ``source``); only Spotify's
``url`` is a direct link to the track.
"""

from __future__ import annotations

from typing import Optional

from src.apis import lastfm, spotify


def get_now_playing() -> Optional[dict]:
    if spotify.is_configured():
        data = spotify.get_recent()
        if data:
            return data
    return lastfm.get_recent()
