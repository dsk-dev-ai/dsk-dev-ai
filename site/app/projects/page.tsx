import type { Metadata } from "next";
import ProjectExplorer from "@/components/ProjectExplorer";
import { data, getProjects } from "@/lib/data";

export const metadata: Metadata = {
  title: "Projects",
  description:
    "Open-source and product projects by Darshan Kachare — AI infrastructure, developer tools, and systems work.",
};

export default function ProjectsPage() {
  const projects = getProjects();

  return (
    <div className="container-page py-16 sm:py-20">
      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-accent">
        Portfolio
      </p>
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
        {projects.length} public projects
      </h1>
      <p className="mt-4 max-w-2xl leading-relaxed text-muted">
        Everything published under <span className="font-mono text-ink">github.com/dsk-dev-ai</span> —
        filtered to exclude forks. {data.stats.merged_prs_total} merged pull requests
        across {data.stats.merged_repos_total} repositories back this work.
      </p>

      <div className="mt-10">
        <ProjectExplorer projects={projects} />
      </div>
    </div>
  );
}
