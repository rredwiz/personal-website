import unittest
from unittest.mock import patch

from src.app import _allowed_origin, create_app


class RouteTests(unittest.TestCase):
    def setUp(self):
        self.client = create_app(cors_origins="*").test_client()

    def test_health_check(self):
        response = self.client.get("/")
        self.assertEqual(response.status_code, 200)
        self.assertIn(b"HEALTH CHECK 200", response.data)

    @patch(
        "src.app.monkeytype.get_monkeytype_scores_info",
        return_value={"averagewpm": 120.0, "bestwpm": 151.2},
    )
    def test_monkeytype_ok(self, _loader):
        response = self.client.get("/monkeytype")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.get_json(), {"averagewpm": 120.0, "bestwpm": 151.2})

    @patch("src.app.monkeytype.get_monkeytype_scores_info", return_value=None)
    def test_monkeytype_upstream_failure_is_an_error_status(self, _loader):
        # Regression: this used to answer 200 with {"error": ...}, which the
        # frontend happily rendered as "undefined wpm".
        response = self.client.get("/monkeytype")
        self.assertEqual(response.status_code, 502)
        self.assertIn("error", response.get_json())

    @patch("src.app.lastfm.get_recent", return_value={"songname": "x", "currentlylistening": True})
    def test_lastfm_ok(self, _loader):
        response = self.client.get("/lastfm")
        self.assertEqual(response.status_code, 200)
        self.assertIs(response.get_json()["currentlylistening"], True)

    @patch("src.app.lastfm.get_recent", return_value=None)
    def test_lastfm_failure(self, _loader):
        self.assertEqual(self.client.get("/lastfm").status_code, 502)

    @patch("src.app.github.get_github_events", return_value={"events": [{"message": "m"}]})
    def test_github_ok(self, _loader):
        response = self.client.get("/github")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.get_json()["events"][0]["message"], "m")

    @patch("src.app.github.get_github_events", return_value=None)
    def test_github_failure(self, _loader):
        self.assertEqual(self.client.get("/github").status_code, 502)

    def test_spotify_is_not_routed(self):
        self.assertEqual(self.client.get("/spotify").status_code, 404)

    def test_unknown_route_is_json(self):
        response = self.client.get("/nope")
        self.assertEqual(response.status_code, 404)
        self.assertEqual(response.get_json(), {"error": "not found"})


class CorsTests(unittest.TestCase):
    def test_wildcard_by_default(self):
        client = create_app(cors_origins="*").test_client()
        response = client.get("/", headers={"Origin": "https://anything.example"})
        self.assertEqual(response.headers["Access-Control-Allow-Origin"], "*")

    def test_allow_list_echoes_matching_origin_only(self):
        client = create_app(cors_origins="https://andster.dev, https://www.andster.dev").test_client()

        allowed = client.get("/", headers={"Origin": "https://andster.dev"})
        self.assertEqual(allowed.headers["Access-Control-Allow-Origin"], "https://andster.dev")
        self.assertIn("Origin", allowed.headers.get("Vary", ""))

        denied = client.get("/", headers={"Origin": "https://evil.example"})
        self.assertNotIn("Access-Control-Allow-Origin", denied.headers)

    def test_allowed_origin_helper(self):
        self.assertEqual(_allowed_origin(None, "*"), "*")
        self.assertEqual(_allowed_origin("https://a.dev", ""), "*")
        self.assertEqual(_allowed_origin("https://a.dev", "https://a.dev"), "https://a.dev")
        self.assertIsNone(_allowed_origin("https://b.dev", "https://a.dev"))
        self.assertIsNone(_allowed_origin(None, "https://a.dev"))


if __name__ == "__main__":
    unittest.main()
