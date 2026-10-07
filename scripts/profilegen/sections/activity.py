"""Public activity feed."""

from __future__ import annotations

from ..render import tables
from ..timefmt import ago
from . import Context


def render(ctx: Context) -> list[str]:
    events = sorted(ctx.bundle.events, key=lambda e: e.created_at or "", reverse=True)
    items = []
    seen: set[tuple[str, str, str]] = set()
    for event in events:
        if not event.action:
            continue
        key = (event.type, event.repo, event.action)
        if key in seen:
            continue
        seen.add(key)
        repo_link = f"[{event.repo}](https://github.com/{event.repo})"
        suffix = f' — "{tables.clean(event.detail, 80)}"' if event.detail else ""
        items.append(f"`{ago(event.created_at, ctx.now)}` — {event.action} {repo_link}{suffix}")
        if len(items) >= ctx.config.limits.activity:
            break
    if not items:
        return []
    return ["**Latest public activity**", ""] + items
