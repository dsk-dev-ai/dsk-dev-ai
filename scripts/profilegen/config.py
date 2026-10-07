"""Configuration loading for the profile generator."""

from __future__ import annotations

import tomllib
from dataclasses import dataclass, field
from pathlib import Path

DEFAULT_ORDER = (
    "status",
    "building",
    "pinned",
    "starred",
    "health",
    "growth",
    "contributions",
    "activity",
    "languages",
    "footer",
)

KNOWN_SECTIONS = set(DEFAULT_ORDER)


@dataclass(frozen=True)
class Limits:
    building: int = 5
    commit_probe: int = 5
    starred: int = 4
    pinned: int = 6
    health: int = 6
    contributions: int = 6
    activity: int = 8
    languages: int = 5
    history_days: int = 180


@dataclass(frozen=True)
class Config:
    root: Path
    user: str
    start_marker: str
    end_marker: str
    history_path: Path
    cache_dir: Path
    cache_enabled: bool
    cache_max_age_hours: int
    order: tuple[str, ...]
    featured: tuple[str, ...]
    excluded: tuple[str, ...] = ()
    upstream: tuple[str, ...] = ()
    site_featured: tuple[str, ...] = ()
    upstream: tuple[str, ...] = ()
    limits: Limits = field(default_factory=Limits)
    fixtures: Path | None = None

    @property
    def readme_path(self) -> Path:
        return self.root / "README.md"

    @property
    def history_file(self) -> Path:
        return self.history_path if self.history_path.is_absolute() else self.root / self.history_path

    @property
    def cache_path(self) -> Path:
        return self.cache_dir if self.cache_dir.is_absolute() else self.root / self.cache_dir

    def is_excluded(self, name: str, full_name: str = "") -> bool:
        """True when a repo is hidden from the detail sections (see profile.toml)."""
        keys = {name, full_name, full_name.split("/")[-1] if full_name else ""}
        return bool({k for k in keys if k} & set(self.excluded))

    def sections(self, only: list[str] | None = None, skip: list[str] | None = None) -> tuple[str, ...]:
        """Resolve the effective section list for this run."""
        order = list(self.order)
        if only:
            wanted = {s.strip() for s in only}
            unknown = wanted - KNOWN_SECTIONS
            if unknown:
                raise ValueError(f"unknown section(s): {', '.join(sorted(unknown))}")
            order = [s for s in order if s in wanted]
        if skip:
            drop = {s.strip() for s in skip}
            unknown = drop - KNOWN_SECTIONS
            if unknown:
                raise ValueError(f"unknown section(s): {', '.join(sorted(unknown))}")
            order = [s for s in order if s not in drop]
        return tuple(order)


def _as_path(root: Path, value: str) -> Path:
    path = Path(value)
    return path if path.is_absolute() else (root / path)


def load(path: Path, fixtures: Path | None = None) -> Config:
    """Load ``profile.toml`` (falling back to built-in defaults)."""
    root = path.resolve().parent.parent
    if path.exists():
        raw = tomllib.loads(path.read_text(encoding="utf-8"))
    else:
        raw = {}

    cache_raw = raw.get("cache") or {}
    limits_raw = raw.get("limits") or {}
    sections_raw = raw.get("sections") or {}
    featured_raw = raw.get("featured") or {}

    order = tuple(sections_raw.get("order") or DEFAULT_ORDER)
    unknown = set(order) - KNOWN_SECTIONS
    if unknown:
        raise ValueError(f"profile.toml: unknown section(s) in order: {', '.join(sorted(unknown))}")

    limits = Limits(
        **{
            name: int(limits_raw.get(name, getattr(Limits(), name)))
            for name in Limits.__dataclass_fields__
        }
    )

    return Config(
        root=root,
        user=str(raw.get("user") or "dsk-dev-ai"),
        start_marker=str(raw.get("start_marker") or "<!-- LIVE:START -->"),
        end_marker=str(raw.get("end_marker") or "<!-- LIVE:END -->"),
        history_path=_as_path(root, str(raw.get("history_path") or "data/history.json")),
        cache_dir=_as_path(root, str(cache_raw.get("dir") or ".cache/profile")),
        cache_enabled=bool(cache_raw.get("enabled", True)),
        cache_max_age_hours=int(cache_raw.get("max_age_hours", 6)),
        order=order,
        featured=tuple(featured_raw.get("repos") or ()),
        excluded=tuple((raw.get("exclude") or {}).get("repos") or ()),
        upstream=tuple((raw.get("upstream") or {}).get("repos") or ()),
        site_featured=tuple((raw.get("site") or {}).get("repos") or ()),
        limits=limits,
        fixtures=fixtures,
    )
