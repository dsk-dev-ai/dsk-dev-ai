"""Rendering helpers: badges, tables, charts and README splicing/validation."""

from __future__ import annotations

import unittest
from pathlib import Path

from tests import SCRIPTS

from profilegen.config import load
from profilegen.render import badges, block, charts, tables

README = SCRIPTS.parent / "README.md"
CONFIG = load(SCRIPTS / "profile.toml")


class BadgeTests(unittest.TestCase):
    def test_badge_encodes_dashes_underscores_and_spaces(self) -> None:
        url = badges.badge("Stars this week", "-3")
        self.assertIn("Stars_this_week", url)
        self.assertIn("--3", url)
        self.assertNotIn(" ", url)

    def test_language_dot_falls_back_for_unknown_language(self) -> None:
        self.assertIn("%238b949e", badges.language_dot("Brainfuck"))
        self.assertIn("%233776ab", badges.language_dot("Python"))

    def test_delta_suffix(self) -> None:
        self.assertEqual(badges.delta_suffix(None), "")
        self.assertIn("+2", badges.delta_suffix(2))
        self.assertIn("-1", badges.delta_suffix(-1))


class TableTests(unittest.TestCase):
    def test_pipe_in_cell_is_escaped(self) -> None:
        lines = tables.table(["A", "B"], [[tables.cell("x | y"), "z"]])
        self.assertIn("x \\| y", lines[2])

    def test_clean_strips_emoji_and_collapses_whitespace(self) -> None:
        self.assertEqual(tables.clean("hi 😀\n  there"), "hi there")

    def test_clean_truncates_with_ellipsis(self) -> None:
        value = tables.clean("a" * 50, limit=10)
        self.assertEqual(len(value), 10)
        self.assertTrue(value.endswith("…"))

    def test_empty_cell_becomes_dash(self) -> None:
        self.assertEqual(tables.cell(""), "—")

    def test_rows_have_consistent_cell_counts(self) -> None:
        lines = tables.table(["A", "B", "C"], [["1", "2"], ["3", "4", "5"]])
        for line in lines:
            self.assertEqual(line.count("|"), 4)


class ChartTests(unittest.TestCase):
    def test_flat_series_renders_dotted_baseline(self) -> None:
        self.assertEqual(charts.sparkline([3, 3, 3]), "···")

    def test_sparkline_is_same_length_as_input(self) -> None:
        self.assertEqual(len(charts.sparkline([1, 2, 3, 4])), 4)

    def test_bar_scales_with_share(self) -> None:
        self.assertEqual(charts.bar(0), "")
        self.assertEqual(len(charts.bar(1.0, width=10)), 10)
        self.assertEqual(len(charts.bar(0.5, width=10)), 5)


class BlockTests(unittest.TestCase):
    def test_splice_replaces_only_the_live_region(self) -> None:
        text = "head\n<!-- LIVE:START -->\nold\n<!-- LIVE:END -->\ntail"
        out = block.splice(text, CONFIG, "new content")
        self.assertEqual(
            out, "head\n<!-- LIVE:START -->\n\nnew content\n\n<!-- LIVE:END -->\ntail"
        )

    def test_splice_requires_markers(self) -> None:
        with self.assertRaises(ValueError):
            block.splice("no markers here", CONFIG, "x")

    def test_splice_detects_swapped_markers(self) -> None:
        text = "<!-- LIVE:END -->\nstuff\n<!-- LIVE:START -->"
        with self.assertRaises(ValueError):
            block.splice(text, CONFIG, "x")

    def test_current_block_round_trips(self) -> None:
        text = "<!-- LIVE:START -->\nhello\n<!-- LIVE:END -->"
        self.assertEqual(block.current_block(text, CONFIG), "hello")

    def test_validate_real_readme(self) -> None:
        text = README.read_text(encoding="utf-8")
        self.assertEqual(block.validate(text, CONFIG), [])

    def test_validate_flags_missing_markers(self) -> None:
        self.assertTrue(block.validate("nothing here", CONFIG))

    def test_validate_flags_duplicate_markers(self) -> None:
        text = "<!-- LIVE:START -->\nx\n<!-- LIVE:END -->\n<!-- LIVE:START -->"
        errors = block.validate(text, CONFIG)
        self.assertTrue(any("exactly one" in e for e in errors))

    def test_validate_flags_empty_block(self) -> None:
        text = "<!-- LIVE:START -->\n   \n<!-- LIVE:END -->"
        errors = block.validate(text, CONFIG)
        self.assertTrue(any("empty" in e for e in errors))

    def test_validate_flags_ragged_table(self) -> None:
        text = (
            "<!-- LIVE:START -->\n"
            "| A | B |\n| --- | --- |\n"
            "| 1 | 2 | 3 |\n"
            "<!-- LIVE:END -->"
        )
        errors = block.validate(text, CONFIG)
        self.assertTrue(any("cells" in e for e in errors))

    def test_validate_allows_separate_tables_of_different_widths(self) -> None:
        text = (
            "<!-- LIVE:START -->\n"
            "| A | B |\n| --- | --- |\n| 1 | 2 |\n\n"
            "| X | Y | Z |\n| --- | --- | --- |\n| 1 | 2 | 3 |\n"
            "<!-- LIVE:END -->"
        )
        self.assertEqual(block.validate(text, CONFIG), [])

    def test_validate_flags_empty_link_target(self) -> None:
        text = "<!-- LIVE:START -->\n[broken]()\n<!-- LIVE:END -->"
        errors = block.validate(text, CONFIG)
        self.assertTrue(any("empty link" in e for e in errors))


if __name__ == "__main__":
    unittest.main()
