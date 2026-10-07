import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { marked } from "marked";
import ProjectCard from "@/components/ProjectCard";
import { Badge, LanguageDot, Stars } from "@/components/ui";
import { SITE, data, formatDate, getProject, getProjects, getReadme, plural, timeAgo } from "@/lib/data";

marked.setOptions({ gfm: true, breaks: false });

export const dynamicParams = false;

export function generateStaticParams() {
  return getProjects().map((project) => ({ slug: project.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) return {};
  const description =
    project.description ??
    `${project.name} — a project by ${SITE.title} (${project.full_name}).`;

  return {
    title: project.name,
    description,
    openGraph: {
      title: `${project.name} · ${SITE.title}`,
      description,
      url: `${SITE.url}/projects/${project.slug}/`,
      type: "article",
    },
  };
}

function renderReadme(markdown: string): string {
  const html = marked.parse(markdown, { async: false });
  return html.replace(
    /<a href="(https?:\/\/[^"]+)"/g,
    '<a href="$1" target="_blank" rel="noopener noreferrer"',
  );
}

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) notFound();

  const readme = getReadme(slug);
  const html = readme ? renderReadme(readme) : "";

  const related = getProjects()
    .filter((candidate) => candidate.slug !== project.slug)
    .sort((a, b) => {
      const aMatch = a.language && a.language === project.language ? 1 : 0;
      const bMatch = b.language && b.language === project.language ? 1 : 0;
      return bMatch - aMatch || b.stars - a.stars;
    })
    .slice(0, 3);

  return (
    <div className="container-page py-16 sm:py-20">
      <Link
        href="/projects/"
        className="text-sm text-muted transition hover:text-ink"
      >
        ← All projects
      </Link>

      <div className="mt-6 flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-3xl">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              {project.name}
            </h1>
            {project.archived && <Badge tone="amber">archived</Badge>}
          </div>
          <p className="mt-3 text-lg leading-relaxed text-muted">
            {project.description ?? "No description provided."}
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
            <LanguageDot name={project.language} />
            <Stars value={project.stars} />
            <span className="text-xs text-faint">{project.forks} forks</span>
            <span className="text-xs text-faint">
              {plural(project.open_issues, "open issue")} &amp; PR
              {project.open_issues === 1 ? "" : "s"}
            </span>
            {project.license && <span className="text-xs text-faint">{project.license}</span>}
            <span className="text-xs text-faint">
              updated {timeAgo(project.pushed_at)}
            </span>
          </div>

          {project.topics.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {project.topics.map((topic) => (
                <Badge key={topic}>{topic}</Badge>
              ))}
            </div>
          )}

          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href={project.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-3 text-sm font-semibold text-[#08101f] transition hover:bg-[#8aa4ff]"
            >
              View on GitHub ↗
            </a>
            {project.homepage && (
              <a
                href={project.homepage}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl border border-line px-5 py-3 text-sm font-semibold transition hover:border-accent/60 hover:bg-accent-soft"
              >
                Live site ↗
              </a>
            )}
          </div>
        </div>

        <dl className="card grid w-full shrink-0 grid-cols-2 gap-px overflow-hidden bg-line lg:w-72">
          {[
            ["Stars", String(project.stars)],
            ["Forks", String(project.forks)],
            ["Created", formatDate(project.created_at)],
            ["Last push", formatDate(project.pushed_at)],
            project.last_commit?.date
              ? ["Last commit", formatDate(project.last_commit.date)]
              : ["Default branch", project.default_branch || "—"],
            project.latest_release?.tag
              ? ["Latest release", project.latest_release.tag]
              : ["Contributors", String(project.contributors_count || 0)],
          ].map(([label, value]) => (
            <div key={label as string} className="bg-surface p-4">
              <dt className="text-xs uppercase tracking-wider text-faint">{label}</dt>
              <dd className="mt-1 font-mono text-sm font-semibold text-ink">{value}</dd>
            </div>
          ))}
        </dl>
      </div>

      <section className="card mt-10 p-6 sm:p-8" aria-label="README">
        <div className="mb-5 flex items-center justify-between border-b border-line pb-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-faint">
            README
          </h2>
          <span className="font-mono text-xs text-faint">
            {project.full_name}
          </span>
        </div>
        {html ? (
          <div className="md-body" dangerouslySetInnerHTML={{ __html: html }} />
        ) : (
          <p className="text-sm text-muted">
            This repository has no README yet — see the description and topics above.
          </p>
        )}
      </section>

      <section className="mt-14" aria-label="Related projects">
        <h2 className="mb-6 text-xl font-bold tracking-tight">Related projects</h2>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {related.map((candidate) => (
            <ProjectCard key={candidate.slug} project={candidate} />
          ))}
        </div>
      </section>

      <p className="mt-12 text-xs text-faint">
        {data.stats.merged_prs_total} merged pull requests across{" "}
        {data.stats.merged_repos_total} repositories · data generated{" "}
        {formatDate(data.generated_at)}
      </p>
    </div>
  );
}
