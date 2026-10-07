"""Derived metrics: language mix, health scoring, star cadence, history trends."""

from __future__ import annotations

import json
from collections import Counter
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any, Iterable

from .models import HealthRow, Profile, Repo, StarPoint

ACTIVE_DAYS = 90


# -- languages -------------------------------------------------------------

def language_mix(repos: Iterable[Repo], limit: int = 5) -> list[tuple[str, int, float]]:
    """``[(language, repo_count, share)]`` sorted by count descending."""
    counts: Counter[str] = Counter(repo.language for repo in repos if repo.language)
    total = sum(counts.values()) or 1
    return [(lang, n, n / total) for lang, n in counts.most_common(limit)]


# -- health ----------------------------------------------------------------

def health_row(
    repo: Repo,
    paths: Iterable[str] = (),
    released: bool = False,
    active_days: int = ACTIVE_DAYS,
    now: datetime | None = None,
) -> HealthRow:
    """Score a repository 0-100 from six observable signals."""
    path_set = {p.removeprefix("./") for p in paths}
    lower = {p.lower() for p in path_set}
    now = now or datetime.now(timezone.utc)

    checks: list[tuple[str, bool]] = [
        ("description", bool(repo.description)),
        ("README", any(p.startswith("readme") for p in lower)),
        ("license", bool(repo.license) or any(p.startswith(("license", "licence")) for p in lower)),
        ("CI", any(p.startswith(".github/workflows/") and p.endswith((".yml", ".yaml")) for p in lower)),
        ("tests", _has_tests(lower)),
        ("release", released),
    ]
    if repo.pushed_at:
        pushed = _parse(repo.pushed_at)
        active = bool(pushed and (now - pushed) <= timedelta(days=active_days))
        checks.append(("active 90d", active))

    score = round(100 * sum(ok for _, ok in checks) / len(checks))
    return HealthRow(repo=repo, score=score, checks=tuple(checks))


def _has_tests(lower_paths: set[str]) -> bool:
    markers = ("/tests/", "/test/", "/__tests__/", "/spec/")
    for path in lower_paths:
        if any(marker in f"/{path}" for marker in markers):
            return True
        name = path.rsplit("/", 1)[-1]
        if name.startswith(("test_", "test.", "spec.")) and name.endswith((".py", ".js", ".ts", ".rs", ".go")):
            return True
    return False


def _parse(value: str) -> datetime | None:
    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        return None


# -- star cadence ----------------------------------------------------------

def star_days(stars: Iterable[StarPoint], days: int = 30, now: datetime | None = None) -> list[tuple[str, int]]:
    """Daily star counts for the last ``days`` days (oldest first)."""
    now = now or datetime.now(timezone.utc)
    counts: Counter[str] = Counter()
    for star in stars:
        stamp = _parse(star.starred_at)
        if stamp and (now - stamp) <= timedelta(days=days):
            counts[stamp.date().isoformat()] += 1
    start = (now - timedelta(days=days - 1)).date()
    out: list[tuple[str, int]] = []
    for offset in range(days):
        day = (start + timedelta(days=offset)).isoformat()
        out.append((day, counts.get(day, 0)))
    return out


# -- history / trends ------------------------------------------------------

def load_history(path: Path) -> list[dict[str, Any]]:
    if not path.exists():
        return []
    try:
        raw = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return []
    snapshots = raw.get("snapshots") if isinstance(raw, dict) else raw
    if not isinstance(snapshots, list):
        return []
    return [s for s in snapshots if isinstance(s, dict) and s.get("date")]


def record_snapshot(
    path: Path,
    profile: Profile | None,
    repos: list[Repo],
    keep_days: int = 180,
    now: datetime | None = None,
) -> tuple[list[dict[str, Any]], bool]:
    """Upsert today's snapshot. Returns ``(history, changed)``."""
    now = now or datetime.now(timezone.utc)
    today = now.date().isoformat()
    history = load_history(path)
    languages = Counter(repo.language for repo in repos if repo.language)
    entry = {
        "date": today,
        "stars": sum(repo.stars for repo in repos),
        "followers": profile.followers if profile else 0,
        "repos": profile.public_repos if profile else len(repos),
        "languages": dict(languages.most_common()),
    }
    existing = next((s for s in history if s.get("date") == today), None)
    changed = existing != entry
    history = [s for s in history if s.get("date") != today]
    history.append(entry)
    history.sort(key=lambda s: s["date"])
    cutoff = (now - timedelta(days=keep_days)).date().isoformat()
    history = [s for s in history if s["date"] >= cutoff]
    return history, changed


def save_history(path: Path, history: list[dict[str, Any]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps({"snapshots": history}, indent=2) + "\n", encoding="utf-8")


def series(history: list[dict[str, Any]], key: str) -> list[tuple[str, int]]:
    """``[(date, value)]`` for the requested metric, oldest first."""
    out: list[tuple[str, int]] = []
    for snap in history:
        value = snap.get(key)
        if isinstance(value, (int, float)):
            out.append((snap["date"], int(value)))
    return out


def delta(points: list[tuple[str, int]], days: int, now: datetime | None = None) -> int | None:
    """Latest value minus the value roughly ``days`` ago (None if no baseline)."""
    if not points:
        return None
    now = now or datetime.now(timezone.utc)
    cutoff = (now - timedelta(days=days)).date().isoformat()
    latest = points[-1][1]
    baseline = next((value for date, value in reversed(points) if date <= cutoff), None)
    if baseline is None:
        return None if len(points) < 2 or points[0][0] > cutoff else latest - points[0][1]
    return latest - baseline


def totals(profile: Profile | None, repos: list[Repo]) -> dict[str, int]:
    own = [repo for repo in repos if not repo.fork]
    return {
        "repo_count": profile.public_repos if profile else len(own),
        "stars": sum(repo.stars for repo in own),
        "followers": profile.followers if profile else 0,
        "following": profile.following if profile else 0,
        "forks": sum(repo.forks for repo in own),
    }
