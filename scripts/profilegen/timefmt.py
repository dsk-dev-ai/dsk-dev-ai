"""Time formatting helpers."""

from __future__ import annotations

from datetime import datetime, timezone


def parse(value: str | None) -> datetime | None:
    if not value:
        return None
    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        return None


def ago(iso: str | None, now: datetime | None = None) -> str:
    stamp = parse(iso)
    if not stamp:
        return "unknown"
    now = now or datetime.now(timezone.utc)
    secs = max(0, int((now - stamp).total_seconds()))
    if secs < 60:
        return f"{secs}s ago"
    if secs < 3600:
        return f"{secs // 60}m ago"
    if secs < 86400:
        return f"{secs // 3600}h ago"
    if secs < 86400 * 30:
        return f"{secs // 86400}d ago"
    if secs < 86400 * 365:
        return f"{secs // (86400 * 30)}mo ago"
    return f"{secs // (86400 * 365)}y ago"


def utc_stamp(now: datetime | None = None) -> str:
    now = now or datetime.now(timezone.utc)
    return now.strftime("%Y-%m-%d %H:%M UTC")
