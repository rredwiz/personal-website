"""Shared helper for calling upstream JSON APIs.

Every outbound request goes through ``fetch_json`` so that all of them get a
timeout (a hung upstream would otherwise tie up a gunicorn worker forever),
consistent logging, and a single place to handle network errors.
"""

from __future__ import annotations

import logging
from typing import Any, Mapping, Optional

import requests

logger = logging.getLogger(__name__)

# (connect timeout, read timeout) in seconds.
DEFAULT_TIMEOUT = (5, 10)
USER_AGENT = "andster.dev personal-website backend (+https://github.com/rredwiz/personal-website)"


def fetch_json(
    url: str,
    *,
    params: Optional[Mapping[str, Any]] = None,
    headers: Optional[Mapping[str, str]] = None,
    timeout: tuple[float, float] = DEFAULT_TIMEOUT,
) -> Any:
    """GET ``url`` and return its decoded JSON body.

    Returns ``None`` (after logging) on network errors, non-2xx responses and
    bodies that aren't valid JSON, so callers only have to handle one failure
    shape.
    """
    merged_headers = {"User-Agent": USER_AGENT, "Accept": "application/json"}
    if headers:
        merged_headers.update(headers)

    try:
        response = requests.get(url, params=params, headers=merged_headers, timeout=timeout)
    except requests.RequestException as exc:
        logger.warning("request to %s failed: %s", url, exc)
        return None

    if not 200 <= response.status_code < 300:
        logger.warning("request to %s returned HTTP %s: %.200s", url, response.status_code, response.text)
        return None

    try:
        return response.json()
    except ValueError:
        logger.warning("request to %s returned a non-JSON body", url)
        return None
