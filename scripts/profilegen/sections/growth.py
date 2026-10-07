"""Growth trends from the committed history snapshot + star cadence."""

from __future__ import annotations

from .. import metrics
from ..render import charts
from . import Context

WEEK = 7
MONTH = 30


def render(ctx: Context) -> list[str]:
    lines: list[str] = []
    trends = _trend_lines(ctx)
    cadence = _cadence_line(ctx)
    if not trends and not cadence:
        return []
    lines.append("**Growth**")
    lines.append("")
    body = trends + cadence
    lines.extend(charts.code_block(body))
    return lines


def _trend_lines(ctx: Context) -> list[str]:
    labels = [("Stars", "stars"), ("Followers", "followers"), ("Repos", "repos")]
    lines = []
    for label, key in labels:
        points = metrics.series(ctx.history, key)
        if not points:
            continue
        values = [value for _, value in points]
        latest = values[-1]
        week = metrics.delta(points, WEEK, ctx.now)
        month = metrics.delta(points, MONTH, ctx.now)
        line = f"{label:<10} {latest:>5}"
        if len(values) > 1:
            line += f"  {charts.sparkline(values)}"
        notes = [f"{week:+d} / 7d"] if week is not None else []
        if month is not None:
            notes.append(f"{month:+d} / 30d")
        if notes:
            line += "  · " + " · ".join(notes)
        lines.append(line)
    return lines


def _cadence_line(ctx: Context) -> list[str]:
    stars = metrics.star_days(ctx.bundle.stars, days=MONTH, now=ctx.now)
    if not stars:
        return []
    values = [count for _, count in stars]
    earned = sum(values)
    best = max(values)
    return [
        f"{'Stars/30d':<10} {earned:>5}  {charts.sparkline(values)}"
        f"  · best day {best} · {earned} new star{'s' if earned != 1 else ''}"
    ]
