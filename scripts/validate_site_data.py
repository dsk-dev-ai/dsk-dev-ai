#!/usr/bin/env python3
"""Validate the committed site snapshot before it is deployed.

Checks structure, cross-references, aggregate consistency, and — importantly —
that private repositories never leak activity or PR titles into the public
``site/data/profile.json`` payload.

    python3 scripts/validate_site_data.py
    python3 scripts/validate_site_data.py --max-age-hours 30
"""

from __future__ import annotations

import argparse
import json
import sys
import tomllib
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DEFAULT_DATA = ROOT / "site" / "data" / "profile.json"
DEFAULT_CONFIG = ROOT / "scripts" / "profile.toml"

PROJECT_FIELDS = (
    "slug",
    "name",
    "full_name",
    "description",
    "language",
    "stars",
    "forks",
    "url",
    "pushed_at",
    "created_at",
    "topics",
    "has_readme",
)
PROFILE_FIELDS = (
    "login",
    "name",
    "followers",
    "following",
    "public_repos",
    "stars",
    "forks",
)
STAT_FIELDS = (
    "merged_prs_total",
    "merged_repos_total",
    "public_prs",
    "org_public_prs",
    "upstream_prs",
    "org_prs",
    "own_prs",
    "merged_by_month",
)


class Report:
    def __init__(self) -> None:
        self.errors: list[str] = []
        self.warnings: list[str] = []

    def error(self, message: str) -> None:
        self.errors.append(message)

    def warn(self, message: str) -> None:
        self.warnings.append(message)

    def finish(self, summary: str) -> int:
        for warning in self.warnings:
            print(f"warning: {warning}", file=sys.stderr)
        if self.errors:
            for error in self.errors:
                print(f"error: {error}", file=sys.stderr)
            print(f"FAILED ({len(self.errors)} error(s))", file=sys.stderr)
            return 1
        print(f"OK {summary}")
        return 0


def require(data: dict, fields: tuple[str, ...], where: str, report: Report) -> None:
    for field in fields:
        if field not in data:
            report.error(f"{where}: missing '{field}'")


def parse_iso(value: str) -> datetime | None:
    try:
        parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    except (AttributeError, ValueError):
        return None
    return parsed if parsed.tzinfo else parsed.replace(tzinfo=timezone.utc)


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("path", nargs="?", default=str(DEFAULT_DATA))
    parser.add_argument("--config", default=str(DEFAULT_CONFIG))
    parser.add_argument(
        "--max-age-hours",
        type=float,
        default=0,
        help="warn when the snapshot is older than this (0 disables)",
    )
    args = parser.parse_args(argv)

    report = Report()
    data_path = Path(args.path)
    try:
        data = json.loads(data_path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        print(f"error: cannot read {data_path}: {exc}", file=sys.stderr)
        return 1
    if not isinstance(data, dict):
        print("error: profile.json must be a JSON object", file=sys.stderr)
        return 1

    require(
        data,
        ("generated_at", "profile", "stats", "languages", "featured", "projects", "readmes", "activity", "contributions"),
        "root",
        report,
    )
    if report.errors:
        return report.finish("")

    generated = parse_iso(data.get("generated_at", ""))
    if generated is None:
        report.error("generated_at is not a valid ISO timestamp")
    elif args.max_age_hours > 0:
        age_hours = (datetime.now(timezone.utc) - generated).total_seconds() / 3600
        if age_hours > args.max_age_hours:
            report.warn(f"snapshot is {age_hours:.1f}h old (limit {args.max_age_hours}h)")

    require(data["profile"], PROFILE_FIELDS, "profile", report)
    require(data["stats"], STAT_FIELDS, "stats", report)

    projects = data["projects"]
    if not isinstance(projects, list) or not projects:
        report.error("projects must be a non-empty list")
        projects = []

    slugs: list[str] = []
    full_names: set[str] = set()
    for index, project in enumerate(projects):
        where = f"projects[{index}]"
        if not isinstance(project, dict):
            report.error(f"{where}: must be an object")
            continue
        require(project, PROJECT_FIELDS, where, report)
        slug = project.get("slug", "")
        slugs.append(slug)
        full_names.add(project.get("full_name", ""))
        if not slug or slug != slug.lower() or "/" in slug:
            report.error(f"{where}: invalid slug '{slug}'")
        url = project.get("url", "")
        if not url.startswith("https://github.com/"):
            report.error(f"{where}: url is not a GitHub URL: {url}")
        if project.get("archived") and project.get("has_readme"):
            pass  # archived repos may still have a README
    if len(slugs) != len(set(slugs)):
        report.error("project slugs are not unique")
    if "" in full_names:
        report.error("a project is missing full_name")

    readmes = data["readmes"]
    if not isinstance(readmes, dict):
        report.error("readmes must be an object")
        readmes = {}
    if set(readmes) != set(slugs):
        missing = sorted(set(slugs) - set(readmes))
        extra = sorted(set(readmes) - set(slugs))
        if missing:
            report.error(f"readmes missing project keys: {', '.join(missing[:5])}")
        if extra:
            report.warn(f"readmes has unknown keys: {', '.join(extra[:5])}")

    featured = data["featured"]
    if not isinstance(featured, list) or not featured:
        report.error("featured must be a non-empty list")
        featured = []
    if len(featured) > min(9, len(projects)):
        report.error(f"featured has {len(featured)} entries; the grid supports at most 9")
    if len(featured) != len(set(featured)):
        report.error("featured contains duplicates")
    for slug in featured:
        if slug not in slugs:
            report.error(f"featured references unknown project '{slug}'")
        elif not readmes.get(slug):
            report.warn(f"featured project '{slug}' has no README")

    stats = data["stats"]
    total = stats.get("merged_prs_total", 0)
    parts = (
        stats.get("upstream_prs", 0)
        + stats.get("org_prs", 0)
        + stats.get("own_prs", 0)
    )
    if total != parts:
        report.error(f"merged_prs_total ({total}) != upstream+org+own ({parts})")
    if stats.get("public_prs", 0) > total:
        report.error("public_prs cannot exceed merged_prs_total")
    if stats.get("org_public_prs", 0) > stats.get("org_prs", 0):
        report.error("org_public_prs cannot exceed org_prs")

    months = stats.get("merged_by_month")
    if not isinstance(months, list) or len(months) != 12:
        report.error("merged_by_month must contain exactly 12 months")
        months = []
    keys = [entry.get("month", "") for entry in months if isinstance(entry, dict)]
    if keys != sorted(keys):
        report.error("merged_by_month is not sorted ascending")
    for entry in months:
        if not isinstance(entry, dict) or not str(entry.get("month", "")).count("-") == 1:
            report.error(f"invalid merged_by_month entry: {entry!r}")
        elif not isinstance(entry.get("count"), int) or entry["count"] < 0:
            report.error(f"invalid merged_by_month count: {entry!r}")

    languages = data["languages"]
    if not isinstance(languages, list) or not languages:
        report.error("languages must be a non-empty list")
    else:
        share = 0.0
        for entry in languages:
            if not isinstance(entry, dict) or "name" not in entry or "share" not in entry:
                report.error(f"invalid language entry: {entry!r}")
                continue
            share += float(entry.get("share") or 0)
        if not 0.97 <= share <= 1.03:
            report.warn(f"language shares sum to {share:.3f}, expected ~1.0")

    try:
        config = tomllib.loads(Path(args.config).read_text(encoding="utf-8"))
    except (OSError, tomllib.TOMLDecodeError) as exc:
        report.error(f"cannot read privacy config: {exc}")
        config = {}
    private = set((config.get("privacy") or {}).get("repos") or [])

    contributions = data["contributions"]
    if not isinstance(contributions, dict):
        report.error("contributions must be an object")
        contributions = {}
    upstream = contributions.get("upstream") or []
    org = contributions.get("org") or []
    recent = contributions.get("recent") or []
    org_repos = contributions.get("org_repos") or []
    org_repo_names = {entry.get("repo") for entry in org_repos if isinstance(entry, dict)}

    for name, entries in (("upstream", upstream), ("org", org), ("recent", recent)):
        if not isinstance(entries, list):
            report.error(f"contributions.{name} must be a list")
            continue
        for entry in entries:
            if not isinstance(entry, dict):
                report.error(f"contributions.{name}: invalid entry")
                continue
            repo = entry.get("repo", "")
            if repo in private:
                report.error(f"contributions.{name} exposes private repo '{repo}'")
            if name in ("org", "recent") and repo not in org_repo_names and repo not in full_names:
                report.warn(f"contributions.{name} references unknown repo '{repo}'")
            if entry.get("url") and not str(entry["url"]).startswith("https://github.com/"):
                report.warn(f"contributions.{name}: non-GitHub URL {entry['url']}")
    if len(recent) > 12:
        report.error("contributions.recent must contain at most 12 entries")

    allowed_activity = full_names | {entry.get("repo") for entry in upstream} | org_repo_names
    activity = data["activity"]
    if not isinstance(activity, list):
        report.error("activity must be a list")
        activity = []
    for index, event in enumerate(activity):
        if not isinstance(event, dict) or "repo" not in event:
            report.error(f"activity[{index}]: invalid entry")
            continue
        repo = event["repo"]
        if repo in private:
            report.error(f"activity exposes private repo '{repo}'")
        elif repo not in allowed_activity:
            report.warn(f"activity references unknown repo '{repo}'")

    summary = (
        f"{data_path.name}: {len(projects)} projects, {len(featured)} featured, "
        f"{total} merged PRs ({stats.get('public_prs', 0)} public), "
        f"{len(activity)} activity events, generated {data.get('generated_at', '?')}"
    )
    return report.finish(summary)


if __name__ == "__main__":
    raise SystemExit(main())
