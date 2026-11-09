"use client";

import { useDeferredValue, useEffect, useMemo, useState } from "react";
import ProjectCard from "@/components/ProjectCard";
import type { Project } from "@/lib/data";

type SortKey = "stars" | "recent" | "name";

export default function ProjectExplorer({
  projects,
  featuredSlugs = [],
}: {
  projects: Project[];
  featuredSlugs?: string[];
}) {
  const [query, setQuery] = useState("");
  const [language, setLanguage] = useState<string | null>(null);
  const [topic, setTopic] = useState<string | null>(null);
  const [sort, setSort] = useState<SortKey>("stars");
  const [ready, setReady] = useState(false);
  const deferredQuery = useDeferredValue(query);

  const languages = useMemo(() => {
    const counts = new Map<string, number>();
    for (const project of projects) {
      if (project.language) {
        counts.set(project.language, (counts.get(project.language) ?? 0) + 1);
      }
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  }, [projects]);

  const topics = useMemo(() => {
    const counts = new Map<string, number>();
    for (const project of projects) {
      for (const item of project.topics) {
        counts.set(item, (counts.get(item) ?? 0) + 1);
      }
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 14);
  }, [projects]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const q = params.get("q");
    const lang = params.get("lang");
    const tag = params.get("topic");
    const order = params.get("sort");
    if (q) setQuery(q);
    if (lang) setLanguage(lang);
    if (tag) setTopic(tag);
    if (order === "recent" || order === "name" || order === "stars") setSort(order);
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (language) params.set("lang", language);
    if (topic) params.set("topic", topic);
    if (sort !== "stars") params.set("sort", sort);
    const queryString = params.toString();
    window.history.replaceState(
      null,
      "",
      queryString ? `${window.location.pathname}?${queryString}` : window.location.pathname,
    );
  }, [ready, query, language, topic, sort]);

  const visible = useMemo(() => {
    const needle = deferredQuery.trim().toLowerCase();
    const filtered = projects.filter((project) => {
      if (language && project.language !== language) return false;
      if (topic && !project.topics.includes(topic)) return false;
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

    return [...filtered].sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name);
      if (sort === "recent") return b.pushed_at.localeCompare(a.pushed_at);
      return b.stars - a.stars || b.pushed_at.localeCompare(a.pushed_at);
    });
  }, [projects, deferredQuery, language, topic, sort]);

  const activeFilters = [query.trim(), language, topic].filter(Boolean).length;

  function reset() {
    setQuery("");
    setLanguage(null);
    setTopic(null);
    setSort("stars");
  }

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
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label="Clear search"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-faint transition hover:text-ink"
              >
                clear
              </button>
            )}
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
              <option value="name">Name A–Z</option>
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-1 text-xs font-semibold uppercase tracking-wider text-faint">Language</span>
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
              aria-pressed={language === name}
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

        {topics.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-1 text-xs font-semibold uppercase tracking-wider text-faint">Topics</span>
            {topics.map(([name, count]) => (
              <button
                key={name}
                type="button"
                onClick={() => setTopic((current) => (current === name ? null : name))}
                aria-pressed={topic === name}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                  topic === name
                    ? "border-emerald/50 bg-emerald/10 text-emerald"
                    : "border-line text-muted hover:text-ink"
                }`}
              >
                {name} <span className="text-faint">{count}</span>
              </button>
            ))}
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4 text-sm">
          <p className="text-muted" aria-live="polite">
            Showing <span className="font-semibold text-ink">{visible.length}</span> of{" "}
            {projects.length} projects
            {activeFilters > 0 && (
              <span className="text-faint"> · {activeFilters} filter{activeFilters === 1 ? "" : "s"} active</span>
            )}
          </p>
          {(activeFilters > 0 || sort !== "stars") && (
            <button
              type="button"
              onClick={reset}
              className="text-sm font-medium text-accent transition hover:text-ink"
            >
              Reset filters
            </button>
          )}
        </div>
      </div>

      {visible.length === 0 ? (
        <div className="card p-10 text-center">
          <p className="text-muted">
            No projects match “{query}”{language ? ` in ${language}` : ""}
            {topic ? ` tagged ${topic}` : ""}.
          </p>
          <button
            type="button"
            onClick={reset}
            className="mt-4 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-[var(--color-on-accent)] transition hover:brightness-110"
          >
            Show all projects
          </button>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((project) => (
            <ProjectCard
              key={project.slug}
              project={project}
              featured={featuredSlugs.includes(project.slug)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
