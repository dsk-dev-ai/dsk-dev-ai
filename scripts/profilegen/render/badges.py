"""Markdown rendering helpers: shields.io badges."""

from __future__ import annotations

from urllib.parse import quote

FALLBACK_COLOR = "8b949e"

COLORS: dict[str, str] = {
    "TypeScript": "3178c6",
    "JavaScript": "f1e05a",
    "Python": "3776ab",
    "Rust": "dea584",
    "Go": "00ADD8",
    "Java": "b07219",
    "C++": "f34b7d",
    "C": "555555",
    "C#": "178600",
    "Shell": "89e051",
    "HTML": "e34c26",
    "CSS": "563d7c",
    "Jupyter Notebook": "DA5B0B",
    "Dockerfile": "384d54",
    "Vue": "41b883",
    "Svelte": "ff3e00",
    "Astro": "ff5a03",
    "Ruby": "701516",
    "PHP": "4F5D95",
    "Kotlin": "A97BFF",
    "Swift": "F05138",
    "Solidity": "AA6746",
    "Lua": "000080",
    "Zig": "ec915c",
    "HCL": "844FBA",
}


def _shield(text: object) -> str:
    """Encode a value for shields.io's dynamic badge path."""
    value = str(text).replace("-", "--").replace("_", "__").replace(" ", "_")
    return quote(value, safe="")


def badge(label: str, value: object, color: str = "6c8cff", style: str = "for-the-badge") -> str:
    url = (
        f"https://img.shields.io/badge/{_shield(label)}-{_shield(value)}-{color}"
        f"?style={style}"
    )
    return f"![{_shield(label)}]({url})"


def language_dot(language: str | None, title: str | None = None) -> str:
    color = COLORS.get(language or "", FALLBACK_COLOR)
    label = title if title is not None else (language or "")
    return (
        f"<img width=14 src='https://img.shields.io/badge/%E2%80%8B-%E2%80%8B-%23{color}'"
        f" title='{label}'>"
    )


def delta_suffix(value: int | None, unit: str = "") -> str:
    if value is None:
        return ""
    if value > 0:
        return f" (+{value}{unit} this week)"
    if value < 0:
        return f" ({value}{unit} this week)"
    return " (±0 this week)"
