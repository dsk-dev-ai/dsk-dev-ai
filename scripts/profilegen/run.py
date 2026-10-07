"""End-to-end pipeline: collect → measure → render → splice → validate."""

from __future__ import annotations

import sys
from dataclasses import dataclass, field, replace
from pathlib import Path
from typing import Any

from . import metrics
from .collect import ApiSource, FixtureSource, collect
from .config import Config, load
from .github import DiskCache, GitHubClient
from .models import now_utc
from .render import block as block_render
from .sections import Context, render_sections
from .timefmt import utc_stamp

PACKAGE_ROOT = Path(__file__).resolve().parent.parent  # scripts/


@dataclass
class Options:
    check: bool = False
    dry_run: bool = False
    only: list[str] = field(default_factory=list)
    skip: list[str] = field(default_factory=list)
    fixtures: Path | None = None
    no_cache: bool = False
    quiet: bool = False
    profile_toml: Path | None = None


def build_config(options: Options) -> Config:
    profile_toml = options.profile_toml or (PACKAGE_ROOT / "profile.toml")
    config = load(profile_toml, fixtures=options.fixtures)
    return config


def _make_source(config: Config, options: Options):
    if config.fixtures:
        return FixtureSource(config.fixtures, config)
    cache = DiskCache(
        config.cache_path,
        max_age_hours=config.cache_max_age_hours,
        enabled=config.cache_enabled and not options.no_cache,
    )
    client = GitHubClient(cache=cache, log=(lambda m: None) if options.quiet else None)
    return ApiSource(client, config)


def run(options: Options) -> int:
    try:
        config = build_config(options)
        config = replace(config, order=config.sections(only=options.only or None, skip=options.skip or None))
    except ValueError as exc:
        print(f"error: {exc}", file=sys.stderr)
        return 2

    # One filtered config drives both collection and rendering, so the two
    # can never disagree about which sections exist.
    now = now_utc()
    source = _make_source(config, options)

    try:
        bundle = collect(source, config, config.order)
    except Exception as exc:  # noqa: BLE001
        print(f"error: collection failed: {exc}", file=sys.stderr)
        return 2

    history = metrics.load_history(config.history_file)
    history_changed = False
    if not config.fixtures:
        history, history_changed = metrics.record_snapshot(
            config.history_file,
            bundle.profile,
            [r for r in bundle.repos if not r.fork],
            keep_days=config.limits.history_days,
            now=now,
        )

    stats = getattr(getattr(source, "client", None), "stats", None)
    ctx = Context(
        config=config,
        bundle=bundle,
        history=history,
        now=now,
        stats=stats,
        rendered_at=utc_stamp(now),
    )
    rendered = render_sections(ctx)
    body = block_render.assemble(config, rendered)
    if not body:
        print("error: nothing rendered", file=sys.stderr)
        return 2

    readme_path = config.readme_path
    original = readme_path.read_text(encoding="utf-8") if readme_path.exists() else ""
    try:
        spliced = block_render.splice(original, config, body)
    except ValueError as exc:
        print(f"error: {exc}", file=sys.stderr)
        return 2

    errors = block_render.validate(spliced, config)
    if errors:
        for message in errors:
            print(f"check: {message}", file=sys.stderr)
        return 1

    if options.check:
        if not options.quiet:
            print(f"check: OK ({len(config.order)} sections, {len(body.splitlines())} lines)")
        return 0

    if options.dry_run:
        print(body)
        return 0

    if spliced != original:
        readme_path.write_text(spliced, encoding="utf-8")
        if not options.quiet:
            print(f"README updated ({len(body.splitlines())} lines, sections: {', '.join(config.order)})")
    elif not options.quiet:
        print("README already up to date")

    if history_changed and not config.fixtures:
        metrics.save_history(config.history_file, history)
        if not options.quiet:
            print(f"history snapshot updated ({len(history)} points)")

    _report_stats(stats, options)
    return 0


def _report_stats(stats: Any, options: Options) -> None:
    if options.quiet or stats is None:
        return
    print(
        "api: "
        f"{stats.requests} requests · {stats.cache_hits} cache hits · "
        f"{stats.retries} retries · {stats.rate_limited} rate-limited"
    )
