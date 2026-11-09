import type { Metadata } from "next";
import ProjectExplorer from "@/components/ProjectExplorer";
import { Stat } from "@/components/ui";
import { data, getFeatured, getProjects } from "@/lib/data";

export const metadata: Metadata = {
  title: "Projects",
  description:
    "Open-source and product projects by Darshan Kachare - AI infrastructure, developer tools, and systems work.",
  alternates: { canonical: "/projects/" },
};

export default function ProjectsPage() {
  const projects = getProjects();
  const featuredSlugs = getFeatured().map((project) => project.slug);
  const languages = new Set(projects.map((project) => project.language).filter(Boolean)).size;

  return (
    <div className="container-page py-16 sm:py-20">
      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-accent">
        Portfolio
      </p>
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
        {projects.length} public projects
      </h1>
      <p className="mt-4 max-w-2xl leading-relaxed text-muted">
        Everything published under{" "}
        <span className="font-mono text-ink">github.com/dsk-dev-ai</span> - filtered to exclude
        forks. {data.stats.merged_prs_total} merged pull requests across{" "}
        {data.stats.merged_repos_total} repositories back this work.
      </p>

      <div className="mt-10 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat value={projects.length} label="public repos" />
        <Stat value={data.profile.stars} label="stars earned" />
        <Stat value={languages} label="languages" />
        <Stat value={data.stats.public_prs} label="public PRs" />
      </div>

      <div className="mt-12">
        <ProjectExplorer projects={projects} featuredSlugs={featuredSlugs} />
      </div>
    </div>
  );
}
