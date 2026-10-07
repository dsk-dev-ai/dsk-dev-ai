"use client";

import { useMemo, useState } from "react";
import ProjectCard from "@/components/ProjectCard";
import type { Project } from "@/lib/data";

type SortKey = "stars" | "recent";

export default function ProjectExplorer({ projects }: { projects: Project[] }) {
  const [query, setQuery] = useState("");
  const [language, setLanguage] = useState<string | null>(null);
  const [sort, setSort] = useState<SortKey>("stars");

  const languages = useMemo(() => {
    const counts = new Map<string, number>();
    for (const project of projects) {
      if (project.language) {
        counts.set(project.language, (counts.get(project.language) ?? 0) + 1);
      }
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  }, [projects]);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const filtered = projects.filter((project) => {
      if (language && project.language !== language) return false;
      if (!needle) return true;
      const haystack = [
        project.name,
        project.description ?? "",
        project.language ?? "",
        ...project.topics,
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(needle);
    });

    return [...filtered].sort((a, b) =>
      sort === "stars"
        ? b.stars - a.stars || b.pushed_at.localeCompare(a.pushed_at)
        : b.pushed_at.localeCompare(a.pushed_at),
    );
  }, [projects, query, language, sort]);

  return (
    <div>
      <div className="mb-8 flex flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search projects, topics, languages…"
              aria-label="Search projects"
              className="w-full rounded-xl border border-line bg-surface px-4 py-3 text-sm text-ink placeholder:text-faint focus:border-accent/60 focus:outline-none"
            />
          </div>
          <div className="flex gap-2">
            <label className="sr-only" htmlFor="sort-projects">
              Sort projects
            </label>
            <select
              id="sort-projects"
              value={sort}
              onChange={(event) => setSort(event.target.value as SortKey)}
              className="rounded-xl border border-line bg-surface px-4 py-3 text-sm text-ink focus:border-accent/60 focus:outline-none"
            >
              <option value="stars">Most stars</option>
              <option value="recent">Recently updated</option>
            </select>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setLanguage(null)}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
              language === null
                ? "border-accent/60 bg-accent-soft text-ink"
                : "border-line text-muted hover:text-ink"
            }`}
          >
            All <span className="text-faint">{projects.length}</span>
          </button>
          {languages.map(([name, count]) => (
            <button
              key={name}
              type="button"
              onClick={() => setLanguage((current) => (current === name ? null : name))}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                language === name
                  ? "border-accent/60 bg-accent-soft text-ink"
                  : "border-line text-muted hover:text-ink"
              }`}
            >
              {name} <span className="text-faint">{count}</span>
            </button>
          ))}
        </div>
      </div>

      {visible.length === 0 ? (
        <p className="card p-10 text-center text-muted">
          No projects match “{query}”{language ? ` in ${language}` : ""}.
        </p>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((project) => (
            <ProjectCard key={project.slug} project={project} />
          ))}
        </div>
      )}
    </div>
  );
}
