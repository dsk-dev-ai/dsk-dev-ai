"""Headline status line and badge row."""

from __future__ import annotations

from .. import metrics
from ..render import badges
from ..timefmt import utc_stamp
from . import Context


def render(ctx: Context) -> list[str]:
    totals = metrics.totals(ctx.bundle.profile, ctx.bundle.own_repos)
    stars_week = metrics.delta(metrics.series(ctx.history, "stars"), 7, ctx.now)
    followers_week = metrics.delta(metrics.series(ctx.history, "followers"), 7, ctx.now)

    stamp = ctx.rendered_at or utc_stamp(ctx.now)
    lines = [
        f"**Live status — auto-refreshed hourly by GitHub Actions** · last run `{stamp}`",
        "",
        " ".join(
            [
                badges.badge("Public repos", totals["repo_count"], "34d399"),
                badges.badge("Total stars", totals["stars"], "6c8cff"),
                badges.badge("Followers", totals["followers"], "0ea5e9"),
                badges.badge("Forks", totals["forks"], "f97316"),
            ]
        ),
    ]
    deltas = [
        ("Stars 7d", stars_week, "6c8cff"),
        ("Followers 7d", followers_week, "0ea5e9"),
    ]
    chips = [badges.badge(label, f"{value:+d}", color) for label, value, color in deltas if value]
    if chips:
        lines += ["", " ".join(chips)]
    return lines
