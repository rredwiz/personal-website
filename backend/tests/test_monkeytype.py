import unittest
from unittest.mock import patch

from src.apis import monkeytype
from tests.fixtures import MONKEYTYPE_PERSONAL_BESTS, MONKEYTYPE_RESULTS, monkeytype_result


class AverageWpmTests(unittest.TestCase):
    def test_only_time_15_tests_in_target_languages_count(self):
        # (100 + 120 + 140) / 3 — the 999s are the wrong mode, duration or language.
        self.assertEqual(monkeytype.average_wpm(MONKEYTYPE_RESULTS), 120.0)

    def test_english_1k_does_not_bypass_the_mode_filter(self):
        # Regression: the old condition was `A or B and C and D`, which counted
        # every english_1k test regardless of mode/duration.
        results = {"data": [monkeytype_result(300, language="english_1k", mode="words", mode2="50")]}
        self.assertEqual(monkeytype.average_wpm(results), 0.0)

    def test_mode2_may_be_a_number_or_a_string(self):
        results = {"data": [monkeytype_result(100, mode2=15), monkeytype_result(110, mode2="15")]}
        self.assertEqual(monkeytype.average_wpm(results), 105.0)

    def test_rounds_to_one_decimal(self):
        results = {"data": [monkeytype_result(100), monkeytype_result(101), monkeytype_result(101)]}
        self.assertEqual(monkeytype.average_wpm(results), 100.7)

    def test_garbage_input_is_zero(self):
        self.assertEqual(monkeytype.average_wpm(None), 0.0)
        self.assertEqual(monkeytype.average_wpm({"data": None}), 0.0)
        self.assertEqual(monkeytype.average_wpm({"data": [{"wpm": "fast"}, "x", None]}), 0.0)


class BestWpmTests(unittest.TestCase):
    def test_takes_the_highest_15s_score_across_target_languages(self):
        self.assertEqual(monkeytype.best_wpm(MONKEYTYPE_PERSONAL_BESTS), 151.2)

    def test_ignores_other_languages_and_durations(self):
        bests = {
            "data": {
                "15": [{"language": "german", "wpm": 400}],
                "30": [{"language": "english", "wpm": 500}],
            }
        }
        self.assertIsNone(monkeytype.best_wpm(bests))

    def test_missing_15s_bucket(self):
        self.assertIsNone(monkeytype.best_wpm({"data": {"30": []}}))
        self.assertIsNone(monkeytype.best_wpm({"data": None}))
        self.assertIsNone(monkeytype.best_wpm(None))


class GetScoresTests(unittest.TestCase):
    def setUp(self):
        monkeytype._cache.clear()

    @patch.dict("os.environ", {"APE_KEY": ""})
    @patch("src.apis.monkeytype.fetch_json")
    def test_missing_ape_key_does_not_call_upstream(self, fetch_json):
        self.assertIsNone(monkeytype.get_monkeytype_scores_info())
        fetch_json.assert_not_called()

    @patch.dict("os.environ", {"APE_KEY": "ape"})
    @patch("src.apis.monkeytype.fetch_json")
    def test_combines_average_and_best_and_caches(self, fetch_json):
        fetch_json.side_effect = [MONKEYTYPE_RESULTS, MONKEYTYPE_PERSONAL_BESTS]

        data = monkeytype.get_monkeytype_scores_info()

        self.assertEqual(data, {"averagewpm": 120.0, "bestwpm": 151.2})
        self.assertEqual(fetch_json.call_count, 2)
        for call in fetch_json.call_args_list:
            self.assertEqual(call.kwargs["headers"], {"Authorization": "ApeKey ape"})

        # Second call is served from cache.
        self.assertEqual(monkeytype.get_monkeytype_scores_info(), data)
        self.assertEqual(fetch_json.call_count, 2)

    @patch.dict("os.environ", {"APE_KEY": "ape"})
    @patch("src.apis.monkeytype.fetch_json")
    def test_upstream_failure_is_not_cached(self, fetch_json):
        # Regression: a failed fetch used to be cached as {"averagewpm": None, ...} for an hour.
        fetch_json.side_effect = [
            None,
            MONKEYTYPE_PERSONAL_BESTS,
            MONKEYTYPE_RESULTS,
            MONKEYTYPE_PERSONAL_BESTS,
        ]

        self.assertIsNone(monkeytype.get_monkeytype_scores_info())
        self.assertEqual(monkeytype.get_monkeytype_scores_info(), {"averagewpm": 120.0, "bestwpm": 151.2})

    @patch.dict("os.environ", {"APE_KEY": "ape"})
    @patch("src.apis.monkeytype.fetch_json")
    def test_no_personal_best_means_no_data(self, fetch_json):
        fetch_json.side_effect = [MONKEYTYPE_RESULTS, {"data": {"15": []}}]
        self.assertIsNone(monkeytype.get_monkeytype_scores_info())


if __name__ == "__main__":
    unittest.main()
