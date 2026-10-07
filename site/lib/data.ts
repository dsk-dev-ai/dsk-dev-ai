import raw from "@/data/profile.json";

export interface Project {
  slug: string;
  name: string;
  full_name: string;
  description: string | null;
  language: string | null;
  stars: number;
  forks: number;
  open_issues: number;
  topics: string[];
  homepage: string | null;
  url: string;
  license: string | null;
  pushed_at: string;
  created_at: string;
  archived: boolean;
  has_readme: boolean;
  default_branch: string;
  size_kb: number;
  watchers: number;
  contributors_count: number;
  latest_release: {
    tag: string;
    name: string;
    published_at: string;
    html_url: string;
  };
  last_commit: {
    sha: string;
    sha_full: string;
    date: string;
    message: string;
    html_url: string;
  } | null;
}

export interface PrEntry {
  repo: string;
  number: number;
  title: string;
  url: string;
  merged_at: string;
  author: string;
  via: "author" | "commits";
}

export interface ActivityEvent {
  type: string;
  repo: string;
  action: string;
  detail: string;
  created_at: string;
}

export interface ProfileData {
  generated_at: string;
  profile: {
    login: string;
    name: string;
    bio: string;
    followers: number;
    following: number;
    public_repos: number;
    stars: number;
    forks: number;
    avatar_url: string;
  };
  stats: {
    merged_prs_total: number;
    merged_repos_total: number;
    upstream_prs: number;
    org_prs: number;
    own_prs: number;
  };
  languages: { name: string; count: number; share: number }[];
  featured: string[];
  projects: Project[];
  readmes: Record<string, string>;
  activity: ActivityEvent[];
  contributions: {
    upstream: PrEntry[];
    org: PrEntry[];
    org_repos: { repo: string; count: number }[];
  };
}

export const data = raw as unknown as ProfileData;

export const SITE = {
  domain: "darshankachare.com",
  url: "https://darshankachare.com",
  title: "Darshan Kachare",
  tagline: "Software engineer — AI infrastructure, systems design, and products that ship.",
  bio: "I design and ship AI infrastructure, developer platforms, and production-grade systems — mostly in TypeScript, Python, and Rust.",
  email: "darshan.kachare.dev@gmail.com",
  github: "https://github.com/dsk-dev-ai",
  githubHandle: "dsk-dev-ai",
} as const;

export function plural(count: number, word: string): string {
  return `${count} ${word}${count === 1 ? "" : "s"}`;
}

export function getProjects(): Project[] {
  return data.projects;
}

export function getFeatured(): Project[] {
  const bySlug = new Map(data.projects.map((p) => [p.slug, p]));
  return data.featured
    .map((slug) => bySlug.get(slug))
    .filter((p): p is Project => Boolean(p));
}

export function getProject(slug: string): Project | undefined {
  return data.projects.find((p) => p.slug === slug);
}

export function getReadme(slug: string): string {
  return data.readmes[slug] ?? "";
}

export function getUpstream(): PrEntry[] {
  return data.contributions.upstream;
}

export function getOrgRepos(): { repo: string; count: number }[] {
  return [...data.contributions.org_repos].sort((a, b) => b.count - a.count);
}

export function formatCount(value: number): string {
  if (value >= 1000) {
    return `${(value / 1000).toFixed(value >= 10000 ? 0 : 1).replace(/\.0$/, "")}k`;
  }
  return String(value);
}

export function timeAgo(iso: string, now: Date = new Date()): string {
  const then = new Date(iso).getTime();
  const seconds = Math.max(0, (now.getTime() - then) / 1000);
  const units: [number, string][] = [
    [31536000, "y"],
    [2592000, "mo"],
    [86400, "d"],
    [3600, "h"],
  ];
  for (const [size, label] of units) {
    if (seconds >= size) return `${Math.floor(seconds / size)}${label} ago`;
  }
  return "just now";
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

export const LANGUAGE_COLORS: Record<string, string> = {
  TypeScript: "#3178c6",
  JavaScript: "#f1e05a",
  Python: "#3572a5",
  Rust: "#dea584",
  Go: "#00add8",
  Java: "#b07219",
  "C++": "#f34b7d",
  C: "#555555",
  HTML: "#e34c26",
  CSS: "#563d7c",
  Shell: "#89e051",
  Svelte: "#ff3e00",
  "Jupyter Notebook": "#da5b0b",
  Dockerfile: "#384d54",
  Ruby: "#701516",
  PHP: "#4F5D95",
};

export function languageColor(name: string | null): string {
  return name ? (LANGUAGE_COLORS[name] ?? "#8ea0bf") : "#8ea0bf";
}
