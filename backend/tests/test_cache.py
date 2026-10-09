import unittest
from unittest.mock import patch

from src.cache import TTLCache


class TTLCacheTests(unittest.TestCase):
    def test_empty_cache_returns_none(self):
        self.assertIsNone(TTLCache(10).get())

    def test_value_is_returned_until_ttl_expires(self):
        cache: TTLCache[str] = TTLCache(10)
        with patch("src.cache.time.monotonic", return_value=1000.0):
            cache.set("hello")
        with patch("src.cache.time.monotonic", return_value=1009.9):
            self.assertEqual(cache.get(), "hello")
        with patch("src.cache.time.monotonic", return_value=1010.0):
            self.assertIsNone(cache.get())

    def test_get_or_fetch_only_calls_fetch_when_cold(self):
        cache: TTLCache[dict] = TTLCache(60)
        calls = []

        def fetch():
            calls.append(1)
            return {"n": len(calls)}

        self.assertEqual(cache.get_or_fetch(fetch), {"n": 1})
        self.assertEqual(cache.get_or_fetch(fetch), {"n": 1})
        self.assertEqual(len(calls), 1)

    def test_failures_are_not_cached(self):
        cache: TTLCache[dict] = TTLCache(60)
        results = iter([None, {"ok": True}])

        def fetch():
            return next(results)

        self.assertIsNone(cache.get_or_fetch(fetch))
        self.assertEqual(cache.get_or_fetch(fetch), {"ok": True})

    def test_clear(self):
        cache: TTLCache[str] = TTLCache(60)
        cache.set("x")
        cache.clear()
        self.assertIsNone(cache.get())

    def test_negative_ttl_rejected(self):
        with self.assertRaises(ValueError):
            TTLCache(-1)


if __name__ == "__main__":
    unittest.main()
