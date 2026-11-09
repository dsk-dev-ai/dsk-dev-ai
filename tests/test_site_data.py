"""Guardrails for the public site snapshot (privacy + structure)."""

from __future__ import annotations

import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "site" / "data" / "profile.json"
PRIVATE = {
    "nextgenai-labs/ForgeOS",
    "dsk-dev-ai/aegis",
    "dsk-dev-ai/api-monitor-saas",
}


class SiteDataTests(unittest.TestCase):
    def test_validator_passes(self) -> None:
        result = subprocess.run(
            [sys.executable, "scripts/validate_site_data.py"],
            cwd=ROOT,
            capture_output=True,
            text=True,
        )
        self.assertEqual(result.returncode, 0, result.stderr + result.stdout)

    def test_private_repos_never_exposed(self) -> None:
        data = json.loads(DATA.read_text(encoding="utf-8"))
        for event in data["activity"]:
            self.assertNotIn(event["repo"], PRIVATE)
        for section in ("upstream", "org", "recent"):
            for entry in data["contributions"].get(section, []):
                self.assertNotIn(entry["repo"], PRIVATE)

    def test_validator_rejects_private_activity(self) -> None:
        data = json.loads(DATA.read_text(encoding="utf-8"))
        data["activity"].append(
            {
                "type": "PushEvent",
                "repo": "dsk-dev-ai/aegis",
                "action": "pushed",
                "detail": "main",
                "created_at": data["generated_at"],
            }
        )
        with tempfile.NamedTemporaryFile("w", suffix=".json", delete=False) as handle:
            json.dump(data, handle)
            path = handle.name
        try:
            result = subprocess.run(
                [sys.executable, "scripts/validate_site_data.py", path],
                cwd=ROOT,
                capture_output=True,
                text=True,
            )
            self.assertNotEqual(result.returncode, 0)
            self.assertIn("private repo", result.stderr)
        finally:
            Path(path).unlink(missing_ok=True)


if __name__ == "__main__":
    unittest.main()
