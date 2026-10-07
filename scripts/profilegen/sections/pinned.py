"""Highlighted repositories: curated list first, then GitHub pinned, then top-starred."""

from __future__ import annotations

from ..models import Repo
from ..render import badges, tables
from . import Context


def render(ctx: Context) -> list[str]:
    limit = ctx.config.limits.pinned
    by_name = {repo.name: repo for repo in ctx.owned}
    by_full = {repo.full_name: repo for repo in ctx.owned}

    def lookup(key: str) -> Repo | None:
        return by_full.get(key) or by_name.get(key.rsplit("/", 1)[-1])

    candidates: list[Repo] = []
    seen: set[str] = set()
    sources: list[str] = []

    def add(repo: Repo | None, source: str) -> None:
        if repo is None or repo.full_name in seen or len(candidates) >= limit:
            return
        seen.add(repo.full_name)
        candidates.append(repo)
        if source not in sources:
            sources.append(source)

    for key in ctx.config.featured:
        add(lookup(key), "curated")
    for key in ctx.bundle.pinned:
        add(lookup(key), "pinned")
    for repo in sorted(ctx.owned, key=lambda r: r.stars, reverse=True):
        add(repo, "top-starred")

    if not candidates:
        return []

    label = " · ".join(
        {"curated": "curated", "pinned": "GitHub pinned", "top-starred": "top-starred"}[s]
        for s in sources
    )
    rows = []
    for repo in candidates:
        rows.append(
            [
                badges.language_dot(repo.language),
                f"[{tables.clean(repo.name)}]({repo.url})",
                str(repo.stars),
                f"`{tables.clean(repo.language, 16) or '—'}`",
                tables.cell(repo.description, 96),
            ]
        )
    return [f"**Highlights** · {label}", ""] + tables.table(
        ["", "Repo", "Stars", "Language", "What it is"], rows
    )
