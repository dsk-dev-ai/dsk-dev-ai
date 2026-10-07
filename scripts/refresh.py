#!/usr/bin/env python3
"""Generate the live README block for dsk-dev-ai's GitHub profile.

Pure standard library. Reads public GitHub data (or bundled fixtures) and renders
the block between the LIVE markers in README.md.

Usage:
    GH_TOKEN=$(gh auth token) python scripts/refresh.py
    python scripts/refresh.py --fixtures tests/fixtures --check
    python scripts/refresh.py --dry-run --only growth,languages
    python scripts/refresh.py --skip activity --no-cache
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from profilegen.run import Options, run  # noqa: E402


def parse_args(argv: list[str] | None = None) -> Options:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--check", action="store_true", help="validate structure, write nothing, exit 1 on errors")
    parser.add_argument("--dry-run", action="store_true", help="print the block instead of writing README.md")
    parser.add_argument("--only", default="", help="comma-separated sections to render (implies: skip the rest)")
    parser.add_argument("--skip", default="", help="comma-separated sections to drop")
    parser.add_argument("--fixtures", default=None, help="render from a fixture directory (offline)")
    parser.add_argument("--no-cache", action="store_true", help="ignore the on-disk response cache")
    parser.add_argument("--quiet", action="store_true", help="suppress progress output")
    args = parser.parse_args(argv)

    return Options(
        check=args.check,
        dry_run=args.dry_run,
        only=[s for s in args.only.split(",") if s.strip()],
        skip=[s for s in args.skip.split(",") if s.strip()],
        fixtures=Path(args.fixtures) if args.fixtures else None,
        no_cache=args.no_cache,
        quiet=args.quiet,
    )


def main(argv: list[str] | None = None) -> int:
    return run(parse_args(argv))


if __name__ == "__main__":
    raise SystemExit(main())
