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

export interface MonthCount {
  month: string;
  count: number;
}

export interface OrgRepo {
  repo: string;
  count: number;
  private?: boolean;
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
    public_prs: number;
    org_public_prs: number;
    upstream_prs: number;
    org_prs: number;
    own_prs: number;
    merged_by_month: MonthCount[];
  };
  languages: { name: string; count: number; share: number }[];
  featured: string[];
  projects: Project[];
  readmes: Record<string, string>;
  activity: ActivityEvent[];
  contributions: {
    upstream: PrEntry[];
    org: PrEntry[];
    recent: PrEntry[];
    org_repos: OrgRepo[];
  };
}

export const data = raw as unknown as ProfileData;

export const SITE = {
  domain: "darshankachare.com",
  url: "https://darshankachare-com.onrender.com",
  liveUrl: "https://darshankachare-com.onrender.com",
  title: "Darshan Kachare",
  role: "AI Engineer",
  tagline: "AI infrastructure, agent systems, and products that ship.",
  bio: "I design and ship AI infrastructure, developer platforms, and production-grade systems - mostly in Python, TypeScript, and Rust.",
  location: "India · remote",
  availability: "Open to AI engineering roles and selected consulting",
  emails: ["darshan.kachare.dev@gmail.com", "dsk-dev-ai@outlook.com"],
  email: "darshan.kachare.dev@gmail.com",
  github: "https://github.com/dsk-dev-ai",
  githubHandle: "dsk-dev-ai",
  linkedin: "https://www.linkedin.com/in/darshan-kachare-0b173a432",
  devto: "https://dev.to/dskdevai",
  medium: "https://medium.com/@darshankacharedev",
} as const;

export const LIVE_DEMOS = [
  {
    name: "API Monitor SaaS",
    href: "https://api-monitor-saas-frontend.vercel.app/",
    note: "uptime + status pages",
  },
  {
    name: "DistrLab",
    href: "https://distrlab.onrender.com",
    note: "distributed systems lab",
  },
  {
    name: "Textrieve",
    href: "https://textrieve.onrender.com",
    note: "private OCR",
  },
  {
    name: "GenomeAI",
    href: "https://genomeai.vercel.app",
    note: "genomics workbench",
  },
] as const;

export function plural(count: number, word: string): string {
  return `${count} ${word}${count === 1 ? "" : "s"}`;
}

export function getProjects(): Project[] {
  return data.projects;
}

export function getFeatured(): Project[] {
  const bySlug = new Map(data.projects.map((project) => [project.slug, project]));
  return data.featured
    .map((slug) => bySlug.get(slug))
    .filter((project): project is Project => Boolean(project));
}

export function getProject(slug: string): Project | undefined {
  return data.projects.find((project) => project.slug === slug);
}

export function getReadme(slug: string): string {
  return data.readmes[slug] ?? "";
}

export function getUpstream(): PrEntry[] {
  return data.contributions.upstream;
}

export function getRecentContributions(limit = 12): PrEntry[] {
  const recent = data.contributions.recent ?? [];
  if (recent.length > 0) return recent.slice(0, limit);
  return [...getUpstream()].slice(0, limit);
}

export function getOrgPublicPrs(): PrEntry[] {
  return data.contributions.org ?? [];
}

export function getOrgRepos(): OrgRepo[] {
  return [...data.contributions.org_repos].sort((a, b) => b.count - a.count);
}

export function getShippingMonths(): MonthCount[] {
  return data.stats.merged_by_month ?? [];
}

export function formatCount(value: number): string {
  if (value >= 1000) {
    return `${(value / 1000).toFixed(value >= 10000 ? 0 : 1).replace(/\.0$/, "")}k`;
  }
  return String(value);
}

export function formatMonth(key: string): string {
  const [year, month] = key.split("-").map(Number);
  if (!year || !month) return key;
  return new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function shortMonth(key: string): string {
  const [, month] = key.split("-").map(Number);
  if (!month) return key;
  return new Date(Date.UTC(2000, month - 1, 1)).toLocaleDateString("en-US", {
    month: "short",
    timeZone: "UTC",
  });
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

export function absoluteUrl(path: string): string {
  return new URL(path, SITE.url).toString();
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
  "C#": "#178600",
  HTML: "#e34c26",
  CSS: "#563d7c",
  SCSS: "#c6538c",
  Shell: "#89e051",
  Svelte: "#ff3e00",
  "Jupyter Notebook": "#da5b0b",
  Dockerfile: "#384d54",
  Ruby: "#701516",
  PHP: "#4F5D95",
  Dart: "#00b4ab",
  Kotlin: "#A97BFF",
  Swift: "#F05138",
  Vue: "#41b883",
  Astro: "#ff5a03",
  MDX: "#fcb32c",
  Solidity: "#363636",
  Zig: "#ec915c",
  Lua: "#000080",
  Elixir: "#6e4a7e",
  Haskell: "#5e5086",
  Scala: "#c22d40",
  R: "#198ce7",
  MATLAB: "#e16737",
  Nix: "#7e7eff",
  HCL: "#844fba",
  Makefile: "#427819",
  CMake: "#da3434",
  PowerShell: "#012456",
  TeX: "#3D6117",
};

export function languageColor(name: string | null): string {
  return name ? (LANGUAGE_COLORS[name] ?? "#8ea0bf") : "#8ea0bf";
}
