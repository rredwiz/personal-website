import unittest
from unittest.mock import patch

from src.apis import spotify
from tests.fixtures import (
    spotify_currently_playing,
    spotify_recently_played,
    spotify_track,
)

CREDENTIALS = {
    "SPOTIFY_CLIENT_ID": "client-id",
    "SPOTIFY_CLIENT_SECRET": "client-secret",
    "SPOTIFY_REFRESH_TOKEN": "refresh-token",
}


class FakeResponse:
    def __init__(self, status_code=200, payload=None):
        self.status_code = status_code
        self._payload = payload
        self.ok = 200 <= status_code < 300
        self.text = "" if payload is None else str(payload)

    def json(self):
        if self._payload is None:
            raise ValueError("no body")
        return self._payload


TOKEN_OK = FakeResponse(200, {"access_token": "access-1", "expires_in": 3600})


class CreateSpotifyJsonTests(unittest.TestCase):
    def test_maps_a_track_to_the_card_shape_with_a_direct_link(self):
        track = spotify_track(artists=("Daft Punk", "Pharrell Williams"))
        data = spotify.create_spotify_json(track, now_playing=True, played_at=None)
        self.assertEqual(
            data,
            {
                "currentlylistening": True,
                "songname": "Harder, Better, Faster, Stronger",
                "artist": "Daft Punk, Pharrell Williams",
                "image": "https://i.scdn.co/image/300",
                "url": "https://open.spotify.com/track/5W3cjX2J3tjhG8zb6u0qHn",
                "played_at": None,
                "source": "spotify",
            },
        )

    def test_image_choice(self):
        only_small = [{"url": "https://i.scdn.co/image/64", "width": 64}]
        unsized = [{"url": "https://i.scdn.co/image/a"}, {"url": "https://i.scdn.co/image/b"}]
        pick = spotify._pick_image_url
        self.assertEqual(pick(only_small), "https://i.scdn.co/image/64")
        self.assertEqual(pick(unsized), "https://i.scdn.co/image/a")
        self.assertEqual(pick([]), "")
        self.assertEqual(pick(None), "")

    def test_rejects_garbage(self):
        self.assertIsNone(spotify.create_spotify_json(None, now_playing=False, played_at=None))
        self.assertIsNone(spotify.create_spotify_json({"name": ""}, now_playing=False, played_at=None))


@patch.dict("os.environ", CREDENTIALS)
@patch("src.apis.spotify.requests.get")
@patch("src.apis.spotify.requests.post")
class GetRecentTests(unittest.TestCase):
    def setUp(self):
        spotify.reset_state()

    def tearDown(self):
        spotify.reset_state()

    def test_track_playing_now(self, post, get):
        post.return_value = TOKEN_OK
        get.return_value = FakeResponse(200, spotify_currently_playing())

        data = spotify.get_recent()

        self.assertIs(data["currentlylistening"], True)
        self.assertIsNone(data["played_at"])
        self.assertEqual(data["url"], "https://open.spotify.com/track/5W3cjX2J3tjhG8zb6u0qHn")
        self.assertEqual(get.call_args.kwargs["headers"]["Authorization"], "Bearer access-1")
        self.assertEqual(get.call_count, 1)

    def test_paused_track_counts_as_recently_played(self, post, get):
        post.return_value = TOKEN_OK
        get.return_value = FakeResponse(200, spotify_currently_playing(is_playing=False))

        data = spotify.get_recent()

        self.assertIs(data["currentlylistening"], False)
        self.assertEqual(data["played_at"], "2023-11-14T22:13:20Z")

    def test_nothing_playing_falls_back_to_recently_played(self, post, get):
        post.return_value = TOKEN_OK
        get.side_effect = [FakeResponse(204), FakeResponse(200, spotify_recently_played())]

        data = spotify.get_recent()

        self.assertIs(data["currentlylistening"], False)
        self.assertEqual(data["played_at"], "2026-10-08T21:15:04.512Z")
        self.assertEqual(get.call_args.args[0], spotify.RECENTLY_PLAYED_URL)

    def test_podcast_playing_falls_back_to_the_last_track(self, post, get):
        post.return_value = TOKEN_OK
        get.side_effect = [
            FakeResponse(200, {"currently_playing_type": "episode", "is_playing": True, "item": {}}),
            FakeResponse(200, spotify_recently_played()),
        ]
        self.assertEqual(spotify.get_recent()["songname"], "Harder, Better, Faster, Stronger")

    def test_caches_and_reuses_the_access_token(self, post, get):
        post.return_value = TOKEN_OK
        get.return_value = FakeResponse(200, spotify_currently_playing())

        spotify.get_recent()
        spotify.get_recent()  # served from the cache
        self.assertEqual(get.call_count, 1)

        spotify._cache.clear()  # cache expired, access token still valid
        spotify.get_recent()
        self.assertEqual(get.call_count, 2)
        self.assertEqual(post.call_count, 1)

    def test_expired_refresh_token_backs_off_instead_of_retrying(self, post, get):
        post.return_value = FakeResponse(400, {"error": "invalid_grant", "error_description": "expired"})

        with self.assertLogs("src.apis.spotify", level="ERROR") as logs:
            self.assertIsNone(spotify.get_recent())
        self.assertIn("spotify_auth.py", logs.output[0])

        self.assertIsNone(spotify.get_recent())
        self.assertEqual(post.call_count, 1)
        get.assert_not_called()

    def test_revoked_access_token_is_refreshed_next_time(self, post, get):
        post.side_effect = [TOKEN_OK, FakeResponse(200, {"access_token": "access-2", "expires_in": 3600})]
        get.side_effect = [
            FakeResponse(401, {"error": {"status": 401}}),
            FakeResponse(401, {"error": {"status": 401}}),
            FakeResponse(200, spotify_currently_playing()),
        ]

        self.assertIsNone(spotify.get_recent())
        data = spotify.get_recent()

        self.assertEqual(post.call_count, 2)
        self.assertEqual(get.call_args.kwargs["headers"]["Authorization"], "Bearer access-2")
        self.assertEqual(data["songname"], "Harder, Better, Faster, Stronger")


class NotConfiguredTests(unittest.TestCase):
    def setUp(self):
        spotify.reset_state()

    @patch.dict(
        "os.environ", {"SPOTIFY_CLIENT_ID": "", "SPOTIFY_CLIENT_SECRET": "", "SPOTIFY_REFRESH_TOKEN": ""}
    )
    @patch("src.apis.spotify.requests.post")
    def test_missing_credentials_make_no_calls(self, post):
        self.assertFalse(spotify.is_configured())
        self.assertIsNone(spotify.get_recent())
        post.assert_not_called()
