import Link from "next/link";
import type { ReactNode } from "react";
import { formatCount, languageColor } from "@/lib/data";

export function SectionHeading({
  eyebrow,
  title,
  action,
}: {
  eyebrow?: string;
  title: string;
  action?: { href: string; label: string };
}) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        {eyebrow && (
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-accent">
            {eyebrow}
          </p>
        )}
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h2>
      </div>
      {action && (
        <Link
          href={action.href}
          className="text-sm font-medium text-accent transition hover:text-ink"
        >
          {action.label} →
        </Link>
      )}
    </div>
  );
}

export function Badge({
  children,
  tone = "default",
}: {
  children: ReactNode;
  tone?: "default" | "accent" | "emerald" | "amber";
}) {
  const tones = {
    default: "border-line text-muted",
    accent: "border-accent/40 bg-accent-soft text-accent",
    emerald: "border-emerald/40 bg-emerald/10 text-emerald",
    amber: "border-amber/40 bg-amber/10 text-amber",
  } as const;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

export function Stat({ value, label }: { value: string | number; label: string }) {
  return (
    <div className="card p-5">
      <div className="font-mono text-2xl font-bold tracking-tight text-ink sm:text-3xl">
        {typeof value === "number" ? formatCount(value) : value}
      </div>
      <div className="mt-1 text-xs font-medium uppercase tracking-wider text-faint">
        {label}
      </div>
    </div>
  );
}

export function LanguageDot({ name }: { name: string | null }) {
  if (!name) return null;
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-muted">
      <span
        className="size-2.5 rounded-full"
        style={{ backgroundColor: languageColor(name) }}
        aria-hidden
      />
      {name}
    </span>
  );
}

export function ButtonLink({
  href,
  children,
  variant = "primary",
}: {
  href: string;
  children: ReactNode;
  variant?: "primary" | "ghost";
}) {
  const styles =
    variant === "primary"
      ? "bg-accent text-[#08101f] hover:bg-[#8aa4ff]"
      : "border border-line text-ink hover:border-accent/60 hover:bg-accent-soft";

  return (
    <Link
      href={href}
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition ${styles}`}
    >
      {children}
    </Link>
  );
}

export function Stars({ value }: { value: number }) {
  return (
    <span className="inline-flex items-center gap-1 text-xs text-faint" title={`${value} stars`}>
      <svg viewBox="0 0 16 16" width="13" height="13" fill="currentColor" aria-hidden>
        <path d="M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.75.75 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25Z" />
      </svg>
      {formatCount(value)}
    </span>
  );
}
