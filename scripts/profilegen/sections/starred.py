"""Most-starred repositories."""

from __future__ import annotations

from ..render import tables
from . import Context


def render(ctx: Context) -> list[str]:
    ranked = sorted(ctx.owned, key=lambda r: r.stars, reverse=True)
    ranked = [repo for repo in ranked if repo.stars > 0][: ctx.config.limits.starred]
    if not ranked:
        return []

    rows = []
    for repo in ranked:
        url = repo.homepage or repo.url
        rows.append(
            [
                f"[{tables.clean(repo.name)}]({url})",
                str(repo.stars),
                tables.cell(repo.description, 90),
            ]
        )
    return ["**Most starred**", ""] + tables.table(["Repo", "Stars", "Description"], rows)
