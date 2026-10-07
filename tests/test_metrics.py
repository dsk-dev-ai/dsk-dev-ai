"""Metrics: language mix, health scoring, star cadence, history trends."""

from __future__ import annotations

import json
import tempfile
import unittest
from datetime import datetime, timedelta, timezone
from pathlib import Path

from profilegen import metrics
from profilegen.models import Profile, Repo, StarPoint

NOW = datetime(2026, 10, 7, 12, 0, tzinfo=timezone.utc)

REPO_PAYLOAD = {
    "name": "demo",
    "full_name": "dsk-dev-ai/demo",
    "description": "A demo repository",
    "language": "Python",
    "stargazers_count": 4,
    "forks_count": 1,
    "open_issues_count": 2,
    "watchers_count": 4,
    "created_at": "2025-01-01T00:00:00Z",
    "pushed_at": "2026-10-01T00:00:00Z",
    "updated_at": "2026-10-01T00:00:00Z",
    "homepage": "",
    "topics": [],
    "archived": False,
    "fork": False,
    "is_template": False,
    "default_branch": "main",
    "license": {"spdx_id": "MIT"},
    "html_url": "https://github.com/dsk-dev-ai/demo",
}

FULL_TREE = [
    "README.md",
    "LICENSE",
    ".github/workflows/ci.yml",
    "src/app.py",
    "tests/test_app.py",
]


def repo(**overrides) -> Repo:
    payload = {**REPO_PAYLOAD, **overrides}
    return Repo.from_api(payload)


def profile(**overrides) -> Profile:
    payload = {
        "login": "dsk-dev-ai",
        "followers": 7,
        "following": 7,
        "public_repos": 30,
        **overrides,
    }
    return Profile.from_api(payload)


class LanguageMixTests(unittest.TestCase):
    def test_counts_and_shares(self) -> None:
        repos = [repo(), repo(), repo(language="TypeScript"), repo(language=None)]
        mix = metrics.language_mix(repos, limit=5)
        self.assertEqual(mix[0][0], "Python")
        self.assertEqual(mix[0][1], 2)
        self.assertAlmostEqual(mix[0][1] / sum(n for _, n, _ in mix), 2 / 3)
        self.assertEqual(len(mix), 2, "repositories without a language are skipped")

    def test_limit_is_respected(self) -> None:
        repos = [repo(language="Python"), repo(language="Go"), repo(language="Rust")]
        self.assertEqual(len(metrics.language_mix(repos, limit=2)), 2)


class HealthTests(unittest.TestCase):
    def test_complete_repository_scores_100(self) -> None:
        row = metrics.health_row(repo(), FULL_TREE, released=True, now=NOW)
        self.assertEqual(row.score, 100)
        self.assertTrue(all(ok for _, ok in row.checks))

    def test_missing_signals_lower_the_score(self) -> None:
        row = metrics.health_row(repo(description="", license=None), ["src/app.py"], released=False, now=NOW)
        passed = {name for name, ok in row.checks if ok}
        self.assertEqual(passed, {"active 90d"})
        self.assertEqual(row.score, 14)

    def test_detects_common_test_layouts(self) -> None:
        cases = {
            "tests/test_a.py": True,
            "server/src/__tests__/x.spec.ts": True,
            "spec/parser_spec.rb": True,
            "src/test_utils.py": True,
            "src/main.py": False,
            "attests/sign.go": False,
        }
        for path, expected in cases.items():
            with self.subTest(path=path):
                row = metrics.health_row(repo(), [path], released=False, now=NOW)
                self.assertEqual(dict(row.checks)["tests"], expected)

    def test_inactive_repository_flagged(self) -> None:
        stale = repo(pushed_at="2025-01-01T00:00:00Z")
        row = metrics.health_row(stale, FULL_TREE, released=True, now=NOW)
        self.assertFalse(dict(row.checks)["active 90d"])


class StarCadenceTests(unittest.TestCase):
    def test_buckets_only_inside_window(self) -> None:
        stars = [
            StarPoint(starred_at="2026-10-01T10:00:00Z"),
            StarPoint(starred_at="2026-10-01T11:00:00Z"),
            StarPoint(starred_at="2026-08-01T11:00:00Z"),
        ]
        buckets = metrics.star_days(stars, days=7, now=NOW)
        self.assertEqual(len(buckets), 7)
        self.assertEqual(sum(count for _, count in buckets), 2)
        self.assertEqual(buckets[-1], ("2026-10-07", 0))


class HistoryTests(unittest.TestCase):
    def setUp(self) -> None:
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.path = Path(self.tmp.name) / "history.json"

    def test_first_snapshot_and_delta(self) -> None:
        history, changed = metrics.record_snapshot(self.path, profile(), [repo()], now=NOW)
        self.assertTrue(changed)
        self.assertEqual(history[-1]["date"], "2026-10-07")
        self.assertEqual(history[-1]["stars"], 4)
        self.assertEqual(history[-1]["followers"], 7)

    def test_same_day_snapshot_is_idempotent(self) -> None:
        history, _ = metrics.record_snapshot(self.path, profile(), [repo()], now=NOW)
        metrics.save_history(self.path, history)
        history, changed = metrics.record_snapshot(self.path, profile(), [repo()], now=NOW)
        self.assertFalse(changed)
        self.assertEqual(len(history), 1)

    def test_prunes_old_snapshots(self) -> None:
        old = [{"date": "2020-01-01", "stars": 1, "followers": 1, "repos": 1}]
        self.path.write_text(json.dumps({"snapshots": old}), encoding="utf-8")
        history, _ = metrics.record_snapshot(
            self.path, profile(), [repo()], keep_days=30, now=NOW
        )
        self.assertEqual([s["date"] for s in history], ["2026-10-07"])

    def test_save_load_roundtrip(self) -> None:
        history, _ = metrics.record_snapshot(self.path, profile(), [repo()], now=NOW)
        metrics.save_history(self.path, history)
        self.assertEqual(metrics.load_history(self.path), history)

    def test_delta_against_week_old_baseline(self) -> None:
        history = [
            {"date": "2026-09-25", "stars": 10},
            {"date": "2026-10-01", "stars": 12},
            {"date": "2026-10-07", "stars": 15},
        ]
        points = metrics.series(history, "stars")
        self.assertEqual(metrics.delta(points, 7, NOW), 5)
        # No baseline older than 30 days exists yet, so the 30d delta is unknown.
        self.assertIsNone(metrics.delta(points, 30, NOW))

    def test_delta_without_baseline_is_none(self) -> None:
        points = [("2026-10-07", 5)]
        self.assertIsNone(metrics.delta(points, 7, NOW))

    def test_load_history_survives_garbage(self) -> None:
        self.path.write_text("{not json", encoding="utf-8")
        self.assertEqual(metrics.load_history(self.path), [])


class TotalsTests(unittest.TestCase):
    def test_ignores_forks(self) -> None:
        repos = [repo(), repo(fork=True, stargazers_count=99)]
        totals = metrics.totals(profile(), repos)
        self.assertEqual(totals["stars"], 4)

    def test_still_counts_forks_for_repo_total(self) -> None:
        repos = [repo(), repo(name="other", full_name="dsk-dev-ai/other", fork=True)]
        totals = metrics.totals(profile(), repos)
        self.assertEqual(totals["repo_count"], 30)


if __name__ == "__main__":
    unittest.main()
