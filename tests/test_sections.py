"""End-to-end section rendering from bundled fixtures (no network)."""

from __future__ import annotations

import contextlib
import io
import unittest
from dataclasses import replace

from tests import FIXTURES, SCRIPTS

from profilegen.collect import FixtureSource, collect
from profilegen.config import load
from profilegen.render import block
from profilegen.run import Options, run
from profilegen.sections import Context, render_sections

CONFIG = replace(load(SCRIPTS / "profile.toml"), fixtures=FIXTURES)


def build_context(order: tuple[str, ...] | None = None) -> Context:
    config = CONFIG if order is None else replace(CONFIG, order=order)
    source = FixtureSource(FIXTURES, config)
    bundle = collect(source, config, config.order)
    return Context(config=config, bundle=bundle, history=[], rendered_at="2026-10-07 12:00 UTC")


class SectionRenderTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.ctx = build_context()
        cls.rendered = render_sections(cls.ctx)
        cls.body = block.assemble(CONFIG, cls.rendered)

    def test_every_configured_section_renders(self) -> None:
        for name in CONFIG.order:
            with self.subTest(section=name):
                self.assertTrue(self.rendered[name], f"section {name} rendered nothing")

    def test_assembled_block_validates_against_readme_markers(self) -> None:
        readme = (SCRIPTS.parent / "README.md").read_text(encoding="utf-8")
        spliced = block.splice(readme, CONFIG, self.body)
        self.assertEqual(block.validate(spliced, CONFIG), [])

    def test_status_leads_with_badges(self) -> None:
        status = "\n".join(self.rendered["status"])
        self.assertIn("Live status", status)
        self.assertIn("Public_repos", status)
        self.assertIn("Total_stars", status)

    def test_recently_pushed_is_sorted_and_probes_commits(self) -> None:
        building = "\n".join(self.rendered["building"])
        self.assertIn("mcp-nexus", building)
        self.assertIn("feat: add deterministic benchmark gate to CI", building)
        positions = [building.index(name) for name in ("mcp-nexus", "textrieve", "repoarch")]
        self.assertEqual(positions, sorted(positions), "rows must follow pushed_at desc")

    def test_pinned_follows_curated_order_then_falls_back(self) -> None:
        pinned = "\n".join(self.rendered["pinned"])
        self.assertIn("curated", pinned)
        self.assertLess(pinned.index("mcp-nexus"), pinned.index("textrieve"))
        self.assertLess(pinned.index("textrieve"), pinned.index("repoarch"))
        self.assertEqual(pinned.count("| <img"), CONFIG.limits.pinned)

    def test_github_pinned_fills_rows_without_curated_list(self) -> None:
        from profilegen.sections import pinned as pinned_section

        config = replace(CONFIG, featured=())
        ctx = Context(
            config=config,
            bundle=collect(FixtureSource(FIXTURES, config), config, config.order),
            history=[],
        )
        out = "\n".join(pinned_section.render(ctx))
        self.assertIn("GitHub pinned", out)
        self.assertLess(out.index("dsk-dev-ai/mcp-nexus"), out.index("dsk-dev-ai/repoarch"))

    def test_forked_repositories_never_appear(self) -> None:
        self.assertNotIn("dsk-dev-ai/content", self.body)

    def test_excluded_repo_is_hidden_from_details_but_counted_in_totals(self) -> None:
        self.assertNotIn("[dsk-dev-ai](https://github.com/dsk-dev-ai/dsk-dev-ai)", self.body)
        # 17 stars from the detail repos + 1 from the excluded profile repo.
        self.assertIn("Total_stars-18", "\n".join(self.rendered["status"]))

    def test_health_matrix_scores_and_gaps(self) -> None:
        health = "\n".join(self.rendered["health"])
        self.assertIn("Repository health", health)
        self.assertIn("| 100% | 7/7 | all green |", health)
        self.assertIn("license, release", health)

    def test_growth_degrades_to_cadence_without_history(self) -> None:
        growth = "\n".join(self.rendered["growth"])
        self.assertIn("Growth", growth)
        self.assertIn("Stars/30d", growth)

    def test_contributions_lists_merged_pull_requests(self) -> None:
        contributions = "\n".join(self.rendered["contributions"])
        self.assertIn("Merged pull requests", contributions)
        self.assertIn("microsoft/agentrc#369", contributions)
        self.assertIn("mdn/content#45399", contributions)

    def test_activity_is_capped_and_relative(self) -> None:
        items = [line for line in self.rendered["activity"] if line.startswith("`")]
        self.assertLessEqual(len(items), CONFIG.limits.activity)
        self.assertTrue(all("ago`" in item for item in items))

    def test_language_mix_bars(self) -> None:
        languages = "\n".join(self.rendered["languages"])
        self.assertIn("Python", languages)
        self.assertIn("█", languages)

    def test_footer_links_the_workflow(self) -> None:
        self.assertIn("update-profile.yml", "\n".join(self.rendered["footer"]))


class SectionSelectionTests(unittest.TestCase):
    def test_only_renders_requested_sections(self) -> None:
        ctx = build_context(order=("status", "languages"))
        rendered = render_sections(ctx)
        self.assertEqual(set(rendered), {"status", "languages"})
        body = block.assemble(ctx.config, rendered)
        self.assertNotIn("Repository health", body)
        self.assertIn("Language mix", body)

    def test_collection_follows_selected_sections(self) -> None:
        config = replace(CONFIG, order=("status",))
        source = FixtureSource(FIXTURES, config)
        bundle = collect(source, config, config.order)
        self.assertEqual(bundle.commits, {}, "no commit probes without the building section")
        self.assertEqual(bundle.pulls, [], "no search call without contributions")
        self.assertEqual(bundle.trees, {}, "no tree walk without health")

    def test_full_collection_fetches_everything(self) -> None:
        config = CONFIG
        source = FixtureSource(FIXTURES, config)
        bundle = collect(source, config, config.order)
        self.assertEqual(len(bundle.commits), config.limits.commit_probe)
        self.assertEqual(len(bundle.trees), config.limits.health)
        self.assertEqual(len(bundle.pulls), 5)
        self.assertTrue(bundle.pinned)
        self.assertTrue(bundle.stars)


class PipelineTests(unittest.TestCase):
    def test_check_mode_exits_zero_on_fixtures(self) -> None:
        buffer = io.StringIO()
        with contextlib.redirect_stdout(buffer):
            code = run(Options(check=True, fixtures=FIXTURES, quiet=True))
        self.assertEqual(code, 0)

    def test_missing_markers_are_an_error(self) -> None:
        import tempfile
        from pathlib import Path

        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            (root / "README.md").write_text("no markers at all", encoding="utf-8")
            config = replace(CONFIG, root=root)
            import profilegen.run as run_module

            original = run_module.build_config
            run_module.build_config = lambda options: config  # type: ignore[assignment]
            try:
                with contextlib.redirect_stderr(io.StringIO()):
                    code = run(Options(check=True, fixtures=FIXTURES, quiet=True))
            finally:
                run_module.build_config = original  # type: ignore[assignment]
        self.assertEqual(code, 2)

    def test_dry_run_prints_without_writing(self) -> None:
        readme = (SCRIPTS.parent / "README.md")
        before = readme.read_text(encoding="utf-8")
        buffer = io.StringIO()
        with contextlib.redirect_stdout(buffer):
            code = run(Options(dry_run=True, fixtures=FIXTURES, quiet=True))
        self.assertEqual(code, 0)
        self.assertIn("Live status", buffer.getvalue())
        self.assertEqual(readme.read_text(encoding="utf-8"), before)


if __name__ == "__main__":
    unittest.main()
