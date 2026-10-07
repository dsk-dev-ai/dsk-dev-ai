import type { Metadata } from "next";
import { Badge, SectionHeading, Stat } from "@/components/ui";
import { SITE, data, formatDate, getOrgRepos, getUpstream } from "@/lib/data";

export const metadata: Metadata = {
  title: "Open Source",
  description:
    "Merged upstream contributions by Darshan Kachare — Microsoft AgentRC, MDN Web Docs, first-contributions — plus 140+ merged PRs across NextGenAI Labs.",
};

export default function OpenSourcePage() {
  const upstream = getUpstream();
  const orgRepos = getOrgRepos();

  const byRepo = new Map<string, typeof upstream>();
  for (const pr of upstream) {
    byRepo.set(pr.repo, [...(byRepo.get(pr.repo) ?? []), pr]);
  }
  const groups = [...byRepo.entries()].sort(
    (a, b) => (b[1][0]?.merged_at ?? "").localeCompare(a[1][0]?.merged_at ?? ""),
  );

  return (
    <div className="container-page py-16 sm:py-20">
      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-accent">
        Contribution history
      </p>
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
        Merged upstream contributions
      </h1>
      <p className="mt-4 max-w-2xl leading-relaxed text-muted">
        Pull requests merged into repositories I don&apos;t own, plus sustained
        delivery inside NextGenAI Labs. Every figure below comes from the GitHub
        API at build time.
      </p>

      <div className="mt-10 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat value={data.stats.merged_prs_total} label="total merged PRs" />
        <Stat value={data.stats.merged_repos_total} label="repositories" />
        <Stat value={data.stats.upstream_prs} label="upstream PRs" />
        <Stat value={data.stats.org_prs} label="org PRs" />
      </div>

      {/* Third-party repositories */}
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
                      className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-4 transition hover:bg-white/[0.03]"
                    >
                      <span className="font-mono text-xs text-accent">#{pr.number}</span>
                      <span className="min-w-0 flex-1 truncate text-sm text-ink">
                        {pr.title}
                      </span>
                      <span className="flex items-center gap-3">
                        {pr.via === "commits" && (
                          <Badge tone="accent">commits preserved</Badge>
                        )}
                        <span className="text-xs text-faint">
                          merged {formatDate(pr.merged_at)}
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

      {/* Org work */}
      <section className="mt-16" aria-label="Organization work">
        <SectionHeading
          eyebrow="NextGenAI Labs"
          title="Merged PRs inside the org"
        />

        <div className="card overflow-x-auto">
          <table className="w-full min-w-[32rem] text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs uppercase tracking-wider text-faint">
                <th className="px-5 py-3 font-medium">Repository</th>
                <th className="px-5 py-3 text-right font-medium">Merged PRs</th>
                <th className="px-5 py-3 text-right font-medium">Share</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {orgRepos.map((entry) => (
                <tr key={entry.repo} className="transition hover:bg-white/[0.03]">
                  <td className="px-5 py-3">
                    <a
                      href={`https://github.com/${entry.repo}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-ink transition hover:text-accent"
                    >
                      {entry.repo}
                    </a>
                  </td>
                  <td className="px-5 py-3 text-right font-mono text-ink">
                    {entry.count}
                  </td>
                  <td className="px-5 py-3 text-right font-mono text-faint">
                    {((entry.count / Math.max(data.stats.org_prs, 1)) * 100).toFixed(1)}
                    %
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

      <p className="mt-12 text-xs text-faint">
        Generated {formatDate(data.generated_at)} from the GitHub API ·{" "}
        {data.stats.own_prs} PRs also merged across my own repositories ·{" "}
        <a
          href={SITE.github}
          target="_blank"
          rel="noopener noreferrer"
          className="text-accent transition hover:text-ink"
        >
          github.com/{SITE.githubHandle}
        </a>
      </p>
    </div>
  );
}
