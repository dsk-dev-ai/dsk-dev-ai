"""Public activity feed."""

from __future__ import annotations

from ..render import tables
from ..timefmt import ago
from . import Context


def render(ctx: Context) -> list[str]:
    public = {repo.full_name.lower() for repo in ctx.bundle.repos}
    private = {name.lower() for name in ctx.config.private_repos}

    events = sorted(ctx.bundle.events, key=lambda e: e.created_at or "", reverse=True)
    items = []
    seen: set[tuple[str, str, str]] = set()
    for event in events:
        if not event.action:
            continue
        repo_key = event.repo.lower()
        if repo_key in private or repo_key not in public:
            continue
        key = (event.type, event.repo, event.action)
        if key in seen:
            continue
        seen.add(key)
        repo_link = f"[{event.repo}](https://github.com/{event.repo})"
        suffix = f' - "{tables.clean(event.detail, 80)}"' if event.detail else ""
        items.append(f"`{ago(event.created_at, ctx.now)}` - {event.action} {repo_link}{suffix}")
        if len(items) >= ctx.config.limits.activity:
            break
    if not items:
        return []
    return ["**Latest public activity**", ""] + items
