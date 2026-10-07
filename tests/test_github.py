"""GitHub client behaviour: retries, caching, rate limits, pagination."""

from __future__ import annotations

import json
import tempfile
import time
import unittest
from collections import deque
from pathlib import Path
from urllib.request import Request

from profilegen.github import DiskCache, GitHubClient, GitHubError, paginate

URL = "https://api.github.com/users/dsk-dev-ai"


def encode(body):
    if isinstance(body, (dict, list)):
        return json.dumps(body).encode("utf-8")
    if isinstance(body, str):
        return body.encode("utf-8")
    return body


class FakeTransport:
    """Scripted responses; raises if called more often than scripted."""

    def __init__(self, *responses):
        self.responses = deque(responses)
        self.requests: list[Request] = []

    def __call__(self, request: Request):
        self.requests.append(request)
        if not self.responses:
            raise AssertionError(f"unexpected request: {request.full_url}")
        response = self.responses.popleft()
        if isinstance(response, Exception):
            raise response
        status, headers, body = response
        return status, headers, encode(body)

    @property
    def headers(self) -> list[dict[str, str]]:
        return [{k.lower(): v for k, v in req.header_items()} for req in self.requests]


class GitHubClientTests(unittest.TestCase):
    def setUp(self) -> None:
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.cache = DiskCache(Path(self.tmp.name), max_age_hours=6)
        self.sleeps: list[float] = []

    def client(self, transport, **kwargs) -> GitHubClient:
        kwargs.setdefault("cache", self.cache)
        kwargs.setdefault("sleep", self.sleeps.append)
        kwargs.setdefault("token", "test-token")
        kwargs.setdefault("log", lambda _message: None)
        return GitHubClient(transport=transport, **kwargs)

    def test_get_parses_json_and_caches(self) -> None:
        transport = FakeTransport((200, {"ETag": '"v1"'}, {"login": "dsk-dev-ai"}))
        client = self.client(transport)

        first = client.get(URL)
        second = client.get(URL)

        self.assertEqual(first["login"], "dsk-dev-ai")
        self.assertEqual(second, first)
        self.assertEqual(len(transport.requests), 1, "second call must be served from cache")
        self.assertEqual(client.stats.cache_hits, 1)

    def test_conditional_request_revalidates_with_etag(self) -> None:
        # A stale cache entry must trigger an If-None-Match revalidation.
        self.cache.save(URL, {"login": "cached"}, '"v1"')
        entry = Path(self.tmp.name) / f"{DiskCache.key(URL)}.json"
        payload = json.loads(entry.read_text(encoding="utf-8"))
        payload["saved_at"] = time.time() - 86400
        entry.write_text(json.dumps(payload), encoding="utf-8")

        transport = FakeTransport((304, {}, ""))
        client = self.client(transport)

        self.assertEqual(client.get(URL), {"login": "cached"})
        self.assertEqual(transport.headers[0].get("if-none-match"), '"v1"')
        self.assertEqual(client.stats.cache_hits, 1)

    def test_retries_server_errors_with_backoff(self) -> None:
        transport = FakeTransport(
            (500, {}, "boom"),
            (502, {}, "bad gateway"),
            (200, {}, {"ok": True}),
        )
        client = self.client(transport)

        self.assertEqual(client.get(URL), {"ok": True})
        self.assertEqual(self.sleeps, [1, 2])
        self.assertEqual(client.stats.retries, 2)

    def test_connection_errors_are_retried(self) -> None:
        transport = FakeTransport(
            ConnectionError("dns down"),
            ConnectionError("dns down"),
            (200, {}, {"ok": True}),
        )
        client = self.client(transport)
        self.assertEqual(client.get(URL), {"ok": True})
        self.assertEqual(client.stats.retries, 2)

    def test_rate_limit_falls_back_to_stale_cache(self) -> None:
        self.cache.save(URL, {"login": "stale"}, None)
        entry = Path(self.tmp.name) / f"{DiskCache.key(URL)}.json"
        payload = json.loads(entry.read_text(encoding="utf-8"))
        payload["saved_at"] = time.time() - 86400
        entry.write_text(json.dumps(payload), encoding="utf-8")

        transport = FakeTransport((403, {"X-RateLimit-Remaining": "0"}, "rate limited"))
        client = self.client(transport)

        self.assertEqual(client.get(URL), {"login": "stale"})
        self.assertEqual(client.stats.rate_limited, 1)
        self.assertEqual(self.sleeps, [], "no reset window available, so no sleep")

    def test_rate_limit_sleeps_until_reset_then_retries(self) -> None:
        reset = int(time.time()) + 30
        transport = FakeTransport(
            (403, {"X-RateLimit-Remaining": "0", "X-RateLimit-Reset": str(reset)}, "limited"),
            (200, {}, {"login": "fresh"}),
        )
        client = self.client(transport)

        self.assertEqual(client.get(URL), {"login": "fresh"})
        self.assertEqual(len(self.sleeps), 1)
        self.assertAlmostEqual(self.sleeps[0], 31, delta=3)
        self.assertEqual(len(transport.requests), 2)

    def test_soft_failure_returns_none(self) -> None:
        client = self.client(FakeTransport((404, {}, "nope")), cache=None)
        self.assertIsNone(client.get(URL))

    def test_required_failure_raises(self) -> None:
        client = self.client(FakeTransport((404, {}, "nope")), cache=None)
        with self.assertRaises(GitHubError):
            client.get(URL, required=True)

    def test_graphql_requires_token(self) -> None:
        client = self.client(FakeTransport(), token=None)
        self.assertIsNone(client.graphql("query { viewer { login } }"))
        with self.assertRaises(GitHubError):
            client.graphql("query { viewer { login } }", required=True)

    def test_graphql_caches_by_query(self) -> None:
        transport = FakeTransport((200, {}, {"data": {"viewer": {"login": "x"}}}))
        client = self.client(transport)
        query = "query { viewer { login } }"

        self.assertEqual(client.graphql(query)["data"]["viewer"]["login"], "x")
        self.assertEqual(client.graphql(query)["data"]["viewer"]["login"], "x")
        self.assertEqual(len(transport.requests), 1)


class PaginateTests(unittest.TestCase):
    def test_follows_next_link(self) -> None:
        link = '<https://api.github.com/users/x/repos?page=2>; rel="next"'
        transport = FakeTransport(
            (200, {"Link": link}, [{"id": 1}, {"id": 2}]),
            (200, {}, [{"id": 3}]),
        )
        client = GitHubClient(cache=None, transport=transport, sleep=lambda _s: None, token=None)
        page = paginate(client, "https://api.github.com/users/x/repos", limit=10)
        self.assertEqual([item["id"] for item in page], [1, 2, 3])

    def test_respects_limit(self) -> None:
        transport = FakeTransport((200, {}, [{"id": 1}]))
        client = GitHubClient(cache=None, transport=transport, sleep=lambda _s: None, token=None)
        page = paginate(client, "https://api.github.com/users/x/repos", limit=1)
        self.assertEqual(len(page), 1)
        self.assertEqual(len(transport.requests), 1)


if __name__ == "__main__":
    unittest.main()
