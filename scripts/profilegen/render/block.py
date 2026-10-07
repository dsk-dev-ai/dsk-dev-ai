"""Block assembly, README splicing and structural validation."""

from __future__ import annotations

import re

from ..config import Config

SECTION_SEP = "\n\n"


def assemble(config: Config, rendered: dict[str, list[str]]) -> str:
    """Join rendered sections in configured order, skipping empty ones."""
    parts: list[str] = []
    for name in config.order:
        lines = rendered.get(name) or []
        text = "\n".join(lines).strip()
        if text:
            parts.append(text)
    return SECTION_SEP.join(parts)


def splice(text: str, config: Config, block: str) -> str:
    """Replace whatever lives between the LIVE markers with ``block``."""
    start, end = config.start_marker, config.end_marker
    if start not in text or end not in text:
        raise ValueError("LIVE markers not found in README")
    if text.index(start) > text.index(end):
        raise ValueError("LIVE markers are out of order")
    before, _, rest = text.partition(start)
    _, _, tail = rest.partition(end)
    return f"{before}{start}\n\n{block}\n\n{end}{tail}"


def current_block(text: str, config: Config) -> str | None:
    start, end = config.start_marker, config.end_marker
    if start not in text or end not in text:
        return None
    _, _, rest = text.partition(start)
    block, _, _ = rest.partition(end)
    return block.strip("\n")


def validate(text: str, config: Config) -> list[str]:
    """Structural checks used by ``--check`` (no network, no writes)."""
    errors: list[str] = []
    start, end = config.start_marker, config.end_marker
    if text.count(start) != 1:
        errors.append(f"expected exactly one {start!r}, found {text.count(start)}")
    if text.count(end) != 1:
        errors.append(f"expected exactly one {end!r}, found {text.count(end)}")
    if start not in text or end not in text:
        return errors
    if text.index(start) > text.index(end):
        errors.append("LIVE markers are out of order")
        return errors

    block = current_block(text, config) or ""
    if not block.strip():
        errors.append("LIVE block is empty")
        return errors
    errors.extend(_validate_tables(block))
    errors.extend(_validate_links(block))
    return errors


def _validate_tables(block: str) -> list[str]:
    errors: list[str] = []
    expected: int | None = None
    for line in block.splitlines():
        stripped = line.strip()
        if not stripped.startswith("|"):
            expected = None
            continue
        cells = _split_row(stripped)
        if expected is None:
            expected = len(cells)
            continue
        if len(cells) != expected and not _is_separator(stripped):
            errors.append(f"table row has {len(cells)} cells, expected {expected}: {stripped[:60]}")
    return errors


def _is_separator(row: str) -> bool:
    return bool(re.fullmatch(r"\|(\s*:?-{3,}:?\s*\|)+", row.strip()))


def _split_row(row: str) -> list[str]:
    body = row.strip().strip("|")
    return [part for part in re.split(r"(?<!\\)\|", body)]


def _validate_links(block: str) -> list[str]:
    errors: list[str] = []
    for match in re.finditer(r"\[([^\]]*)\]\(([^)]*)\)", block):
        target = match.group(2).strip()
        if not target:
            errors.append(f"empty link target for [{match.group(1)}]")
        elif " " in target:
            errors.append(f"unescaped space in link target: {target!r}")
    return errors
