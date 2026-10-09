import unittest
from unittest.mock import Mock, patch

import requests

from src.http_client import DEFAULT_TIMEOUT, fetch_json


def _response(status=200, json_body=None, text=""):
    response = Mock()
    response.status_code = status
    response.text = text
    if json_body is None:
        response.json.side_effect = ValueError("no json")
    else:
        response.json.return_value = json_body
    return response


class FetchJsonTests(unittest.TestCase):
    @patch("src.http_client.requests.get")
    def test_returns_decoded_json_and_always_sends_a_timeout(self, get):
        get.return_value = _response(200, {"ok": True})

        self.assertEqual(fetch_json("https://example.test/api", params={"a": 1}), {"ok": True})

        _, kwargs = get.call_args
        self.assertEqual(kwargs["timeout"], DEFAULT_TIMEOUT)
        self.assertEqual(kwargs["params"], {"a": 1})
        self.assertIn("User-Agent", kwargs["headers"])

    @patch("src.http_client.requests.get")
    def test_caller_headers_are_merged_with_defaults(self, get):
        get.return_value = _response(200, {})
        fetch_json("https://example.test", headers={"Authorization": "Bearer x"})
        headers = get.call_args.kwargs["headers"]
        self.assertEqual(headers["Authorization"], "Bearer x")
        self.assertEqual(headers["Accept"], "application/json")

    @patch("src.http_client.requests.get")
    def test_non_2xx_returns_none(self, get):
        get.return_value = _response(503, {"error": "down"}, text="down")
        self.assertIsNone(fetch_json("https://example.test"))

    @patch("src.http_client.requests.get")
    def test_network_error_returns_none(self, get):
        get.side_effect = requests.ConnectionError("boom")
        self.assertIsNone(fetch_json("https://example.test"))

    @patch("src.http_client.requests.get")
    def test_timeout_returns_none(self, get):
        get.side_effect = requests.Timeout("slow")
        self.assertIsNone(fetch_json("https://example.test"))

    @patch("src.http_client.requests.get")
    def test_invalid_json_returns_none(self, get):
        get.return_value = _response(200, None, text="<html>")
        self.assertIsNone(fetch_json("https://example.test"))


if __name__ == "__main__":
    unittest.main()
