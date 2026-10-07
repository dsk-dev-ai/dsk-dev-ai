"""Section registry: every live block is one function ``Context -> list[str]``."""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any, Callable

from ..config import Config
from ..github import ClientStats
from ..models import DataBundle, Repo


@dataclass
class Context:
    config: Config
    bundle: DataBundle
    history: list[dict[str, Any]]
    now: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    stats: ClientStats | None = None
    rendered_at: str = ""

    @property
    def owned(self) -> list[Repo]:
        """Non-fork repositories minus the ones hidden in profile.toml."""
        return [
            repo
            for repo in self.bundle.own_repos
            if not self.config.is_excluded(repo.name, repo.full_name)
        ]


def _lazy(module: str) -> Callable[[Context], list[str]]:
    def loader(ctx: Context) -> list[str]:
        from importlib import import_module

        return getattr(import_module(f".{module}", __package__), "render")(ctx)

    return loader


REGISTRY: dict[str, Callable[[Context], list[str]]] = {
    "status": _lazy("status"),
    "building": _lazy("building"),
    "pinned": _lazy("pinned"),
    "starred": _lazy("starred"),
    "health": _lazy("health"),
    "growth": _lazy("growth"),
    "contributions": _lazy("contributions"),
    "activity": _lazy("activity"),
    "languages": _lazy("languages"),
    "footer": _lazy("footer"),
}


def render_sections(ctx: Context) -> dict[str, list[str]]:
    """Render each configured section; a crashing section degrades to a warning line."""
    import sys

    out: dict[str, list[str]] = {}
    for name in ctx.config.order:
        renderer = REGISTRY.get(name)
        if renderer is None:
            print(f"warning: no renderer for section {name!r}", file=sys.stderr)
            continue
        try:
            out[name] = renderer(ctx)
        except Exception as exc:  # noqa: BLE001 - one bad section must not kill the refresh
            print(f"warning: section {name!r} failed: {exc}", file=sys.stderr)
            out[name] = [f"<!-- section {name} unavailable: {exc} -->"]
    return out
