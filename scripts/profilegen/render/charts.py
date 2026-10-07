"""Text charts: proportional bars, sparklines, fenced blocks."""

from __future__ import annotations

FULL = "█"
LIGHT = "░"


def bar(share: float, width: int = 24) -> str:
    filled = max(1, round(share * width)) if share > 0 else 0
    return FULL * filled


def sparkline(values: list[int | float], empty: str = "·") -> str:
    """Unicode sparkline; flat/zero series degrade to a dotted baseline."""
    if not values:
        return ""
    ticks = "▁▂▃▄▅▆▇█"
    low, high = min(values), max(values)
    if high == low:
        return empty * len(values)
    span = high - low
    return "".join(ticks[int(round((v - low) / span * (len(ticks) - 1)))] for v in values)


def code_block(lines: list[str]) -> list[str]:
    return ["```", *lines, "```"]


def percent(value: float) -> str:
    return f"{value * 100:4.0f}%"
