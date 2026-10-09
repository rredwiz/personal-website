import unittest
from unittest.mock import patch

from src.apis import nowplaying

SPOTIFY_DATA = {"songname": "from spotify", "source": "spotify"}
LASTFM_DATA = {"songname": "from lastfm", "source": "lastfm"}


@patch("src.apis.nowplaying.lastfm.get_recent", return_value=LASTFM_DATA)
class GetNowPlayingTests(unittest.TestCase):
    @patch("src.apis.nowplaying.spotify.get_recent", return_value=SPOTIFY_DATA)
    @patch("src.apis.nowplaying.spotify.is_configured", return_value=True)
    def test_prefers_spotify_when_configured(self, _configured, _spotify, lastfm):
        self.assertEqual(nowplaying.get_now_playing(), SPOTIFY_DATA)
        lastfm.assert_not_called()

    @patch("src.apis.nowplaying.spotify.get_recent", return_value=None)
    @patch("src.apis.nowplaying.spotify.is_configured", return_value=True)
    def test_falls_back_to_lastfm_when_spotify_fails(self, _configured, _spotify, _lastfm):
        self.assertEqual(nowplaying.get_now_playing(), LASTFM_DATA)

    @patch("src.apis.nowplaying.spotify.get_recent")
    @patch("src.apis.nowplaying.spotify.is_configured", return_value=False)
    def test_uses_lastfm_without_spotify_credentials(self, _configured, spotify_recent, _lastfm):
        self.assertEqual(nowplaying.get_now_playing(), LASTFM_DATA)
        spotify_recent.assert_not_called()
