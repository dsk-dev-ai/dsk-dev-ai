"""Data collection: which endpoints get hit depends on the enabled sections."""

from __future__ import annotations

import json
import sys
from pathlib import Path
from typing import Any, Protocol

from .config import Config
from .github import GitHubClient, paginate
from .models import DataBundle, Event, Profile, PullRequest, Repo, StarPoint


def _fixture_path(root: Path, *parts: str) -> Path:
    return root.joinpath(*parts)


class Source(Protocol):
    def profile(self) -> Profile | None: ...
    def repos(self) -> list[Repo]: ...
    def events(self) -> list[Event]: ...
    def commits(self, full_name: str, branch: str) -> str: ...
    def pinned(self) -> list[str]: ...
    def stars(self) -> list[StarPoint]: ...
    def pulls(self, user: str) -> list[PullRequest]: ...
    def tree_paths(self, repo: Repo) -> list[str]: ...
    def has_release(self, repo: Repo) -> bool: ...


class ApiSource:
    """Talks to the GitHub REST/GraphQL APIs through the resilient client."""

    def __init__(self, client: GitHubClient, config: Config):
        self.client = client
        self.config = config
        self.user = config.user

    def profile(self) -> Profile | None:
        data = self.client.get(f"https://api.github.com/users/{self.user}")
        return Profile.from_api(data) if isinstance(data, dict) else None

    def repos(self) -> list[Repo]:
        page = paginate(
            self.client,
            f"https://api.github.com/users/{self.user}/repos?per_page=100&type=public&sort=updated",
            limit=200,
        )
        return [Repo.from_api(item) for item in page if isinstance(item, dict)]

    def events(self) -> list[Event]:
        data = self.client.get(f"https://api.github.com/users/{self.user}/events/public?per_page=60")
        if not isinstance(data, list):
            return []
        return [Event.from_api(item) for item in data if isinstance(item, dict)]

    def commits(self, full_name: str, branch: str) -> str:
        data = self.client.get(f"https://api.github.com/repos/{full_name}/commits?per_page=1")
        if not isinstance(data, list) or not data:
            return "—"
        message = ((data[0].get("commit") or {}).get("message") or "").splitlines()
        return message[0] if message else "—"

    def pinned(self) -> list[str]:
        data = self.client.graphql(
            """
            query($login: String!) {
              user(login: $login) {
                pinnedItems(first: 6, types: REPOSITORY) {
                  nodes { ... on Repository { nameWithOwner } }
                }
              }
            }
            """,
            {"login": self.user},
        )
        try:
            nodes = data["data"]["user"]["pinnedItems"]["nodes"]
        except (TypeError, KeyError):
            return []
        return [n["nameWithOwner"] for n in nodes if n and n.get("nameWithOwner")]

    def stars(self) -> list[StarPoint]:
        page = paginate(
            self.client,
            f"https://api.github.com/users/{self.user}/starred?per_page=100",
            limit=300,
            headers={"Accept": "application/vnd.github.star+json"},
        )
        return [StarPoint.from_api(item) for item in page if isinstance(item, dict)]

    def pulls(self, user: str) -> list[PullRequest]:
        query = f"is:pr+is:merged+author:{user}"
        data = self.client.get(
            f"https://api.github.com/search/issues?q={query}&sort=updated&order=desc&per_page=30"
        )
        items = (data or {}).get("items") if isinstance(data, dict) else None
        if not isinstance(items, list):
            return []
        return [PullRequest.from_search(item) for item in items]

    def tree_paths(self, repo: Repo) -> list[str]:
        data = self.client.get(
            f"https://api.github.com/repos/{repo.full_name}/git/trees/{repo.default_branch}?recursive=1"
        )
        if not isinstance(data, dict):
            return []
        return [t.get("path", "") for t in (data.get("tree") or []) if t.get("type") == "blob"]

    def has_release(self, repo: Repo) -> bool:
        # A repository without releases answers 404 — that is a normal "no", not a fault.
        data = self.client.get(
            f"https://api.github.com/repos/{repo.full_name}/releases/latest",
            quiet_status=(404,),
        )
        return isinstance(data, dict) and bool(data.get("tag_name"))


class FixtureSource:
    """Offline source used by tests and ``--fixtures`` runs."""

    def __init__(self, root: Path, config: Config):
        self.root = root
        self.config = config

    def _load(self, *parts: str, default: Any = None) -> Any:
        path = _fixture_path(self.root, *parts)
        if not path.exists():
            if default is not None:
                return default
            print(f"warning: missing fixture {path}", file=sys.stderr)
            return None
        try:
            return json.loads(path.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError) as exc:
            print(f"warning: bad fixture {path}: {exc}", file=sys.stderr)
            return None

    @staticmethod
    def _slug(full_name: str) -> str:
        return full_name.replace("/", "__")

    def profile(self) -> Profile | None:
        data = self._load("user.json")
        return Profile.from_api(data) if isinstance(data, dict) else None

    def repos(self) -> list[Repo]:
        data = self._load("repos.json", default=[])
        return [Repo.from_api(item) for item in data or [] if isinstance(item, dict)]

    def events(self) -> list[Event]:
        data = self._load("events.json", default=[])
        return [Event.from_api(item) for item in data or [] if isinstance(item, dict)]

    def commits(self, full_name: str, branch: str) -> str:
        data = self._load("commits", f"{self._slug(full_name)}.json", default=[])
        if not isinstance(data, list) or not data:
            return "—"
        message = ((data[0].get("commit") or {}).get("message") or "").splitlines()
        return message[0] if message else "—"

    def pinned(self) -> list[str]:
        data = self._load("pinned.json", default={})
        try:
            nodes = data["data"]["user"]["pinnedItems"]["nodes"]
        except (TypeError, KeyError):
            return []
        return [n["nameWithOwner"] for n in nodes if n and n.get("nameWithOwner")]

    def stars(self) -> list[StarPoint]:
        data = self._load("stars.json", default=[])
        return [StarPoint.from_api(item) for item in data or [] if isinstance(item, dict)]

    def pulls(self, user: str) -> list[PullRequest]:
        data = self._load("search.json", default={})
        items = data.get("items") if isinstance(data, dict) else None
        return [PullRequest.from_search(item) for item in items or []]

    def tree_paths(self, repo: Repo) -> list[str]:
        data = self._load("trees", f"{self._slug(repo.full_name)}.json", default={})
        if isinstance(data, dict) and "paths" in data:
            return list(data.get("paths") or [])
        if isinstance(data, dict):
            return [t.get("path", "") for t in (data.get("tree") or []) if t.get("type") == "blob"]
        return []

    def has_release(self, repo: Repo) -> bool:
        data = self._load("releases", f"{self._slug(repo.full_name)}.json", default={})
        return isinstance(data, dict) and bool(data.get("tag_name"))


def collect(source: Source, config: Config, sections: tuple[str, ...]) -> DataBundle:
    """Fetch only what the enabled sections need."""
    limits = config.limits
    need = set(sections)

    profile = source.profile()
    repos = source.repos()
    owned = [r for r in repos if not r.fork and not config.is_excluded(r.name, r.full_name)]
    events = source.events() if "activity" in need else []

    commits: dict[str, str] = {}
    if "building" in need:
        recent = sorted(owned, key=lambda r: r.pushed_at or "", reverse=True)
        for repo in [r for r in recent if r.pushed_at][: limits.commit_probe]:
            commits[repo.full_name] = source.commits(repo.full_name, repo.default_branch)

    pinned: list[str] = source.pinned() if "pinned" in need else []
    stars: list[StarPoint] = source.stars() if "growth" in need else []
    pulls = source.pulls(config.user) if "contributions" in need else []

    trees: dict[str, dict[str, Any]] = {}
    releases: dict[str, dict[str, Any]] = {}
    if "health" in need:
        ranked = sorted(owned, key=lambda r: (r.stars, r.pushed_at), reverse=True)
        for repo in ranked[: limits.health]:
            paths = source.tree_paths(repo)
            released = source.has_release(repo)
            trees[repo.full_name] = {"paths": paths}
            if released:
                releases[repo.full_name] = {"tag_name": "latest"}

    return DataBundle(
        profile=profile,
        repos=repos,
        events=events,
        stars=stars,
        pinned=pinned,
        pulls=pulls,
        commits=commits,
        trees=trees,
        releases=releases,
    )
