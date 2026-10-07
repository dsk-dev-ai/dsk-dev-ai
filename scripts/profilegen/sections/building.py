"""Recently pushed repositories with their latest commit subject."""

from __future__ import annotations

from ..render import badges, tables
from . import Context


def render(ctx: Context) -> list[str]:
    repos = sorted(ctx.owned, key=lambda r: r.pushed_at or "", reverse=True)
    repos = [r for r in repos if r.pushed_at][: ctx.config.limits.building]
    if not repos:
        return []

    rows = []
    for repo in repos:
        latest = ctx.bundle.commits.get(repo.full_name, "—")
        rows.append(
            [
                badges.language_dot(repo.language),
                f"[{tables.clean(repo.name)}]({repo.url})",
                str(repo.stars),
                f"`{tables.clean(repo.language, 18) or '—'}`",
                tables.cell(latest, 60),
            ]
        )
    return ["**Recently pushed**", ""] + tables.table(
        ["", "Repo", "Stars", "Language", "Latest commit"], rows
    )
