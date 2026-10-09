import unittest
from unittest.mock import patch

from src.apis import lastfm
from tests.fixtures import LASTFM_IMAGES, lastfm_response, lastfm_track


class CreateLastfmJsonTests(unittest.TestCase):
    def test_recently_played_track(self):
        data = lastfm.create_lastfm_json(lastfm_response([lastfm_track()]))

        self.assertEqual(
            data,
            {
                "currentlylistening": False,
                "songname": "Harder, Better, Faster, Stronger",
                "artist": "Daft Punk",
                "image": "https://lastfm.freetls.fastly.net/i/u/300x300/cover.jpg",
                "url": "https://www.last.fm/music/Daft+Punk/_/Harder,+Better,+Faster,+Stronger",
                "played_at": "2023-11-14T22:13:20Z",
                "source": "lastfm",
            },
        )

    def test_played_at_is_none_while_playing_or_without_a_date(self):
        data = lastfm.create_lastfm_json(lastfm_response([lastfm_track(now_playing=True)]))
        self.assertIsNone(data["played_at"])
        track = lastfm_track()
        track["date"] = {"uts": "not-a-number"}
        self.assertIsNone(lastfm.create_lastfm_json(lastfm_response([track]))["played_at"])

    def test_now_playing_is_a_real_boolean(self):
        tracks = [lastfm_track(now_playing=True), lastfm_track(name="older")]
        data = lastfm.create_lastfm_json(lastfm_response(tracks))
        self.assertIs(data["currentlylistening"], True)
        self.assertEqual(data["songname"], "Harder, Better, Faster, Stronger")

    def test_single_track_object_instead_of_list(self):
        # Last.fm returns a bare object (not a one-element list) when limit=1 and
        # nothing is playing. The old code crashed on this with KeyError: 0.
        data = lastfm.create_lastfm_json(lastfm_response(lastfm_track(name="Solo")))
        self.assertEqual(data["songname"], "Solo")
        self.assertIs(data["currentlylistening"], False)

    def test_artist_as_plain_string(self):
        track = lastfm_track()
        track["artist"] = "Justice"
        self.assertEqual(lastfm.create_lastfm_json(lastfm_response([track]))["artist"], "Justice")

    def test_falls_back_to_smaller_image_when_largest_is_blank(self):
        images = [dict(img) for img in LASTFM_IMAGES]
        images[3]["#text"] = ""
        data = lastfm.create_lastfm_json(lastfm_response([lastfm_track(images=images)]))
        self.assertEqual(data["image"], "https://lastfm.freetls.fastly.net/i/u/174s/cover.jpg")

    def test_no_images_gives_empty_string(self):
        data = lastfm.create_lastfm_json(lastfm_response([lastfm_track(images=[])]))
        self.assertEqual(data["image"], "")
        data = lastfm.create_lastfm_json(lastfm_response([lastfm_track(images=None)]))
        self.assertEqual(data["image"], "https://lastfm.freetls.fastly.net/i/u/300x300/cover.jpg")

    def test_empty_history_returns_none(self):
        self.assertIsNone(lastfm.create_lastfm_json(lastfm_response([])))
        self.assertIsNone(lastfm.create_lastfm_json({"recenttracks": {}}))
        self.assertIsNone(lastfm.create_lastfm_json({"error": 6, "message": "User not found"}))
        self.assertIsNone(lastfm.create_lastfm_json(None))


class GetRecentTests(unittest.TestCase):
    def setUp(self):
        lastfm._cache.clear()

    @patch.dict("os.environ", {"LASTFM_API_KEY": "", "LASTFM_USERNAME": ""})
    @patch("src.apis.lastfm.fetch_json")
    def test_missing_api_key_does_not_call_upstream(self, fetch_json):
        self.assertIsNone(lastfm.get_recent())
        fetch_json.assert_not_called()

    @patch.dict("os.environ", {"LASTFM_API_KEY": "key123", "LASTFM_USERNAME": "someone"})
    @patch("src.apis.lastfm.fetch_json")
    def test_fetches_and_caches(self, fetch_json):
        fetch_json.return_value = lastfm_response([lastfm_track()])

        first = lastfm.get_recent()
        second = lastfm.get_recent()

        self.assertEqual(first["songname"], "Harder, Better, Faster, Stronger")
        self.assertEqual(first, second)
        self.assertEqual(fetch_json.call_count, 1)
        params = fetch_json.call_args.kwargs["params"]
        self.assertEqual(params["user"], "someone")
        self.assertEqual(params["api_key"], "key123")
        self.assertEqual(params["limit"], 1)

    @patch.dict("os.environ", {"LASTFM_API_KEY": "key123"})
    @patch("src.apis.lastfm.fetch_json", return_value=None)
    def test_upstream_failure_returns_none_and_is_retried(self, fetch_json):
        self.assertIsNone(lastfm.get_recent())
        self.assertIsNone(lastfm.get_recent())
        self.assertEqual(fetch_json.call_count, 2)


if __name__ == "__main__":
    unittest.main()
