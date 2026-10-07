"""Language mix across owned repositories."""

from __future__ import annotations

from .. import metrics
from ..render import charts
from . import Context


def render(ctx: Context) -> list[str]:
    mix = metrics.language_mix(ctx.owned, ctx.config.limits.languages)
    if not mix:
        return []
    lines = ["**Language mix**", ""]
    body = [
        f"{lang:<16} {charts.percent(share)}  {charts.bar(share)}"
        for lang, _, share in mix
    ]
    lines.extend(charts.code_block(body))
    return lines
