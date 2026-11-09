import type { Metadata } from "next";
import Link from "next/link";
import ShippingChart from "@/components/ShippingChart";
import TimeAgo from "@/components/TimeAgo";
import { Badge, SectionHeading, Stat } from "@/components/ui";
import {
  SITE,
  data,
  formatDate,
  getOrgRepos,
  getShippingMonths,
  getUpstream,
} from "@/lib/data";

export const metadata: Metadata = {
  title: "Open Source",
  description:
    "Merged upstream contributions by Darshan Kachare across Microsoft AgentRC, MDN Web Docs, and first-contributions, plus sustained delivery inside NextGenAI Labs.",
  alternates: { canonical: "/open-source/" },
};

export default function OpenSourcePage() {
  const upstream = getUpstream();
  const orgRepos = getOrgRepos();
  const months = getShippingMonths();
  const maxOrg = Math.max(...orgRepos.map((entry) => entry.count), 1);

  const byRepo = new Map<string, typeof upstream>();
  for (const pr of upstream) {
    byRepo.set(pr.repo, [...(byRepo.get(pr.repo) ?? []), pr]);
  }
  const groups = [...byRepo.entries()].sort(
    (a, b) => (b[1][0]?.merged_at ?? "").localeCompare(a[1][0]?.merged_at ?? ""),
  );

  const breakdown = [
    { label: "Public", value: data.stats.public_prs, tone: "bg-accent" },
    { label: "Org", value: data.stats.org_prs, tone: "bg-emerald" },
    { label: "Upstream", value: data.stats.upstream_prs, tone: "bg-amber" },
    { label: "Own", value: data.stats.own_prs, tone: "bg-faint" },
  ];
  const maxBreakdown = Math.max(...breakdown.map((entry) => entry.value), 1);

  return (
    <div className="container-page py-16 sm:py-20">
      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-accent">
        Contribution history
      </p>
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
        Open-source &amp; org shipping
      </h1>
      <p className="mt-4 max-w-2xl leading-relaxed text-muted">
        Pull requests merged into repositories I don&apos;t own, plus sustained delivery inside
        NextGenAI Labs. Every figure comes from the GitHub API at build time - private repository
        activity is aggregated only, never titled.
      </p>

      <div className="mt-10 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat value={data.stats.merged_prs_total} label="total merged PRs" />
        <Stat value={data.stats.public_prs} label="public PRs" />
        <Stat value={data.stats.upstream_prs} label="upstream PRs" />
        <Stat value={data.stats.org_prs} label="org PRs" />
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <ShippingChart months={months} />

        <div className="card flex flex-col p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-faint">
            Where the merges land
          </h2>
          <div className="mt-5 space-y-4">
            {breakdown.map((entry) => (
              <div key={entry.label}>
                <div className="mb-1.5 flex items-center justify-between text-sm">
                  <span className="text-muted">{entry.label}</span>
                  <span className="font-mono text-ink">{entry.value}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-surface-2">
                  <div
                    className={`h-full rounded-full ${entry.tone}`}
                    style={{ width: `${(entry.value / maxBreakdown) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          <p className="mt-5 border-t border-line pt-4 text-xs text-faint">
            {data.stats.merged_repos_total} repositories touched. Public and upstream figures are
            recomputed hourly; org counts include private repositories.
          </p>
        </div>
      </div>

      <section className="mt-16" aria-label="Third-party repositories">
        <SectionHeading eyebrow="Third-party" title="Upstream repositories" />

        <div className="space-y-6">
          {groups.map(([repo, prs]) => (
            <div key={repo} className="card overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-surface px-5 py-4">
                <div className="flex items-center gap-3">
                  <h3 className="font-mono text-sm font-semibold text-ink">{repo}</h3>
                  <Badge tone="emerald">{prs.length} merged</Badge>
                </div>
                <a
                  href={`https://github.com/${repo}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-accent transition hover:text-ink"
                >
                  repository ↗
                </a>
              </div>

              <ul className="divide-y divide-line">
                {prs.map((pr) => (
                  <li key={`${repo}#${pr.number}`}>
                    <a
                      href={pr.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-4 transition hover:bg-surface-2/60"
                    >
                      <span className="font-mono text-xs text-accent">#{pr.number}</span>
                      <span className="min-w-0 flex-1 truncate text-sm text-ink">{pr.title}</span>
                      <span className="flex items-center gap-3">
                        {pr.via === "commits" && <Badge tone="accent">commits preserved</Badge>}
                        <span className="text-xs text-faint">
                          merged <TimeAgo iso={pr.merged_at} />
                        </span>
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-16" aria-label="Organization work">
        <SectionHeading eyebrow="NextGenAI Labs" title="Merged PRs inside the org" />

        <div className="card overflow-x-auto">
          <table className="w-full min-w-[32rem] text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs uppercase tracking-wider text-faint">
                <th className="px-5 py-3 font-medium">Repository</th>
                <th className="px-5 py-3 text-right font-medium">Merged PRs</th>
                <th className="w-40 px-5 py-3 font-medium">Share</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {orgRepos.map((entry) => (
                <tr key={entry.repo} className="transition hover:bg-surface-2/60">
                  <td className="px-5 py-3">
                    <span className="flex flex-wrap items-center gap-2">
                      {entry.private ? (
                        <span className="font-mono text-ink">{entry.repo}</span>
                      ) : (
                        <a
                          href={`https://github.com/${entry.repo}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-mono text-ink transition hover:text-accent"
                        >
                          {entry.repo}
                        </a>
                      )}
                      {entry.private && <Badge tone="amber">private</Badge>}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right font-mono text-ink">{entry.count}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-3">
                      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-surface-2">
                        <div
                          className="h-full rounded-full bg-emerald"
                          style={{ width: `${(entry.count / maxOrg) * 100}%` }}
                        />
                      </div>
                      <span className="w-12 text-right font-mono text-xs text-faint">
                        {((entry.count / Math.max(data.stats.org_prs, 1)) * 100).toFixed(1)}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
              <tr className="bg-surface">
                <td className="px-5 py-3 font-semibold text-ink">Total</td>
                <td className="px-5 py-3 text-right font-mono font-semibold text-emerald">
                  {data.stats.org_prs}
                </td>
                <td className="px-5 py-3 text-right font-mono text-faint">100%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <div className="mt-12 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-faint">
        <span>
          Generated {formatDate(data.generated_at)} from the GitHub API - {data.stats.own_prs} PRs
          also merged across my own repositories.
        </span>
        <a
          href={SITE.github}
          target="_blank"
          rel="noopener noreferrer"
          className="text-accent transition hover:text-ink"
        >
          github.com/{SITE.githubHandle} ↗
        </a>
        <Link href="/projects/" className="text-accent transition hover:text-ink">
          Browse projects →
        </Link>
      </div>
    </div>
  );
}
