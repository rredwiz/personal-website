import unittest
from unittest.mock import patch

from src.apis import github
from tests.fixtures import github_event


class CreateGithubJsonTests(unittest.TestCase):
    def test_shapes_push_events_with_html_urls(self):
        data = github.create_github_json([github_event()])

        self.assertEqual(
            data,
            {
                "events": [
                    {
                        "message": "fix: things",
                        "repo_name": "rredwiz/personal-website",
                        "repo_url": "https://github.com/rredwiz/personal-website",
                        "commit_url": "https://github.com/rredwiz/personal-website/commit/abc123",
                        "type": "PushEvent",
                        "created_at": "2026-10-01T12:00:00Z",
                    }
                ]
            },
        )

    def test_non_push_events_are_skipped_not_treated_as_the_end(self):
        # Regression: the old loop did `else: break`, so a WatchEvent at the top
        # of the feed hid every push behind it.
        events = [github_event("WatchEvent"), github_event("CreateEvent"), github_event()]
        self.assertEqual(len(github.create_github_json(events)["events"]), 1)

    def test_push_without_commits_is_skipped(self):
        events = [github_event(commits=[]), github_event(commits=None)]
        events[1]["payload"]["commits"] = None
        self.assertEqual(github.create_github_json(events)["events"], [])

    def test_limits_to_five_most_recent(self):
        events = [github_event(commits=[{"sha": f"sha{i}", "message": f"commit {i}"}]) for i in range(8)]
        shaped = github.create_github_json(events)["events"]
        self.assertEqual([e["message"] for e in shaped], [f"commit {i}" for i in range(5)])

    def test_uses_the_head_commit_of_a_push(self):
        commits = [
            {"sha": "older", "message": "first"},
            {"sha": "newest", "message": "second"},
        ]
        shaped = github.create_github_json([github_event(commits=commits, head="newest")])["events"][0]
        self.assertEqual(shaped["message"], "second")
        self.assertTrue(shaped["commit_url"].endswith("/commit/newest"))

        # Without a head sha, the last commit in the push is the newest.
        shaped = github.create_github_json([github_event(commits=commits)])["events"][0]
        self.assertEqual(shaped["message"], "second")

    def test_garbage_input(self):
        self.assertEqual(github.create_github_json(None), {"events": []})
        self.assertEqual(github.create_github_json({"message": "Bad credentials"}), {"events": []})
        self.assertEqual(github.create_github_json([None, "x", {}]), {"events": []})


class GetGithubEventsTests(unittest.TestCase):
    def setUp(self):
        github._cache.clear()

    @patch.dict("os.environ", {"GITHUB_API_KEY": "", "GITHUB_USERNAME": ""})
    @patch("src.apis.github.fetch_json")
    def test_works_without_a_token_and_uses_the_public_feed(self, fetch_json):
        fetch_json.return_value = [github_event()]

        data = github.get_github_events()

        self.assertEqual(len(data["events"]), 1)
        url = fetch_json.call_args.args[0]
        self.assertEqual(url, "https://api.github.com/users/rredwiz/events/public")
        self.assertNotIn("Authorization", fetch_json.call_args.kwargs["headers"])

    @patch.dict("os.environ", {"GITHUB_API_KEY": "tok", "GITHUB_USERNAME": "octocat"})
    @patch("src.apis.github.fetch_json")
    def test_token_and_username_from_env(self, fetch_json):
        fetch_json.return_value = []
        github.get_github_events()
        self.assertEqual(fetch_json.call_args.args[0], "https://api.github.com/users/octocat/events/public")
        self.assertEqual(fetch_json.call_args.kwargs["headers"]["Authorization"], "Bearer tok")

    @patch.dict("os.environ", {"GITHUB_API_KEY": ""})
    @patch("src.apis.github.fetch_json")
    def test_results_are_cached(self, fetch_json):
        fetch_json.return_value = [github_event()]
        github.get_github_events()
        github.get_github_events()
        self.assertEqual(fetch_json.call_count, 1)

    @patch.dict("os.environ", {"GITHUB_API_KEY": ""})
    @patch("src.apis.github.fetch_json", return_value=None)
    def test_upstream_failure_returns_none(self, fetch_json):
        self.assertIsNone(github.get_github_events())


if __name__ == "__main__":
    unittest.main()
