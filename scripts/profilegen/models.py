"""Typed views over GitHub API payloads."""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any


def parse_iso(value: str | None) -> datetime | None:
    if not value:
        return None
    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        return None


def _int(value: Any, default: int = 0) -> int:
    try:
        return int(value)
    except (TypeError, ValueError):
        return default


@dataclass(frozen=True)
class License:
    spdx_id: str
    name: str


@dataclass(frozen=True)
class Repo:
    name: str
    full_name: str
    description: str
    language: str | None
    stars: int
    forks: int
    open_issues: int
    watchers: int
    created_at: str
    pushed_at: str
    updated_at: str
    homepage: str
    topics: tuple[str, ...]
    archived: bool
    fork: bool
    is_template: bool
    default_branch: str
    license: str | None
    url: str

    @classmethod
    def from_api(cls, payload: dict[str, Any]) -> "Repo":
        license_info = payload.get("license") or {}
        return cls(
            name=payload.get("name") or "",
            full_name=payload.get("full_name") or "",
            description=payload.get("description") or "",
            language=payload.get("language"),
            stars=_int(payload.get("stargazers_count")),
            forks=_int(payload.get("forks_count")),
            open_issues=_int(payload.get("open_issues_count")),
            watchers=_int(payload.get("watchers_count")),
            created_at=payload.get("created_at") or "",
            pushed_at=payload.get("pushed_at") or "",
            updated_at=payload.get("updated_at") or "",
            homepage=payload.get("homepage") or "",
            topics=tuple(payload.get("topics") or ()),
            archived=bool(payload.get("archived")),
            fork=bool(payload.get("fork")),
            is_template=bool(payload.get("is_template")),
            default_branch=payload.get("default_branch") or "main",
            license=(license_info.get("spdx_id") or None) if license_info else None,
            url=payload.get("html_url") or f"https://github.com/{payload.get('full_name', '')}",
        )


@dataclass(frozen=True)
class Profile:
    login: str
    name: str
    bio: str
    followers: int
    following: int
    public_repos: int
    public_gists: int
    created_at: str
    avatar_url: str
    blog: str

    @classmethod
    def from_api(cls, payload: dict[str, Any]) -> "Profile":
        return cls(
            login=payload.get("login") or "",
            name=payload.get("name") or "",
            bio=payload.get("bio") or "",
            followers=_int(payload.get("followers")),
            following=_int(payload.get("following")),
            public_repos=_int(payload.get("public_repos")),
            public_gists=_int(payload.get("public_gists")),
            created_at=payload.get("created_at") or "",
            avatar_url=payload.get("avatar_url") or "",
            blog=payload.get("blog") or "",
        )


@dataclass(frozen=True)
class Event:
    type: str
    repo: str
    created_at: str
    action: str
    detail: str = ""

    @classmethod
    def from_api(cls, payload: dict[str, Any]) -> "Event":
        event_type = payload.get("type") or ""
        repo = (payload.get("repo") or {}).get("name") or ""
        created = payload.get("created_at") or ""
        data = payload.get("payload") or {}
        action, detail = _describe(event_type, data)
        return cls(type=event_type, repo=repo, created_at=created, action=action, detail=detail)


def _describe(event_type: str, data: dict[str, Any]) -> tuple[str, str]:
    if event_type == "PushEvent":
        commits = data.get("commits") or []
        size = data.get("distinct_size") or data.get("size") or len(commits)
        message = (commits[0].get("message", "") if commits else "").splitlines()
        detail = message[0] if message else ""
        ref = data.get("ref") or ""
        if not size:
            if ref.startswith("refs/heads/"):
                return f"pushed `{ref.split('/', 2)[2]}` to", detail
            return "pushed changes to", detail
        plural = "" if size == 1 else "s"
        return f"pushed {size} commit{plural} to", detail
    if event_type == "CreateEvent":
        ref_type = data.get("ref_type")
        if ref_type == "repository":
            return "created repository", ""
        return f"created {ref_type or 'ref'}", data.get("ref") or ""
    if event_type == "DeleteEvent":
        return f"deleted {data.get('ref_type') or 'ref'}", data.get("ref") or ""
    if event_type == "ForkEvent":
        forkee = (data.get("forkee") or {}).get("full_name")
        return "forked", forkee or ""
    if event_type == "WatchEvent":
        return "starred", ""
    if event_type == "IssuesEvent":
        return f"{data.get('action') or 'updated'} an issue in", _issue_label(data)
    if event_type == "PullRequestEvent":
        return f"{data.get('action') or 'updated'} a PR in", _pr_label(data)
    if event_type == "ReleaseEvent":
        release = data.get("release") or {}
        return "released", release.get("tag_name") or release.get("name") or ""
    if event_type == "PublicEvent":
        return "made public", ""
    if event_type == "IssueCommentEvent":
        return "commented on an issue in", ""
    if event_type == "PullRequestReviewEvent":
        return "reviewed a PR in", ""
    return "", ""


def _issue_label(data: dict[str, Any]) -> str:
    issue = data.get("issue") or {}
    number = issue.get("number")
    title = issue.get("title") or ""
    return f"#{number} {title}" if number else title


def _pr_label(data: dict[str, Any]) -> str:
    pr = data.get("pull_request") or {}
    number = pr.get("number")
    title = pr.get("title") or ""
    return f"#{number} {title}" if number else title


@dataclass(frozen=True)
class StarPoint:
    starred_at: str

    @classmethod
    def from_api(cls, payload: dict[str, Any]) -> "StarPoint":
        return cls(starred_at=payload.get("starred_at") or payload.get("created_at") or "")


@dataclass(frozen=True)
class PullRequest:
    number: int
    title: str
    repo: str
    url: str
    merged_at: str
    state: str

    @classmethod
    def from_search(cls, item: dict[str, Any]) -> "PullRequest":
        repository_url = item.get("repository_url") or ""
        repo = repository_url.removeprefix("https://api.github.com/repos/")
        return cls(
            number=_int(item.get("number")),
            title=item.get("title") or "",
            repo=repo,
            url=item.get("html_url") or "",
            merged_at=(item.get("pull_request") or {}).get("merged_at") or item.get("closed_at") or "",
            state=item.get("state") or "",
        )


@dataclass(frozen=True)
class HealthRow:
    repo: Repo
    score: int
    checks: tuple[tuple[str, bool], ...] = field(default_factory=tuple)


@dataclass
class DataBundle:
    """Everything fetched for one render pass."""

    profile: Profile | None
    repos: list[Repo]
    events: list[Event]
    stars: list[StarPoint]
    pinned: list[str]
    pulls: list[PullRequest]
    commits: dict[str, str] = field(default_factory=dict)
    trees: dict[str, dict[str, Any]] = field(default_factory=dict)
    releases: dict[str, dict[str, Any]] = field(default_factory=dict)

    @property
    def own_repos(self) -> list[Repo]:
        return [repo for repo in self.repos if not repo.fork]


def now_utc() -> datetime:
    return datetime.now(timezone.utc)
