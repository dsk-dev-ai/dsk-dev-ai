"use client";

import Link from "next/link";
import { useEffect } from "react";
import { ButtonLink } from "@/components/ui";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="container-page flex flex-col items-center py-32 text-center">
      <p className="font-mono text-sm text-rose">Something broke</p>
      <h1 className="mt-3 text-3xl font-bold tracking-tight">Unexpected error</h1>
      <p className="mt-3 max-w-md text-muted">
        This page hit an error while rendering. Try again, or head somewhere more useful.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="inline-flex items-center justify-center rounded-xl bg-accent px-5 py-3 text-sm font-semibold text-[var(--color-on-accent)] transition hover:brightness-110"
        >
          Try again
        </button>
        <ButtonLink href="/" variant="ghost">
          Back home
        </ButtonLink>
        <Link
          href="/projects/"
          className="inline-flex items-center rounded-xl px-5 py-3 text-sm font-semibold text-muted transition hover:text-ink"
        >
          Browse projects
        </Link>
      </div>
    </div>
  );
}
