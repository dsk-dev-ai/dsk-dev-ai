"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import type { KeyboardEvent as ReactKeyboardEvent } from "react";
import { SITE } from "@/lib/data";

export interface PaletteProject {
  slug: string;
  name: string;
  description: string;
  language: string | null;
}

interface Item {
  id: string;
  label: string;
  hint?: string;
  group: "Pages" | "Projects" | "Elsewhere";
  href: string;
  external?: boolean;
}

export default function CommandPalette({ projects }: { projects: PaletteProject[] }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);

  const items = useMemo<Item[]>(() => {
    const pages: Item[] = [
      { id: "home", label: "Home", hint: "Hero, featured work, stats", group: "Pages", href: "/" },
      { id: "projects", label: "Projects", hint: "Browse all public repositories", group: "Pages", href: "/projects/" },
      { id: "open-source", label: "Open Source", hint: "Merged contributions and cadence", group: "Pages", href: "/open-source/" },
      { id: "contact", label: "Contact", hint: "Email, LinkedIn, availability", group: "Pages", href: "/contact/" },
    ];
    const projectItems: Item[] = projects.map((project) => ({
      id: `project-${project.slug}`,
      label: project.name,
      hint: project.description || project.language || "Project",
      group: "Projects",
      href: `/projects/${project.slug}/`,
    }));
    const elsewhere: Item[] = [
      { id: "github", label: "GitHub", hint: `@${SITE.githubHandle}`, group: "Elsewhere", href: SITE.github, external: true },
      { id: "linkedin", label: "LinkedIn", hint: "Profile and experience", group: "Elsewhere", href: SITE.linkedin, external: true },
      { id: "email", label: "Email", hint: SITE.email, group: "Elsewhere", href: `mailto:${SITE.email}` },
      { id: "feed", label: "RSS feed", hint: "Recent project updates", group: "Elsewhere", href: "/feed.xml" },
    ];
    return [...pages, ...projectItems, ...elsewhere];
  }, [projects]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return items.slice(0, 14);
    return items
      .filter((item) => `${item.label} ${item.hint ?? ""} ${item.group}`.toLowerCase().includes(needle))
      .slice(0, 14);
  }, [items, query]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((value) => !value);
      }
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!open) return;
    setQuery("");
    setActive(0);
    const timer = window.setTimeout(() => inputRef.current?.focus(), 10);
    document.body.style.overflow = "hidden";
    return () => {
      window.clearTimeout(timer);
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    setActive(0);
  }, [query]);

  function go(item: Item | undefined) {
    if (!item) return;
    setOpen(false);
    if (item.external) {
      window.open(item.href, "_blank", "noopener,noreferrer");
    } else if (item.href.startsWith("mailto:")) {
      window.location.href = item.href;
    } else {
      router.push(item.href);
    }
  }

  function onInputKeyDown(event: ReactKeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((index) => Math.min(index + 1, Math.max(filtered.length - 1, 0)));
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((index) => Math.max(index - 1, 0));
    }
    if (event.key === "Enter") {
      event.preventDefault();
      go(filtered[active]);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-10 items-center gap-2 rounded-xl border border-line px-3 text-sm text-muted transition hover:border-accent/60 hover:text-ink"
        aria-label="Open command palette"
      >
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
          <circle cx="10.5" cy="10.5" r="6.5" />
          <path d="m16 16 4 4" strokeLinecap="round" />
        </svg>
        <span className="hidden sm:inline">Search</span>
        <kbd className="hidden rounded border border-line bg-surface-2 px-1.5 py-0.5 font-mono text-[10px] text-faint md:inline">
          ⌘K
        </kbd>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-start justify-center bg-bg/70 px-4 pt-[10vh] backdrop-blur-md"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setOpen(false);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Command palette"
            className="w-full max-w-xl overflow-hidden rounded-2xl border border-line bg-surface shadow-2xl"
          >
            <div className="flex items-center gap-3 border-b border-line px-4">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" className="shrink-0 text-faint" aria-hidden>
                <circle cx="10.5" cy="10.5" r="6.5" />
                <path d="m16 16 4 4" strokeLinecap="round" />
              </svg>
              <input
                ref={inputRef}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={onInputKeyDown}
                placeholder="Search projects, pages, links…"
                aria-label="Search"
                className="h-14 w-full bg-transparent text-sm text-ink outline-none placeholder:text-faint"
              />
              <kbd className="rounded border border-line px-1.5 py-0.5 font-mono text-[10px] text-faint">esc</kbd>
            </div>

            <ul role="listbox" aria-label="Results" className="max-h-[52vh] overflow-y-auto p-2">
              {filtered.map((item, index) => (
                <li key={item.id} role="option" aria-selected={index === active}>
                  <button
                    type="button"
                    onMouseEnter={() => setActive(index)}
                    onClick={() => go(item)}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition ${
                      index === active ? "bg-accent-soft text-ink" : "text-muted hover:bg-surface-2"
                    }`}
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{item.label}</span>
                      {item.hint && <span className="block truncate text-xs text-faint">{item.hint}</span>}
                    </span>
                    <span className="shrink-0 text-[10px] uppercase tracking-wider text-faint">{item.group}</span>
                    <span aria-hidden className="shrink-0 text-xs text-faint">{item.external ? "↗" : "↵"}</span>
                  </button>
                </li>
              ))}
              {filtered.length === 0 && (
                <li className="px-3 py-8 text-center text-sm text-muted">No matches for “{query}”.</li>
              )}
            </ul>

            <div className="flex items-center justify-between border-t border-line px-4 py-2 text-[11px] text-faint">
              <span>↑↓ navigate · ↵ open</span>
              <span className="hidden sm:inline">esc close</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
