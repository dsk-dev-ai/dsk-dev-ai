import Link from "next/link";
import ProjectCard from "@/components/ProjectCard";
import ShippingChart from "@/components/ShippingChart";
import TimeAgo from "@/components/TimeAgo";
import { Badge, ButtonLink, SectionHeading, Stat } from "@/components/ui";
import {
  LIVE_DEMOS,
  SITE,
  data,
  formatCount,
  getFeatured,
  getOrgRepos,
  getProjects,
  getRecentContributions,
  getShippingMonths,
  plural,
} from "@/lib/data";

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="text-muted">{label}</dt>
      <dd className="font-mono font-semibold text-ink">{formatCount(value)}</dd>
    </div>
  );
}

export default function HomePage() {
  const projects = getProjects();
  const featured = getFeatured();
  const recent = getRecentContributions(5);
  const orgRepos = getOrgRepos();
  const topOrg = orgRepos[0];
  const months = getShippingMonths();
  const maxLanguage = Math.max(...data.languages.map((entry) => entry.share), 0.01);
  const recentProject = [...projects].sort((a, b) => b.pushed_at.localeCompare(a.pushed_at))[0];
  const recentPr = recent[0];

  const upstreamCounts = new Map<string, number>();
  for (const pr of data.contributions.upstream) {
    upstreamCounts.set(pr.repo, (upstreamCounts.get(pr.repo) ?? 0) + 1);
  }
  const upstreamRows = [...upstreamCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3);

  return (
    <>
      <section className="relative overflow-hidden border-b border-line">
        <div className="aurora pointer-events-none absolute inset-0" aria-hidden />
        <div className="grid-bg pointer-events-none absolute inset-0 opacity-50" aria-hidden />
        <div className="container-page relative grid gap-12 py-20 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:py-28">
          <div className="fade-up">
            <Badge tone="emerald">
              <span className="pulse-dot size-2 rounded-full bg-emerald" aria-hidden />
              {SITE.availability}
            </Badge>

            <h1 className="mt-6 text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl">
              Darshan Kachare
              <span className="mt-2 block text-gradient text-3xl sm:text-5xl">
                builds AI infrastructure &amp; systems.
              </span>
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted">{SITE.bio}</p>

            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink href="/projects/">View projects →</ButtonLink>
              <ButtonLink href="/open-source/" variant="ghost">
                Open-source work
              </ButtonLink>
              <a
                href={SITE.github}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-muted transition hover:text-ink"
              >
                @{SITE.githubHandle} ↗
              </a>
            </div>

            <p className="mt-8 flex flex-wrap items-center gap-2 text-xs text-faint">
              <span className="inline-flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-emerald" aria-hidden />
                Live GitHub data
              </span>
              <span aria-hidden>·</span>
              <span>
                updated <TimeAgo iso={data.generated_at} />
              </span>
              <span aria-hidden>·</span>
              <span>{data.stats.merged_prs_total} merged PRs</span>
            </p>
          </div>

          <aside className="card card-spotlight relative p-6 sm:p-7">
            <div className="relative z-10 flex items-center gap-4">
              <span className="grid size-20 place-items-center rounded-2xl border border-line bg-surface-2 font-mono text-2xl font-bold text-accent">
                dk
              </span>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-faint">
                  Currently
                </p>
                <h2 className="mt-1 text-xl font-bold tracking-tight">{SITE.role}</h2>
                <p className="text-sm text-muted">{SITE.location}</p>
              </div>
            </div>

            <p className="relative z-10 mt-5 text-sm leading-relaxed text-muted">
              Building LLM applications, agent infrastructure, and developer platforms - with a
              Python-first stack and a bias for shipping.
            </p>

            <dl className="relative z-10 mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-line bg-surface/60 p-3">
                <dt className="text-[10px] uppercase tracking-wider text-faint">Public PRs</dt>
                <dd className="mt-1 font-mono text-xl font-bold text-ink">{data.stats.public_prs}</dd>
              </div>
              <div className="rounded-xl border border-line bg-surface/60 p-3">
                <dt className="text-[10px] uppercase tracking-wider text-faint">Stars</dt>
                <dd className="mt-1 font-mono text-xl font-bold text-ink">{data.profile.stars}</dd>
              </div>
            </dl>

            <div className="relative z-10 mt-5 flex flex-wrap gap-2 text-xs">
              {[
                { href: SITE.github, label: "GitHub", external: true },
                { href: SITE.linkedin, label: "LinkedIn", external: true },
                { href: `mailto:${SITE.email}`, label: "Email", external: false },
              ].map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  {...(link.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                  className="rounded-lg border border-line px-3 py-1.5 text-muted transition hover:border-accent/60 hover:text-ink"
                >
                  {link.label}
                  {link.external ? " ↗" : ""}
                </a>
              ))}
              <Link
                href="/contact/"
                className="rounded-lg border border-line px-3 py-1.5 text-muted transition hover:border-accent/60 hover:text-ink"
              >
                Contact page
              </Link>
            </div>
          </aside>
        </div>

        <div className="container-page relative grid grid-cols-2 gap-4 pb-12 lg:grid-cols-4">
          <Stat value={data.stats.merged_prs_total} label="merged PRs" />
          <Stat value={data.profile.public_repos} label="public repos" />
          <Stat value={data.profile.stars} label="stars earned" />
          <Stat value={data.stats.org_prs} label="org PRs" />
        </div>
      </section>

      <section className="container-page py-14">
        <div className="grid gap-4 md:grid-cols-3">
          {recentProject && (
            <Link
              href={`/projects/${recentProject.slug}/`}
              className="card card-spotlight group p-5 transition hover:border-accent/50"
            >
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-accent">
                Building
              </p>
              <h2 className="mt-2 text-lg font-semibold tracking-tight">{recentProject.name}</h2>
              <p className="mt-1 line-clamp-2 text-sm text-muted">
                {recentProject.description ?? "A recently updated project."}
              </p>
              <p className="mt-3 text-xs text-faint">
                updated <TimeAgo iso={recentProject.pushed_at} />
              </p>
            </Link>
          )}

          {recentPr && (
            <a
              href={recentPr.url}
              target="_blank"
              rel="noopener noreferrer"
              className="card card-spotlight group p-5 transition hover:border-accent/50"
            >
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald">
                Shipping
              </p>
              <h2 className="mt-2 line-clamp-1 text-lg font-semibold tracking-tight">
                #{recentPr.number} · {recentPr.title}
              </h2>
              <p className="mt-1 text-sm text-muted">{recentPr.repo}</p>
              <p className="mt-3 text-xs text-faint">
                merged <TimeAgo iso={recentPr.merged_at} />
              </p>
            </a>
          )}

          <Link
            href="/contact/"
            className="card card-spotlight group p-5 transition hover:border-accent/50"
          >
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-amber">
              Open to
            </p>
            <h2 className="mt-2 text-lg font-semibold tracking-tight">
              AI engineering &amp; consulting
            </h2>
            <p className="mt-1 text-sm text-muted">{SITE.availability}.</p>
            <p className="mt-3 text-xs text-faint">Usually replies within 48 hours</p>
          </Link>
        </div>
      </section>

      <section className="container-page py-20">
        <SectionHeading
          eyebrow="Selected work"
          title="Featured projects"
          action={{ href: "/projects/", label: `All ${projects.length} projects` }}
        />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((project) => (
            <ProjectCard key={project.slug} project={project} featured />
          ))}
        </div>
      </section>

      <section className="border-y border-line bg-surface/50">
        <div className="container-page grid gap-6 py-20 lg:grid-cols-[1.1fr_0.9fr]">
          <ShippingChart months={months} />

          <div className="card flex flex-col p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">Delivery</p>
            <h2 className="mt-2 text-xl font-bold tracking-tight">By the numbers</h2>
            <dl className="mt-5 space-y-3 text-sm">
              <Metric label="Public PRs" value={data.stats.public_prs} />
              <Metric label="Upstream PRs" value={data.stats.upstream_prs} />
              <Metric label="Org PRs" value={data.stats.org_prs} />
              <Metric label="Own PRs" value={data.stats.own_prs} />
              <Metric label="Repositories" value={data.stats.merged_repos_total} />
            </dl>

            <div className="mt-5 border-t border-line pt-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-faint">
                Top org repos
              </p>
              <div className="mt-3 space-y-2">
                {orgRepos.slice(0, 3).map((entry) => (
                  <div key={entry.repo} className="flex items-center justify-between gap-3 text-sm">
                    <span className="truncate font-mono text-xs text-muted">{entry.repo}</span>
                    <span className="flex shrink-0 items-center gap-2">
                      <span className="font-mono text-ink">{entry.count}</span>
                      {entry.private && <Badge tone="amber">private</Badge>}
                    </span>
                  </div>
                ))}
              </div>
              {topOrg && (
                <p className="mt-3 text-xs text-faint">
                  {topOrg.repo} is the largest single contributor to the org total.
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="container-page py-20">
        <SectionHeading
          eyebrow="Open source"
          title="Recent merged work"
          action={{ href: "/open-source/", label: "Contribution history" }}
        />

        <div className="grid gap-6 lg:grid-cols-3">
          <ul className="space-y-3 lg:col-span-2">
            {recent.map((pr) => (
              <li key={`${pr.repo}#${pr.number}`}>
                <a
                  href={pr.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="card card-spotlight flex flex-wrap items-center gap-x-4 gap-y-2 p-4 transition hover:border-accent/50"
                >
                  <span className="font-mono text-xs text-faint">{pr.repo}</span>
                  <span className="text-sm font-medium text-ink">
                    #{pr.number} · {pr.title}
                  </span>
                  <span className="ml-auto flex items-center gap-3">
                    <Badge tone={pr.via === "commits" ? "accent" : "default"}>
                      {pr.via === "commits"
                        ? "commits preserved"
                        : pr.repo.startsWith("nextgenai-labs/")
                          ? "org"
                          : pr.repo.startsWith("dsk-dev-ai/")
                            ? "own"
                            : "upstream"}
                    </Badge>
                    <TimeAgo iso={pr.merged_at} className="text-xs text-faint" />
                  </span>
                </a>
              </li>
            ))}
          </ul>

          <div className="card p-6">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-faint">
              Upstream
            </h3>
            <div className="mt-4 space-y-4 text-sm">
              {upstreamRows.map(([repo, count]) => (
                <div key={repo} className="flex items-baseline justify-between gap-4">
                  <span className="truncate text-muted">{repo}</span>
                  <span className="font-mono font-semibold text-ink">{count}</span>
                </div>
              ))}
              <div className="flex items-baseline justify-between gap-4 border-t border-line pt-4">
                <span className="text-muted">NextGenAI Labs</span>
                <span className="font-mono font-semibold text-emerald">{data.stats.org_prs}</span>
              </div>
              {topOrg && (
                <p className="text-xs text-faint">
                  {topOrg.repo} · {topOrg.count} merged PRs
                  {orgRepos.length > 1 ? ` · +${orgRepos.length - 1} more repos` : ""}
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="container-page pb-8">
        <div className="card flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-accent">
              Also live
            </p>
            <h2 className="mt-1 text-lg font-semibold tracking-tight">Products you can try</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {LIVE_DEMOS.map((demo) => (
              <a
                key={demo.name}
                href={demo.href}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg border border-line px-3 py-2 text-xs text-muted transition hover:border-accent/60 hover:text-ink"
              >
                <span className="font-medium text-ink">{demo.name}</span>{" "}
                <span className="text-faint">{demo.note}</span> ↗
              </a>
            ))}
          </div>
        </div>
      </section>

      <section className="container-page grid gap-12 py-20 lg:grid-cols-2">
        <div>
          <SectionHeading eyebrow="Stack" title="Language mix" />
          <ul className="space-y-4">
            {data.languages.map((language) => (
              <li key={language.name}>
                <div className="mb-1.5 flex items-center justify-between text-sm">
                  <span className="font-medium">{language.name}</span>
                  <span className="font-mono text-xs text-faint">
                    {Math.round(language.share * 100)}% · {plural(language.count, "repo")}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-surface-2">
                  <div
                    className="h-full rounded-full bg-accent transition-all duration-700"
                    style={{ width: `${(language.share / maxLanguage) * 100}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <SectionHeading eyebrow="Now" title="Recent activity" />
          <ul className="space-y-3">
            {data.activity.slice(0, 6).map((event, index) => (
              <li
                key={`${event.repo}-${event.action}-${index}`}
                className="flex items-start gap-3 text-sm"
              >
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-accent" aria-hidden />
                <div className="min-w-0">
                  <span className="font-medium text-ink">{event.action}</span>{" "}
                  <span className="text-muted">{event.detail}</span>
                  <div className="mt-0.5 font-mono text-xs text-faint">
                    {event.repo} · <TimeAgo iso={event.created_at} />
                  </div>
                </div>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-faint">Public activity only · private repository names are filtered.</p>
        </div>
      </section>

      <section className="container-page pb-4">
        <div className="card relative overflow-hidden p-10 text-center sm:p-14">
          <div
            className="pointer-events-none absolute -top-24 left-1/2 h-56 w-96 -translate-x-1/2 rounded-full bg-accent/20 blur-3xl"
            aria-hidden
          />
          <h2 className="relative text-2xl font-bold tracking-tight sm:text-3xl">
            Want to build something together?
          </h2>
          <p className="relative mx-auto mt-3 max-w-xl text-muted">
            Open to interesting problems in AI infrastructure, developer tools, and systems work.
          </p>
          <div className="relative mt-7 flex flex-wrap justify-center gap-3">
            <ButtonLink href="/contact/">Contact me</ButtonLink>
            <ButtonLink href="/open-source/" variant="ghost">
              See contributions
            </ButtonLink>
          </div>
        </div>
      </section>
    </>
  );
}
