#!/usr/bin/env python3
"""Generate the live README section for dsk-dev-ai's GitHub profile.

Pure standard library. Reads public GitHub data and renders an 'Live status'
block between the LIVE markers. Designed to run inside a GitHub Actions
workflow (hourly) that commits the output back; also runs locally with
GH_TOKEN set (e.g. `GH_TOKEN=$(gh auth token) python scripts/refresh.py`).
"""

import json
import os
import re
import sys
from datetime import datetime, timezone
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

USER = "dsk-dev-ai"
START = "<!-- LIVE:START -->"
END = "<!-- LIVE:END -->"
MAX_REPO_CALLS = 5

TOKEN = os.environ.get("GH_TOKEN") or os.environ.get("GITHUB_TOKEN")

COLORS = {
    "TypeScript": "#3178c6",
    "JavaScript": "#f1e05a",
    "Python": "#3776ab",
    "Rust": "#dea584",
    "Go": "#00ADD8",
    "Java": "#b07219",
    "C++": "#f34b7d",
    "C": "#555555",
    "C#": "#178600",
    "Shell": "#89e051",
    "HTML": "#e34c26",
    "CSS": "#563d7c",
    "Jupyter Notebook": "#DA5B0B",
    "Dockerfile": "#384d54",
    "Vue": "#41b883",
    "Svelte": "#ff3e00",
    "Astro": "#ff5a03",
    "Ruby": "#701516",
    "PHP": "#4F5D95",
    "Kotlin": "#A97BFF",
    "Swift": "#F05138",
    "Solidity": "#AA6746",
}
FALLBACK = "#8b949e"
EMOJI = re.compile(
    "["
    "\U0001F000-\U0001FAFF"  # misc symbols & pictographs, supplemental
    "\U0001F900-\U0001F9FF"  # supplemental symbols & pictographs
    "\U00002600-\U000027BF"  # misc symbols, dingbats
    "\U0000FE00-\U0000FE0F"  # variation selectors
    "\U0001F1E6-\U0001F1FF"  # regional indicators
    "\u200d\u20e3"
    "]"
)


def _request(url: str):
    headers = {
        "Accept": "application/vnd.github+json",
        "User-Agent": "dsk-dev-ai-profile-refresh",
    }
    if TOKEN:
        headers["Authorization"] = f"Bearer {TOKEN}"
    try:
        with urlopen(Request(url, headers=headers), timeout=30) as r:
            return json.load(r)
    except HTTPError as exc:
        print(f"warning: {url} -> {exc.code}", file=sys.stderr)
        return None
    except URLError as exc:
        print(f"warning: {url} -> {exc.reason}", file=sys.stderr)
        return None


def _lang_color(name: str) -> str:
    return COLORS.get(name or "", FALLBACK)


def _lang_hex(name: str) -> str:
    return _lang_color(name).lstrip("#")


def _ago(iso: str) -> str:
    if not iso:
        return "unknown"
    try:
        dt = datetime.fromisoformat(iso.replace("Z", "+00:00"))
    except ValueError:
        dt = datetime.now(timezone.utc)
    secs = max(0, int((datetime.now(timezone.utc) - dt).total_seconds()))
    units = [("d", 86400), ("h", 3600), ("m", 60)]
    for suffix, size in units:
        if secs >= size or size == 60:
            if size == 60:
                return f"{secs}s ago"
            val = secs // size
            return f"{val}{suffix} ago"
    return f"{secs}s ago"


def _esc(text: str, limit: int = 0) -> str:
    if not text:
        return ""
    text = str(text).strip().replace("\n", " ").replace("\r", " ")
    text = EMOJI.sub("", text)
    text = text.replace("|", "\\|").replace("`", "'").replace("<", "&lt;").replace(">", "&gt;")
    if limit and len(text) > limit:
        text = text[: limit - 1].rstrip() + "…"
    return text


def main():
    user = _request(f"https://api.github.com/users/{USER}")
    repos = _request(
        f"https://api.github.com/users/{USER}/repos?per_page=100&type=public&sort=updated"
    ) or []
    repos = [r for r in repos if not r.get("fork")]
    events = _request(f"https://api.github.com/users/{USER}/events/public?per_page=60") or []
    now_ts = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")

    total_stars = sum(int(r.get("stargazers_count") or 0) for r in repos)
    followers = (user or {}).get("followers", 0)
    following = (user or {}).get("following", 0)
    repo_count = (user or {}).get("public_repos", len(repos))

    # ---- recently pushed (building now) + latest commit message ----
    recents = sorted(repos, key=lambda r: r.get("pushed_at") or "", reverse=True)[:MAX_REPO_CALLS]
    building = []
    for repo in recents:
        full_name = repo.get("full_name", "")
        latest = "—"
        if full_name:
            data = _request(f"https://api.github.com/repos/{full_name}/commits?per_page=1")
            if data:
                latest = (data[0].get("commit") or {}).get("message", "—").splitlines()[0]
        building.append((repo, latest))

    # ---- most starred ----
    starred = sorted(repos, key=lambda r: int(r.get("stargazers_count") or 0), reverse=True)[
        :4
    ]
    starred = [r for r in starred if int(r.get("stargazers_count") or 0) > 0]

    # ---- language mix ----
    lang_totals = {}
    for r in repos:
        lang = r.get("language")
        if lang:
            lang_totals[lang] = lang_totals.get(lang, 0) + 1
    total_langs = sum(lang_totals.values()) or 1
    top_langs = sorted(lang_totals.items(), key=lambda kv: -kv[1])[:5]

    # ---- activity feed ----
    feed = []
    seen = set()
    for ev in events:
        if len(feed) >= 8:
            break
        typ = ev.get("type", "")
        repo_name = (ev.get("repo") or {}).get("name", "")
        created = ev.get("created_at", "")
        payload = ev.get("payload") or {}
        if typ == "PushEvent":
            commits = payload.get("commits") or []
            n = payload.get("distinct_size")
            n = n if isinstance(n, int) and n else payload.get("size")
            n = n if isinstance(n, int) and n else len(commits)
            msg = (commits[0].get("message", "").splitlines()[0] if commits else "")
            ref = payload.get("ref") or ""
            if ref.startswith("refs/heads/"):
                ref_label = f"branch `{ref.split('/', 2)[2]}`"
            elif ref.startswith("refs/tags/"):
                ref_label = f"tag `{ref.rsplit('/', 1)[-1]}`"
            else:
                ref_label = None
            if n:
                action = f"pushed {n} commit{'s' if n != 1 else ''} to"
            elif ref_label:
                action = f"pushed {ref_label} to"
            else:
                action = "pushed changes to"
        elif typ == "CreateEvent":
            ref_type = payload.get("ref_type")
            action = "created repository" if ref_type == "repository" else f"created {ref_type}"
        elif typ == "ForkEvent":
            action = "forked"
        elif typ == "WatchEvent":
            action = "starred"
        elif typ == "IssuesEvent":
            action = f"{payload.get('action')} an issue in"
        elif typ == "PullRequestEvent":
            action = f"{payload.get('action')} a PR in"
        elif typ == "ReleaseEvent":
            action = "released"
        elif typ == "PublicEvent":
            action = "made public"
        else:
            continue
        repo_link = f"[{repo_name}](https://github.com/{repo_name})"
        suffix = (f" — \"{_esc(msg, 80)}\"" if typ == "PushEvent" and msg else "")
        feed.append((created, _ago(created), action, repo_link, suffix))

    # newest activity first (the events API can return ids out of time order)
    feed.sort(key=lambda item: item[0], reverse=True)
    feed = feed[:8]

    # ---- render ----
    lines = []
    lines.append("**Live status — auto-refreshed hourly by GitHub Actions** · last run "
                 f"`{now_ts}`")
    lines.append("")
    lines.append(f"![Repos](https://img.shields.io/badge/Public_repos-{repo_count}-34d399?"
                 "style=for-the-badge) "
                 f"![Stars](https://img.shields.io/badge/Total_stars-{total_stars}-6c8cff?style=for-the-badge) "
                 f"![Followers](https://img.shields.io/badge/Followers-{followers}-0ea5e9?style=for-the-badge)")
    lines.append("")

    lines.append("| | Repo | Stars | Language | Latest |")
    lines.append("| --- | --- | --- | --- | --- |")
    for repo, latest in building:
        lang = repo.get("language")
        dot = (f"<img width=14 src='https://img.shields.io/badge/%E2%80%8B-%E2%80%8B-"
               f"%23{_lang_hex(lang)}' title='{_esc(lang)}'>")
        lines.append(
            f"| {dot} | [{repo.get('name')}](https://github.com/{repo.get('full_name')}) "
            f"| {repo.get('stargazers_count') or 0} "
            f"| `{_esc(lang, 18)}` "
            f"| {_esc(latest, 60)} |"
        )

    if starred:
        lines.append("")
        lines.append("**Most starred**")
        lines.append("")
        lines.append("| Repo | Stars | Description |")
        lines.append("| --- | --- | --- |")
        for repo in starred:
            name = repo.get("name")
            desc = _esc(repo.get("description"), 90) or "—"
            url = repo.get("homepage") or f"https://github.com/{repo.get('full_name')}"
            title = f"[{name}]({url})" if url else name
            lines.append(f"| {title} | {repo.get('stargazers_count')} | {desc} |")

    if feed:
        lines.append("")
        lines.append("**Latest public activity**")
        lines.append("")
        for created, ago, action, repo_link, suffix in feed:
            lines.append(f"- `{ago}` — {action} {repo_link}{suffix}")

    if top_langs:
        lines.append("")
        lines.append("**Language mix**")
        lines.append("")
        lines.append("```")
        for lang, count in top_langs:
            share = count / total_langs
            bar = "█" * round(share * 24)
            lines.append(f"{lang:<16} {share * 100:4.0f}%  {bar}")
        lines.append("```")
    lines.append("")
    lines.append(
        "_Refreshed every hour by [update-profile.yml](.github/workflows/update-profile.yml) "
        "— GitHub-native · no third party · covers public activity only._"
    )

    block = "\n".join(lines)

    readme_path = Path(__file__).resolve().parent.parent / "README.md"
    text = readme_path.read_text(encoding="utf-8")
    if START not in text:
        print("LIVE markers not found in README", file=sys.stderr)
        sys.exit(1)
    before, _, after = text.partition(START)
    _, _, tail = after.partition(END)
    new_text = before + START + "\n\n" + block + "\n\n" + END + tail
    readme_path.write_text(new_text, encoding="utf-8")
    print(f"README updated (public repos={repo_count}, stars={total_stars}, followers={followers})")


if __name__ == "__main__":
    main()