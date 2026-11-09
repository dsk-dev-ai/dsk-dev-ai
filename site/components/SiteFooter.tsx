import Link from "next/link";
import TimeAgo from "@/components/TimeAgo";
import { SITE, data } from "@/lib/data";

const SITE_LINKS = [
  { href: "/projects/", label: "Projects" },
  { href: "/open-source/", label: "Open Source" },
  { href: "/contact/", label: "Contact" },
  { href: "/feed.xml", label: "RSS feed" },
  { href: "/data.json", label: "Data API" },
];

const ELSEWHERE = [
  { href: SITE.github, label: "GitHub" },
  { href: SITE.linkedin, label: "LinkedIn" },
  { href: SITE.devto, label: "dev.to" },
  { href: SITE.medium, label: "Medium" },
];

export default function SiteFooter() {
  const year = new Date().getUTCFullYear();

  return (
    <footer className="mt-24 border-t border-line">
      <div className="container-page grid gap-10 py-14 md:grid-cols-2 lg:grid-cols-4">
        <div className="max-w-sm">
          <div className="flex items-center gap-2.5">
            <span className="grid size-8 place-items-center rounded-lg border border-accent/40 bg-accent-soft font-mono text-xs font-bold text-accent">
              dk
            </span>
            <span className="text-sm font-semibold">{SITE.title}</span>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-muted">{SITE.tagline}</p>
          <p className="mt-4 text-xs text-faint">
            {data.profile.public_repos} public repositories · {data.stats.merged_prs_total} merged pull requests
          </p>
          <p className="mt-1 text-xs text-faint">
            Data updated <TimeAgo iso={data.generated_at} /> · GitHub API
          </p>
        </div>

        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-faint">Site</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {SITE_LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="text-muted transition hover:text-ink">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-faint">Elsewhere</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {ELSEWHERE.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted transition hover:text-ink"
                >
                  {link.label} ↗
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-faint">Contact</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {SITE.emails.map((email) => (
              <li key={email}>
                <a href={`mailto:${email}`} className="break-all text-muted transition hover:text-ink">
                  {email}
                </a>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs leading-relaxed text-faint">{SITE.availability}</p>
        </div>
      </div>

      <div className="border-t border-line">
        <div className="container-page flex flex-col gap-2 py-6 text-xs text-faint sm:flex-row sm:items-center sm:justify-between">
          <span>
            © {year} {SITE.domain} · {SITE.location}
          </span>
          <span>
            Generated{" "}
            <time dateTime={data.generated_at}>
              {new Date(data.generated_at).toISOString().slice(0, 10)}
            </time>{" "}
            · built with Next.js · hosted on Render
          </span>
        </div>
      </div>
    </footer>
  );
}
