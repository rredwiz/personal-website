"""A tiny thread-safe, single-value cache with a time-to-live.

Each upstream integration (Last.fm, GitHub, Monkeytype) keeps one of these so
that visitors polling the site don't translate 1:1 into upstream API calls.
Failures (``None`` results) are deliberately never cached, so a transient
upstream outage clears itself on the next request instead of sticking for the
full TTL.
"""

from __future__ import annotations

import threading
import time
from typing import Callable, Generic, Optional, TypeVar

T = TypeVar("T")


class TTLCache(Generic[T]):
    def __init__(self, ttl_seconds: float) -> None:
        if ttl_seconds < 0:
            raise ValueError("ttl_seconds must be >= 0")
        self.ttl_seconds = ttl_seconds
        self._value: Optional[T] = None
        self._expires_at = 0.0
        self._lock = threading.Lock()

    def get(self) -> Optional[T]:
        """Return the cached value, or ``None`` if nothing fresh is cached."""
        with self._lock:
            if self._value is not None and time.monotonic() < self._expires_at:
                return self._value
            return None

    def set(self, value: T) -> None:
        with self._lock:
            self._value = value
            self._expires_at = time.monotonic() + self.ttl_seconds

    def clear(self) -> None:
        with self._lock:
            self._value = None
            self._expires_at = 0.0

    def get_or_fetch(self, fetch: Callable[[], Optional[T]]) -> Optional[T]:
        """Return the cached value, or call ``fetch`` and cache its result.

        A ``None`` result from ``fetch`` is returned but not cached.
        """
        cached = self.get()
        if cached is not None:
            return cached
        value = fetch()
        if value is not None:
            self.set(value)
        return value
