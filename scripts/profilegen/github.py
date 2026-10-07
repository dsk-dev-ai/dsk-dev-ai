"""Resilient GitHub API client: retries, rate-limit awareness, ETag disk cache.

Standard library only. The transport is injectable so tests never touch the network.
"""

from __future__ import annotations

import hashlib
import json
import os
import sys
import time
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Callable
from http.client import IncompleteRead
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

API = "https://api.github.com"
USER_AGENT = "dsk-dev-ai-profile-refresh"

Transport = Callable[[Request], tuple[int, dict[str, str], bytes]]


class GitHubError(RuntimeError):
    """Raised when a required request cannot be satisfied."""


@dataclass
class ClientStats:
    requests: int = 0
    network: int = 0
    cache_hits: int = 0
    retries: int = 0
    rate_limited: int = 0
    urls: list[str] = field(default_factory=list)


def _default_transport(request: Request, timeout: int = 30) -> tuple[int, dict[str, str], bytes]:
    try:
        with urlopen(request, timeout=timeout) as response:  # noqa: S310 - fixed API hosts
            return response.status, dict(response.headers.items()), response.read()
    except HTTPError as exc:
        body = exc.read() if hasattr(exc, "read") else b""
        return exc.code, dict(exc.headers.items()) if exc.headers else {}, body
    except URLError as exc:
        raise ConnectionError(str(exc.reason)) from exc
    except (IncompleteRead, TimeoutError, OSError) as exc:
        # truncated/abrupt responses are transient — let the retry loop handle them
        raise ConnectionError(str(exc)) from exc


class DiskCache:
    """URL-keyed JSON cache with ETags and a max age."""

    def __init__(self, root: Path, max_age_hours: int = 6, enabled: bool = True):
        self.root = root
        self.max_age = max_age_hours * 3600
        self.enabled = enabled

    @staticmethod
    def key(url: str) -> str:
        return hashlib.sha256(url.encode("utf-8")).hexdigest()[:32]

    def _path(self, url: str) -> Path:
        return self.root / f"{self.key(url)}.json"

    def load(self, url: str, now: float | None = None) -> dict[str, Any] | None:
        if not self.enabled:
            return None
        path = self._path(url)
        if not path.exists():
            return None
        try:
            entry = json.loads(path.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError):
            return None
        saved_at = float(entry.get("saved_at") or 0)
        if self.max_age and (time.time() if now is None else now) - saved_at > self.max_age:
            # Stale entries are still usable as a fallback when rate limited.
            entry["stale"] = True
        return entry

    def save(self, url: str, data: Any, etag: str | None = None) -> None:
        if not self.enabled:
            return
        try:
            self.root.mkdir(parents=True, exist_ok=True)
            payload = {"url": url, "etag": etag, "data": data, "saved_at": time.time()}
            self._path(url).write_text(json.dumps(payload), encoding="utf-8")
        except OSError as exc:
            print(f"warning: cache write failed: {exc}", file=sys.stderr)


class GitHubClient:
    """GET/POST helper with exponential backoff and rate-limit fallbacks."""

    def __init__(
        self,
        token: str | None = None,
        cache: DiskCache | None = None,
        transport: Transport | None = None,
        sleep: Callable[[float], None] = time.sleep,
        max_retries: int = 3,
        log: Callable[[str], None] | None = None,
    ):
        self.token = token or os.environ.get("GH_TOKEN") or os.environ.get("GITHUB_TOKEN")
        self.cache = cache
        self.transport = transport or _default_transport
        self.sleep = sleep
        self.max_retries = max_retries
        self.log = log or (lambda message: print(message, file=sys.stderr))
        self.stats = ClientStats()
        self.remaining: int | None = None
        self._rate_limit_slept = False
        self._last_link_headers: dict[str, str] = {}

    # -- internals ---------------------------------------------------------

    def _headers(self, extra: dict[str, str] | None = None) -> dict[str, str]:
        headers = {
            "Accept": "application/vnd.github+json",
            "User-Agent": USER_AGENT,
            "X-GitHub-Api-Version": "2022-11-28",
        }
        if self.token:
            headers["Authorization"] = f"Bearer {self.token}"
        if extra:
            headers.update(extra)
        return headers

    def _note_rate(self, headers: dict[str, str]) -> None:
        value = headers.get("X-RateLimit-Remaining") or headers.get("x-ratelimit-remaining")
        if value is not None and str(value).isdigit():
            self.remaining = int(value)

    def _open(self, request: Request) -> tuple[int, dict[str, str], bytes]:
        return self.transport(request)

    def _rate_limited(self, status: int, headers: dict[str, str]) -> bool:
        if status not in (403, 429):
            return False
        remaining = headers.get("X-RateLimit-Remaining") or headers.get("x-ratelimit-remaining")
        retry_after = headers.get("Retry-After") or headers.get("retry-after")
        return (remaining == "0") or retry_after is not None or status == 429

    def _wait_for_reset(self, headers: dict[str, str]) -> float | None:
        """Seconds to sleep until the rate limit resets, or None if too long."""
        reset = headers.get("X-RateLimit-Reset") or headers.get("x-ratelimit-reset")
        retry_after = headers.get("Retry-After") or headers.get("retry-after")
        if retry_after:
            delay = float(retry_after)
        elif reset and str(reset).isdigit():
            delay = max(0.0, int(reset) - time.time()) + 1.0
        else:
            return None
        return delay if delay <= 120 else None

    def request(
        self,
        url: str,
        *,
        method: str = "GET",
        payload: dict[str, Any] | None = None,
        headers: dict[str, str] | None = None,
        use_cache: bool = True,
        required: bool = False,
        quiet_status: tuple[int, ...] = (),
    ) -> Any:
        """Return parsed JSON, cached JSON, or ``None`` (soft-fail by default)."""
        cached = self.cache.load(url) if (use_cache and self.cache) else None
        if cached and cached.get("stale") is not True:
            self.stats.cache_hits += 1
            self.stats.requests += 1
            self.stats.urls.append(url)
            return cached.get("data")

        request_headers = self._headers(headers)
        etag = (cached or {}).get("etag")
        if etag and method == "GET":
            request_headers["If-None-Match"] = etag

        data, status, final_headers = self._execute(url, method, request_headers, payload)
        self.stats.requests += 1
        self.stats.urls.append(url)
        self._last_link_headers = final_headers
        self._note_rate(final_headers)

        if status == 304 and cached is not None:
            self.stats.cache_hits += 1
            return cached.get("data")

        if status == 200 and data is not None:
            if use_cache and self.cache:
                self.cache.save(url, data, final_headers.get("ETag") or final_headers.get("etag"))
            return data

        if self._rate_limited(status, final_headers):
            self.stats.rate_limited += 1
            delay = self._wait_for_reset(final_headers)
            if delay and not self._rate_limit_slept:
                self._rate_limit_slept = True
                self.log(f"rate limited; sleeping {delay:.0f}s for reset")
                self.sleep(delay)
                return self.request(
                    url, method=method, payload=payload, headers=headers,
                    use_cache=use_cache, required=required, quiet_status=quiet_status,
                )
            if cached is not None:
                self.log(f"rate limited; using cached copy of {url}")
                return cached.get("data")
            if required:
                raise GitHubError(f"rate limited for {url}")
            self.log(f"warning: rate limited for {url}")
            return None

        if required:
            raise GitHubError(f"{url} -> HTTP {status}")
        if status not in quiet_status:
            self.log(f"warning: {url} -> HTTP {status}")
        return None

    def _execute(
        self,
        url: str,
        method: str,
        headers: dict[str, str],
        payload: dict[str, Any] | None,
    ) -> tuple[Any, int, dict[str, str]]:
        body = json.dumps(payload).encode("utf-8") if payload is not None else None
        last_error: Exception | None = None
        for attempt in range(self.max_retries):
            request = Request(url, data=body, headers=headers, method=method)
            try:
                status, resp_headers, raw = self._open(request)
            except (ConnectionError, TimeoutError, OSError) as exc:
                last_error = exc
                self.stats.retries += 1
                self.sleep(2 ** attempt)
                continue
            if status >= 500 and attempt + 1 < self.max_retries:
                self.stats.retries += 1
                self.sleep(2 ** attempt)
                continue
            parsed: Any = None
            if raw:
                try:
                    parsed = json.loads(raw.decode("utf-8"))
                except (UnicodeDecodeError, json.JSONDecodeError):
                    parsed = None
            return parsed, status, resp_headers
        raise GitHubError(f"request failed after {self.max_retries} attempts: {url} ({last_error})")

    # -- public helpers ----------------------------------------------------

    def get(self, url: str, **kwargs: Any) -> Any:
        return self.request(url, **kwargs)

    def graphql(self, query: str, variables: dict[str, Any] | None = None, required: bool = False) -> Any:
        """POST /graphql, cached by query+variables key."""
        key = f"graphql::{query}::{json.dumps(variables or {}, sort_keys=True)}"
        cached = self.cache.load(key) if self.cache else None
        if cached and cached.get("stale") is not True:
            self.stats.cache_hits += 1
            return cached.get("data")
        if not self.token:
            if required:
                raise GitHubError("GraphQL requires GH_TOKEN")
            return None
        data, status, headers = self._execute(
            f"{API}/graphql", "POST", self._headers({"Content-Type": "application/json"}),
            {"query": query, "variables": variables or {}},
        )
        self.stats.requests += 1
        self.stats.urls.append(key)
        self._note_rate(headers)
        if status == 200 and data is not None:
            if data.get("errors") and not (data.get("data") or {}).get("user"):
                self.log(f"warning: graphql errors: {json.dumps(data['errors'])[:200]}")
                return None
            if self.cache:
                self.cache.save(key, data, None)
            return data
        if required:
            raise GitHubError(f"graphql -> HTTP {status}")
        self.log(f"warning: graphql -> HTTP {status}")
        return None


def paginate(client: GitHubClient, url: str, limit: int, **kwargs: Any) -> list[dict[str, Any]]:
    """Follow ``Link: rel="next"`` headers up to ``limit`` items."""
    results: list[dict[str, Any]] = []
    next_url: str | None = url
    seen: set[str] = set()
    while next_url and len(results) < limit and next_url not in seen:
        seen.add(next_url)
        page = client.get(next_url, **kwargs)
        if not isinstance(page, list):
            break
        results.extend(page)
        next_url = _next_link(page, next_url, client)
    return results[:limit]


def _next_link(page: Any, current: str, client: GitHubClient) -> str | None:
    """Extract the next page URL from the Link header of the last response."""
    headers = getattr(client, "_last_link_headers", None) or {}
    if not headers:
        return None
    link = headers.get("Link") or headers.get("link") or ""
    for part in link.split(","):
        if 'rel="next"' in part:
            start = part.find("<")
            end = part.find(">", start)
            if start != -1 and end != -1:
                return part[start + 1 : end]
    return None
