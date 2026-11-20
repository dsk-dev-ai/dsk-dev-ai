import Link from "next/link";
import type { ReactNode } from "react";

const POLICIES = [
  { href: "/terms/", label: "Terms" },
  { href: "/privacy/", label: "Privacy" },
  { href: "/refunds/", label: "Refunds" },
];

export default function LegalPage({
  eyebrow,
  title,
  description,
  updated,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  updated: string;
  children: ReactNode;
}) {
  return (
    <div className="container-page py-16 sm:py-20">
      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-accent">
        {eyebrow}
      </p>
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1>
      <p className="mt-4 max-w-2xl leading-relaxed text-muted">{description}</p>
      <p className="mt-3 text-xs text-faint">Last updated: {updated}</p>

      <div className="mt-10 max-w-3xl space-y-9 text-sm leading-relaxed text-muted">
        {children}
      </div>

      <div className="mt-12 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-line pt-6 text-xs text-faint">
        <span>Related policies:</span>
        {POLICIES.map((policy) => (
          <Link
            key={policy.href}
            href={policy.href}
            className="text-accent transition hover:text-ink"
          >
            {policy.label}
          </Link>
        ))}
        <Link href="/store/" className="text-accent transition hover:text-ink">
          Store →
        </Link>
      </div>
    </div>
  );
}

export function LegalSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="text-lg font-semibold tracking-tight text-ink">{title}</h2>
      <div className="mt-2 space-y-3">{children}</div>
    </section>
  );
}
