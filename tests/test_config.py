"""Configuration loading and section selection."""

from __future__ import annotations

import unittest
from pathlib import Path

from tests import SCRIPTS

from profilegen.config import DEFAULT_ORDER, KNOWN_SECTIONS, load

PROFILE_TOML = SCRIPTS / "profile.toml"


class ConfigTests(unittest.TestCase):
    def test_loads_repo_profile_toml(self) -> None:
        config = load(PROFILE_TOML)
        self.assertEqual(config.user, "dsk-dev-ai")
        self.assertEqual(config.start_marker, "<!-- LIVE:START -->")
        self.assertEqual(config.order, DEFAULT_ORDER)
        self.assertGreaterEqual(len(config.featured), 4)
        self.assertEqual(config.limits.building, 5)
        self.assertTrue(str(config.history_file).endswith("data/history.json"))

    def test_missing_file_falls_back_to_defaults(self) -> None:
        config = load(SCRIPTS / "does-not-exist.toml")
        self.assertEqual(config.order, DEFAULT_ORDER)
        self.assertEqual(config.user, "dsk-dev-ai")

    def test_only_filters_order(self) -> None:
        config = load(PROFILE_TOML)
        self.assertEqual(config.sections(only=["health", "status"]), ("status", "health"))

    def test_skip_removes_sections(self) -> None:
        config = load(PROFILE_TOML)
        result = config.sections(skip=["activity", "languages"])
        self.assertNotIn("activity", result)
        self.assertIn("status", result)

    def test_unknown_section_rejected(self) -> None:
        config = load(PROFILE_TOML)
        with self.assertRaises(ValueError):
            config.sections(only=["nonsense"])
        with self.assertRaises(ValueError):
            config.sections(skip=["nonsense"])

    def test_known_sections_cover_default_order(self) -> None:
        self.assertEqual(set(DEFAULT_ORDER), KNOWN_SECTIONS)

    def test_unknown_order_in_toml_rejected(self) -> None:
        import tempfile

        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "profile.toml"
            path.write_text('[sections]\norder = ["status", "bogus"]\n', encoding="utf-8")
            with self.assertRaises(ValueError):
                load(path)


if __name__ == "__main__":
    unittest.main()
