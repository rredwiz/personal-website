"""Recent public push events, via the GitHub Events API."""

from __future__ import annotations

import logging
import os
from typing import Any, Optional

from src.cache import TTLCache
from src.http_client import fetch_json

logger = logging.getLogger(__name__)

DEFAULT_USERNAME = "rredwiz"
MAX_EVENTS = 5
EVENTS_PER_PAGE = 30

# GitHub's events feed is only updated every few minutes anyway.
CACHE_TTL_SECONDS = 300
_cache: TTLCache[dict] = TTLCache(CACHE_TTL_SECONDS)


def _username() -> str:
    return os.environ.get("GITHUB_USERNAME") or DEFAULT_USERNAME


def get_github_events() -> Optional[dict]:
    return _cache.get_or_fetch(_fetch_events)


def _fetch_events() -> Optional[dict]:
    # The *public* feed is used on purpose: with a token, the plain /events
    # feed also includes activity from private repositories.
    url = f"https://api.github.com/users/{_username()}/events/public"
    headers = {
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
    }
    token = os.environ.get("GITHUB_API_KEY")
    if token:
        headers["Authorization"] = f"Bearer {token}"

    data = fetch_json(url, headers=headers, params={"per_page": EVENTS_PER_PAGE})
    if data is None:
        return None
    return create_github_json(data)


def _head_commit(payload: dict) -> Optional[dict]:
    """The commit a push ended on: the one matching ``payload.head``, else the last."""
    commits = [c for c in (payload.get("commits") or []) if isinstance(c, dict)]
    if not commits:
        return None
    head_sha = payload.get("head")
    for commit in commits:
        if head_sha and commit.get("sha") == head_sha:
            return commit
    return commits[-1]


def create_github_json(events: Any) -> dict:
    """Shape the raw events feed into the newest ``MAX_EVENTS`` pushes.

    Non-push events are skipped (not treated as the end of the feed) and pushes
    without commits (e.g. branch deletions) are ignored. URLs point at
    github.com pages rather than the API endpoints the feed contains.
    """
    shaped = []
    for event in events if isinstance(events, list) else []:
        if len(shaped) >= MAX_EVENTS:
            break
        if not isinstance(event, dict) or event.get("type") != "PushEvent":
            continue
        commit = _head_commit(event.get("payload") or {})
        repo_name = (event.get("repo") or {}).get("name")
        if commit is None or not repo_name:
            continue

        sha = commit.get("sha") or ""
        message = str(commit.get("message") or "").strip()
        repo_url = f"https://github.com/{repo_name}"
        shaped.append(
            {
                "message": message.splitlines()[0] if message else "",
                "repo_name": repo_name,
                "repo_url": repo_url,
                "commit_url": f"{repo_url}/commit/{sha}" if sha else repo_url,
                "type": event["type"],
                "created_at": event.get("created_at"),
            }
        )
    return {"events": shaped}
