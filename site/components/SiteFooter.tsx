import Link from "next/link";
import { SITE, data } from "@/lib/data";

const LINKS = [
  { href: "/projects/", label: "Projects" },
  { href: "/open-source/", label: "Open Source" },
  { href: "/contact/", label: "Contact" },
  { href: SITE.github, label: "GitHub", external: true },
];

export default function SiteFooter() {
  const year = new Date().getUTCFullYear();

  return (
    <footer className="mt-24 border-t border-line">
      <div className="container-page flex flex-col gap-8 py-12 md:flex-row md:items-start md:justify-between">
        <div className="max-w-sm">
          <div className="flex items-center gap-2.5">
            <span className="grid size-8 place-items-center rounded-lg border border-accent/40 bg-accent-soft font-mono text-xs font-bold text-accent">
              dk
            </span>
            <span className="text-sm font-semibold">Darshan Kachare</span>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            {SITE.tagline}
          </p>
          <p className="mt-4 text-xs text-faint">
            {data.profile.public_repos} public repositories ·{" "}
            {data.stats.merged_prs_total} merged pull requests
          </p>
        </div>

        <div className="flex gap-16">
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-faint">
              Site
            </h2>
            <ul className="mt-3 space-y-2 text-sm">
              {LINKS.map((link) =>
                link.external ? (
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
                ) : (
                  <li key={link.href}>
                    <Link href={link.href} className="text-muted transition hover:text-ink">
                      {link.label}
                    </Link>
                  </li>
                ),
              )}
            </ul>
          </div>
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-faint">
              Contact
            </h2>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <a
                  href={`mailto:${SITE.email}`}
                  className="break-all text-muted transition hover:text-ink"
                >
                  {SITE.email}
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-line">
        <div className="container-page flex flex-col gap-2 py-6 text-xs text-faint sm:flex-row sm:items-center sm:justify-between">
          <span>
            © {year} {SITE.domain}
          </span>
          <span>
            Data from the GitHub API · generated{" "}
            {new Date(data.generated_at).toISOString().slice(0, 10)} · hosted on Render
          </span>
        </div>
      </div>
    </footer>
  );
}
