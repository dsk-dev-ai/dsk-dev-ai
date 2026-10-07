#!/usr/bin/env python3
"""Export GitHub profile data to site/data/profile.json for the website.

Reuses the profilegen collector (same resilient client as the README generator).

    GH_TOKEN=$(gh auth token) python3 scripts/export_site_data.py
    python3 scripts/export_site_data.py --out site/data/profile.json --no-readmes
"""

from __future__ import annotations

import argparse
import json
import sys
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "scripts"))

from profilegen import metrics  # noqa: E402
from profilegen.collect import ApiSource, collect  # noqa: E402
from profilegen.config import load  # noqa: E402
from profilegen.github import GitHubClient  # noqa: E402

DEFAULT_OUT = ROOT / "site" / "data" / "profile.json"
SECTIONS = ("status", "building", "pinned", "starred", "activity", "languages")


def slug(repo_full_name: str) -> str:
    return repo_full_name.split("/")[-1].lower()


def fetch_json(client: GitHubClient, url: str) -> dict:
    try:
        data = client.get(url, quiet_status=(404, 403, 429))
        if isinstance(data, dict):
            return data
    except Exception:  # noqa: BLE001
        pass
    return {}


def contributors_count(client: GitHubClient, full_name: str) -> int:
    url = f"https://api.github.com/repos/{full_name}/contributors?per_page=1"
    try:
        _ = client.get(url, quiet_status=(404, 403))
        headers = getattr(client, "_last_link_headers", {}) or {}
        link = headers.get("Link") or headers.get("link") or ""
        if 'rel="last"' in link:
            start = link.find("<")
            end = link.find(">", start)
            if start != -1 and end != -1:
                last = link[start + 1 : end]
                try:
                    return int(last.rsplit("=", 1)[-1])
                except ValueError:
                    pass
        # if no Link but first page returned array of length>=1, count unknown? small
        return 0
    except Exception:  # noqa: BLE001
        return 0


def latest_release(client: GitHubClient, full_name: str) -> dict:
    data = fetch_json(client, f"https://api.github.com/repos/{full_name}/releases/latest")
    if not data:
        return {}
    return {
        "tag": data.get("tag_name") or "",
        "name": data.get("name") or "",
        "published_at": data.get("published_at") or "",
        "html_url": data.get("html_url") or "",
    }


def last_commit(client: GitHubClient, full_name: str, branch: str | None) -> dict:
    ref = branch or "HEAD"
    for target in (ref, "HEAD", "main", "master"):
        data = fetch_json(client, f"https://api.github.com/repos/{full_name}/commits/{target}")
        if data and "sha" in data:
            break
    else:
        return {}
    commit = data.get("commit") or {}
    author = commit.get("author") or {}
    return {
        "sha": (data.get("sha") or "")[:7],
        "sha_full": data.get("sha") or "",
        "date": author.get("date") or commit.get("committer", {}).get("date") or "",
        "message": (commit.get("message") or "").splitlines()[0] if commit.get("message") else "",
        "html_url": data.get("html_url") or "",
    }



def fetch_raw(client: GitHubClient, url: str) -> str:
    """Fetch a raw text file (README) — '' when missing or unreachable."""
    headers = {"User-Agent": "darshankachare-site-export"}
    if client.token:
        headers["Authorization"] = f"Bearer {client.token}"
    try:
        with urlopen(Request(url, headers=headers), timeout=30) as response:  # noqa: S310
            body = response.read().decode("utf-8", errors="replace")
        return body if body.strip() else ""
    except Exception:  # noqa: BLE001 - a missing README must never fail the build
        return ""


def classify(repo: str, user: str, upstream: set[str]) -> str:
    if repo in upstream:
        return "upstream"
    if repo.startswith(f"{user}/"):
        return "own"
    if repo.startswith("nextgenai-labs/"):
        return "org"
    return "upstream"


def search_merged_prs(client: GitHubClient, user: str, limit: int = 400) -> list[dict]:
    """Merged PRs authored by ``user`` across GitHub (search index coverage varies)."""
    from profilegen.github import _next_link
    from profilegen.models import PullRequest

    url = (
        f"https://api.github.com/search/issues?q=is:pr+is:merged+author:{user}"
        "&sort=updated&order=desc&per_page=100"
    )
    raw: list[dict] = []
    next_url: str | None = url
    seen: set[str] = set()
    while next_url and len(raw) < limit and next_url not in seen:
        seen.add(next_url)
        page = client.get(next_url)
        if not isinstance(page, dict):  # search responses wrap results in "items"
            break
        raw.extend(page.get("items") or [])
        next_url = _next_link(page, next_url, client)
    return [
        {
            "repo": pr.repo,
            "number": pr.number,
            "title": pr.title,
            "url": pr.url,
            "merged_at": pr.merged_at,
            "author": user.lower(),
            "via": "author",
        }
        for pr in (PullRequest.from_search(item) for item in raw[:limit])
        if pr.merged_at
    ]


def upstream_prs(
    client: GitHubClient, user: str, repos: tuple[str, ...], scanned: set[str]
) -> list[dict]:
    """Merged PRs in third-party repositories that the search index missed."""
    from profilegen.github import paginate

    found: list[dict] = []
    for repo in repos:
        if repo in scanned:
            continue
        page = paginate(
            client,
            f"https://api.github.com/repos/{repo}/pulls?state=closed&per_page=100",
            limit=1000,
        )
        for item in page:
            if not item.get("merged_at"):
                continue
            author = ((item.get("user") or {}).get("login") or "").lower()
            body = item.get("body") or ""
            if author == user.lower():
                via = "author"
            elif f"@{user}" in body:
                via = "commits"  # PR opened by a maintainer, preserving the user's commits
            else:
                continue
            found.append(
                {
                    "repo": repo,
                    "number": item.get("number") or 0,
                    "title": item.get("title") or "",
                    "url": item.get("html_url") or "",
                    "merged_at": item["merged_at"],
                    "author": author,
                    "via": via,
                }
            )
    found.sort(key=lambda pr: pr["merged_at"], reverse=True)
    return found


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--out", default=str(DEFAULT_OUT))
    parser.add_argument("--no-readmes", action="store_true", help="skip README fetch (faster)")
    args = parser.parse_args()

    config = load(ROOT / "scripts" / "profile.toml")
    client = GitHubClient(cache=None)
    source = ApiSource(client, config)
    bundle = collect(source, config, SECTIONS)

    now = datetime.now(timezone.utc)
    owned = [r for r in bundle.own_repos if not config.is_excluded(r.name, r.full_name)]
    totals = metrics.totals(bundle.profile, bundle.own_repos)

    # --- merged pull requests, grouped by repository ---
    upstream_set = set(config.upstream)
    searched = search_merged_prs(client, config.user)
    indexed = [pr for pr in searched if pr["repo"] in upstream_set]
    known = {pr["repo"] for pr in indexed}
    upstream = indexed + upstream_prs(client, config.user, config.upstream, known)

    merged = [pr for pr in searched if pr["repo"] not in upstream_set] + upstream
    merged.sort(key=lambda pr: pr["merged_at"], reverse=True)
    by_repo: Counter[str] = Counter(pr["repo"] for pr in merged)
    buckets: dict[str, list[dict]] = {"upstream": [], "org": [], "own": []}
    for pr in merged:
        buckets[classify(pr["repo"], config.user, upstream_set)].append(pr)

    # --- projects ---
    # Keep previously exported READMEs when a raw fetch comes back empty
    # (rate limits during CI builds must never degrade the site).
    previous: dict = {}
    if Path(args.out).exists():
        try:
            previous = json.loads(Path(args.out).read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError):
            previous = {}
    old_readmes: dict[str, str] = previous.get("readmes") or {}

    readmes: dict[str, str] = {}
    projects = []
    for repo in sorted(owned, key=lambda r: (r.stars, r.pushed_at), reverse=True):
        key = slug(repo.full_name)
        readme = ""
        if not args.no_readmes:
            readme = fetch_raw(client, f"https://raw.githubusercontent.com/{repo.full_name}/HEAD/README.md")
            if not readme:
                readme = fetch_raw(client, f"https://raw.githubusercontent.com/{repo.full_name}/main/README.md")
            if not readme:
                readme = fetch_raw(client, f"https://raw.githubusercontent.com/{repo.full_name}/master/README.md")
            if not readme:
                readme = old_readmes.get(key, "")
        readmes[key] = readme
        projects.append(
            {
                "slug": key,
                "name": repo.name,
                "full_name": repo.full_name,
                "description": repo.description,
                "language": repo.language,
                "stars": repo.stars,
                "forks": repo.forks,
                "open_issues": repo.open_issues,
                "topics": list(repo.topics),
                "homepage": repo.homepage,
                "url": repo.url,
                "license": repo.license,
                "pushed_at": repo.pushed_at,
                "created_at": repo.created_at,
                "archived": repo.archived,
                "has_readme": bool(readme),
                # enriched
                "default_branch": getattr(repo, "default_branch", None) or "",
                "size_kb": getattr(repo, "size", 0),
                "watchers": getattr(repo, "watchers", 0),
                "contributors_count": contributors_count(client, repo.full_name),
                "latest_release": latest_release(client, repo.full_name),
                "last_commit": last_commit(client, repo.full_name, getattr(repo, "default_branch", None)),
            }
        )

    featured_names = config.site_featured or config.featured
    featured_order = [slug(f"{config.user}/{name}" if "/" not in name else name) for name in featured_names]
    featured = [p for p in projects if p["slug"] in featured_order]
    featured.sort(key=lambda p: featured_order.index(p["slug"]))

    languages = [
        {"name": name, "count": count, "share": round(share, 4)}
        for name, count, share in metrics.language_mix(owned, limit=8)
    ]

    # --- activity: recent, varied, no self-star/branch noise ---
    curated: list[dict] = []
    per_repo: Counter[str] = Counter()
    seen_actions: set[tuple[str, str]] = set()
    for ev in bundle.events:
        action = (ev.action or "").lower()
        if action.startswith(("starred", "forked")) and ev.repo.startswith(f"{config.user}/"):
            continue  # starring your own repository is not activity worth showing
        if "created branch" in action:
            continue
        if per_repo[ev.repo] >= 2:
            continue  # one repository must not flood the feed
        if (ev.repo, ev.action) in seen_actions:
            continue
        seen_actions.add((ev.repo, ev.action))
        per_repo[ev.repo] += 1
        curated.append(
            {
                "type": ev.type,
                "repo": ev.repo,
                "action": ev.action,
                "detail": ev.detail,
                "created_at": ev.created_at,
            }
        )
        if len(curated) >= 12:
            break

    payload = {
        "generated_at": now.isoformat(timespec="seconds"),
        "profile": {
            "login": bundle.profile.login if bundle.profile else config.user,
            "name": bundle.profile.name if bundle.profile else "",
            "bio": bundle.profile.bio if bundle.profile else "",
            "followers": totals["followers"],
            "following": totals["following"],
            "public_repos": totals["repo_count"],
            "stars": totals["stars"],
            "forks": totals["forks"],
            "avatar_url": bundle.profile.avatar_url if bundle.profile else "",
        },
        "stats": {
            "merged_prs_total": sum(by_repo.values()),
            "merged_repos_total": len(by_repo),
            "upstream_prs": len(buckets["upstream"]),
            "org_prs": len(buckets["org"]),
            "own_prs": len(buckets["own"]),
        },
        "languages": languages,
        "featured": [p["slug"] for p in featured],
        "projects": projects,
        "readmes": readmes,
        "activity": curated,
        "contributions": {
            "upstream": buckets["upstream"],
            "org": buckets["org"],
            "org_repos": [
                {"repo": repo, "count": count}
                for repo, count in by_repo.items()
                if classify(repo, config.user, upstream_set) == "org"
            ],
        },
    }

    out = Path(args.out)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(
        f"wrote {out} ({len(projects)} projects, {len(featured)} featured, "
        f"{len(buckets['upstream'])} upstream PRs, {len(readmes)} readmes)"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
