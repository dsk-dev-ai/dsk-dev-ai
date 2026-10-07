"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const NAV = [
  { href: "/", label: "Home" },
  { href: "/projects/", label: "Projects" },
  { href: "/open-source/", label: "Open Source" },
  { href: "/contact/", label: "Contact" },
];

export default function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href.replace(/\/$/, ""));

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-bg/85 backdrop-blur-md">
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Link href="/" className="group flex items-center gap-2.5" aria-label="Darshan Kachare — home">
          <span className="grid size-9 place-items-center rounded-lg border border-accent/40 bg-accent-soft font-mono text-sm font-bold text-accent transition group-hover:border-accent">
            dk
          </span>
          <span className="hidden text-sm font-semibold tracking-tight sm:block">
            Darshan Kachare
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-lg px-3 py-2 text-sm transition ${
                isActive(item.href)
                  ? "bg-accent-soft text-ink"
                  : "text-muted hover:bg-white/5 hover:text-ink"
              }`}
            >
              {item.label}
            </Link>
          ))}
          <a
            href="https://github.com/dsk-dev-ai"
            target="_blank"
            rel="noopener noreferrer"
            className="ml-2 inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-2 text-sm text-muted transition hover:border-accent/60 hover:text-ink"
          >
            GitHub
            <span aria-hidden>↗</span>
          </a>
        </nav>

        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label="Toggle menu"
          className="grid size-10 place-items-center rounded-lg border border-line text-muted transition hover:text-ink md:hidden"
        >
          <span className="sr-only">Menu</span>
          <div className="flex flex-col gap-1.5">
            <span className={`block h-0.5 w-5 bg-current transition ${open ? "translate-y-2 rotate-45" : ""}`} />
            <span className={`block h-0.5 w-5 bg-current transition ${open ? "opacity-0" : ""}`} />
            <span className={`block h-0.5 w-5 bg-current transition ${open ? "-translate-y-2 -rotate-45" : ""}`} />
          </div>
        </button>
      </div>

      {open && (
        <nav
          id="mobile-nav"
          aria-label="Mobile"
          className="border-t border-line bg-surface md:hidden"
        >
          <div className="container-page flex flex-col py-2">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-lg px-3 py-3 text-sm ${
                  isActive(item.href) ? "bg-accent-soft text-ink" : "text-muted"
                }`}
              >
                {item.label}
              </Link>
            ))}
            <a
              href="https://github.com/dsk-dev-ai"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg px-3 py-3 text-sm text-muted"
            >
              GitHub ↗
            </a>
          </div>
        </nav>
      )}
    </header>
  );
}
