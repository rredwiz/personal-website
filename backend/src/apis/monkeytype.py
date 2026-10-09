"""Typing stats (recent average and personal best), via the Monkeytype API."""

from __future__ import annotations

import logging
import os
from typing import Any, Optional

from src.cache import TTLCache
from src.http_client import fetch_json

logger = logging.getLogger(__name__)

RESULTS_URL = "https://api.monkeytype.com/results"
PERSONAL_BESTS_URL = "https://api.monkeytype.com/users/personalBests"

# Only "time 15" tests in these languages count towards the numbers on the site.
TARGET_LANGUAGES = frozenset({"english", "english_1k"})
TARGET_MODE = "time"
TARGET_MODE2 = "15"
RESULTS_LIMIT = 100

# Monkeytype ApeKeys are rate limited, so results are cached for an hour.
CACHE_TTL_SECONDS = 3600
_cache: TTLCache[dict] = TTLCache(CACHE_TTL_SECONDS)


def get_monkeytype_scores_info() -> Optional[dict]:
    return _cache.get_or_fetch(_fetch_scores)


def _fetch_scores() -> Optional[dict]:
    ape_key = os.environ.get("APE_KEY")
    if not ape_key:
        logger.error("APE_KEY is not set; cannot fetch Monkeytype stats")
        return None

    headers = {"Authorization": f"ApeKey {ape_key}"}
    results = fetch_json(RESULTS_URL, headers=headers, params={"limit": str(RESULTS_LIMIT)})
    bests = fetch_json(PERSONAL_BESTS_URL, headers=headers, params={"mode": TARGET_MODE})
    if results is None or bests is None:
        return None

    best = best_wpm(bests)
    if best is None:
        logger.warning("no %s-second personal best found for %s", TARGET_MODE2, sorted(TARGET_LANGUAGES))
        return None

    return {"averagewpm": average_wpm(results), "bestwpm": best}


def _is_number(value: Any) -> bool:
    return isinstance(value, (int, float)) and not isinstance(value, bool)


def _is_target_test(test: Any) -> bool:
    return (
        isinstance(test, dict)
        and test.get("language") in TARGET_LANGUAGES
        and test.get("mode") == TARGET_MODE
        and str(test.get("mode2")) == TARGET_MODE2
        and _is_number(test.get("wpm"))
    )


def average_wpm(results_json: Any) -> float:
    """Average WPM of the matching tests in a ``/results`` response (0.0 if none)."""
    tests = (results_json or {}).get("data") if isinstance(results_json, dict) else None
    wpms = [test["wpm"] for test in (tests or []) if _is_target_test(test)]
    if not wpms:
        logger.info("no matching tests in results; average wpm is 0.0")
        return 0.0
    return round(sum(wpms) / len(wpms), 1)


def best_wpm(bests_json: Any) -> Optional[float]:
    """Highest WPM among the matching entries of a ``/users/personalBests`` response."""
    data = (bests_json or {}).get("data") if isinstance(bests_json, dict) else None
    entries = (data or {}).get(TARGET_MODE2) if isinstance(data, dict) else None
    candidates = [
        entry["wpm"]
        for entry in (entries or [])
        if isinstance(entry, dict)
        and entry.get("language") in TARGET_LANGUAGES
        and _is_number(entry.get("wpm"))
    ]
    if not candidates:
        return None
    return max(candidates)
