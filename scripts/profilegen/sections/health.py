"""Repository health matrix: observable signals, scored."""

from __future__ import annotations

from .. import metrics
from ..render import tables
from . import Context


def render(ctx: Context) -> list[str]:
    ranked = sorted(ctx.owned, key=lambda r: (r.stars, r.pushed_at), reverse=True)
    limit = ctx.config.limits.health
    rows = []
    for repo in ranked[:limit]:
        tree = ctx.bundle.trees.get(repo.full_name) or {}
        paths = tree.get("paths") or []
        released = bool(ctx.bundle.releases.get(repo.full_name))
        row = metrics.health_row(repo, paths, released=released, now=ctx.now)
        missing = [name for name, ok in row.checks if not ok]
        rows.append(
            [
                f"[{tables.clean(repo.name)}]({repo.url})",
                f"{row.score}%",
                f"{sum(ok for _, ok in row.checks)}/{len(row.checks)}",
                tables.cell(", ".join(missing), 60) if missing else "all green",
            ]
        )
    if not rows:
        return []
    return ["**Repository health**", ""] + tables.table(
        ["Repo", "Score", "Signals", "Missing"], rows
    )
