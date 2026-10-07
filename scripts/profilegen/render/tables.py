"""Markdown table helpers."""

from __future__ import annotations

import re

EMOJI = re.compile(
    "["
    "\U0001F000-\U0001FAFF"
    "\U0001F900-\U0001F9FF"
    "\U00002600-\U000027BF"
    "\U0000FE00-\U0000FE0F"
    "\U0001F1E6-\U0001F1FF"
    "\u200d\u20e3"
    "]"
)


def clean(text: object, limit: int = 0) -> str:
    """Strip emoji/control noise and make text safe inside a table cell."""
    if text is None:
        return ""
    value = str(text).strip().replace("\n", " ").replace("\r", " ")
    value = EMOJI.sub("", value)
    value = value.replace("|", "\\|").replace("`", "'")
    value = value.replace("<", "&lt;").replace(">", "&gt;")
    value = re.sub(r"\s+", " ", value).strip()
    if limit and len(value) > limit:
        value = value[: limit - 1].rstrip() + "…"
    return value


def cell(text: object, limit: int = 0) -> str:
    value = clean(text, limit)
    return value or "—"


def table(headers: list[str], rows: list[list[str]]) -> list[str]:
    """Render a GitHub-flavoured markdown table (no alignment padding — GitHub strips it)."""
    if not rows:
        return []
    lines = ["| " + " | ".join(headers) + " |", "| " + " | ".join("---" for _ in headers) + " |"]
    for row in rows:
        padded = list(row) + [""] * (len(headers) - len(row))
        lines.append("| " + " | ".join(padded) + " |")
    return lines


def bullets(items: list[str], prefix: str = "- ") -> list[str]:
    return [f"{prefix}{item}" for item in items if item]
