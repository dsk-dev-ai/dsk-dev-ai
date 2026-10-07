import Link from "next/link";
import ProjectCard from "@/components/ProjectCard";
import { Badge, ButtonLink, SectionHeading, Stat } from "@/components/ui";
import {
  SITE,
  data,
  formatDate,
  getFeatured,
  getOrgRepos,
  getUpstream,
  plural,
  timeAgo,
} from "@/lib/data";

export default function HomePage() {
  const featured = getFeatured();
  const upstream = getUpstream();
  const orgRepos = getOrgRepos();
  const orgTop = orgRepos[0];
  const maxLanguage = Math.max(...data.languages.map((l) => l.share), 0.01);
  const recentUpstream = upstream.slice(0, 4);

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-line">
        <div className="grid-bg pointer-events-none absolute inset-0 opacity-40" aria-hidden />
        <div
          className="pointer-events-none absolute -top-40 left-1/2 h-80 w-[36rem] -translate-x-1/2 rounded-full bg-accent/15 blur-3xl"
          aria-hidden
        />
        <div className="container-page relative py-20 sm:py-28">
          <div className="fade-up max-w-3xl">
            <Badge tone="emerald">
              <span className="pulse-dot size-2 rounded-full bg-emerald" aria-hidden />
              Live GitHub data · refreshed {formatDate(data.generated_at)}
            </Badge>

            <h1 className="mt-6 text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl">
              Darshan Kachare
              <span className="mt-2 block text-gradient text-3xl sm:text-5xl">
                builds AI infrastructure &amp; systems.
              </span>
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted">
              {SITE.bio}
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink href="/projects/">View projects →</ButtonLink>
              <ButtonLink href="/contact/" variant="ghost">
                Get in touch
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
          </div>

          <div className="mt-14 grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Stat value={data.profile.public_repos} label="public repos" />
            <Stat value={data.profile.stars} label="stars earned" />
            <Stat value={data.stats.merged_prs_total} label="merged PRs" />
            <Stat value={data.profile.followers} label="followers" />
          </div>
        </div>
      </section>

      {/* Featured projects */}
      <section className="container-page py-20">
        <SectionHeading
          eyebrow="Selected work"
          title="Featured projects"
          action={{ href: "/projects/", label: `All ${data.projects.length} projects` }}
        />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((project) => (
            <ProjectCard key={project.slug} project={project} featured />
          ))}
        </div>
      </section>

      {/* Open source proof */}
      <section className="border-y border-line bg-surface/50">
        <div className="container-page py-20">
          <SectionHeading
            eyebrow="Open source"
            title="Merged upstream contributions"
            action={{ href: "/open-source/", label: "Contribution history" }}
          />

          <div className="grid gap-6 lg:grid-cols-3">
            <ul className="space-y-3 lg:col-span-2">
              {recentUpstream.map((pr) => (
                <li key={`${pr.repo}#${pr.number}`}>
                  <a
                    href={pr.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="card flex flex-wrap items-center gap-x-4 gap-y-2 p-4 transition hover:border-accent/50"
                  >
                    <span className="font-mono text-xs text-faint">{pr.repo}</span>
                    <span className="text-sm font-medium text-ink">
                      #{pr.number} · {pr.title}
                    </span>
                    <span className="ml-auto flex items-center gap-3">
                      {pr.via === "commits" && <Badge tone="accent">commits preserved</Badge>}
                      <span className="text-xs text-faint">{formatDate(pr.merged_at)}</span>
                    </span>
                  </a>
                </li>
              ))}
            </ul>

            <div className="card p-6">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-faint">
                By the numbers
              </h3>
              <dl className="mt-4 space-y-4 text-sm">
                <div className="flex items-baseline justify-between gap-4">
                  <dt className="text-muted">Microsoft AgentRC</dt>
                  <dd className="font-mono font-semibold text-ink">2 PRs merged</dd>
                </div>
                <div className="flex items-baseline justify-between gap-4">
                  <dt className="text-muted">MDN Web Docs</dt>
                  <dd className="font-mono font-semibold text-ink">6 PRs merged</dd>
                </div>
                <div className="flex items-baseline justify-between gap-4">
                  <dt className="text-muted">first-contributions</dt>
                  <dd className="font-mono font-semibold text-ink">1 PR merged</dd>
                </div>
                <div className="border-t border-line pt-4">
                  <div className="flex items-baseline justify-between gap-4">
                    <dt className="text-muted">NextGenAI Labs</dt>
                    <dd className="font-mono font-semibold text-emerald">
                      {orgTop ? `${orgTop.count} PRs` : "—"}
                    </dd>
                  </div>
                  <p className="mt-1 text-xs text-faint">
                    {orgTop ? orgTop.repo : ""}
                    {orgRepos.length > 1
                      ? ` · +${orgRepos.length - 1} more repos`
                      : ""}
                  </p>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </section>

      {/* Languages + activity */}
      <section className="container-page grid gap-12 py-20 lg:grid-cols-2">
        <div>
          <SectionHeading eyebrow="Stack" title="Language mix" />
          <ul className="space-y-4">
            {data.languages.map((language) => (
              <li key={language.name}>
                <div className="mb-1.5 flex items-center justify-between text-sm">
                  <span className="font-medium">{language.name}</span>
                  <span className="font-mono text-xs text-faint">
                    {Math.round(language.share * 100)}% ·{" "}
                    {plural(language.count, "repo")}
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
                    {event.repo} · {timeAgo(event.created_at)}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* CTA */}
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
            Open to interesting problems in AI infrastructure, developer tools, and
            systems work.
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
