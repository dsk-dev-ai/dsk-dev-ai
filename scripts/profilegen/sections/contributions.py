"""Merged pull requests opened upstream (other people's repositories)."""

from __future__ import annotations

from ..render import tables
from ..timefmt import ago
from . import Context


def render(ctx: Context) -> list[str]:
    pulls = [pr for pr in ctx.bundle.pulls if pr.merged_at]
    pulls.sort(key=lambda pr: pr.merged_at, reverse=True)
    pulls = pulls[: ctx.config.limits.contributions]
    if not pulls:
        return []

    rows = []
    for pr in pulls:
        rows.append(
            [
                f"[{pr.repo}#{pr.number}]({pr.url})",
                tables.cell(pr.title, 74),
                f"`{ago(pr.merged_at, ctx.now)}`",
            ]
        )
    return ["**Merged pull requests**", ""] + tables.table(["Pull request", "Title", "Merged"], rows)
