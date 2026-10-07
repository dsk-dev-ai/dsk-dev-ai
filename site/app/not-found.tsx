import Link from "next/link";
import { ButtonLink } from "@/components/ui";

export default function NotFound() {
  return (
    <div className="container-page flex flex-col items-center py-32 text-center">
      <p className="font-mono text-sm text-accent">404</p>
      <h1 className="mt-3 text-3xl font-bold tracking-tight">Page not found</h1>
      <p className="mt-3 max-w-md text-muted">
        That page doesn&apos;t exist — it may have moved, or the link is stale.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <ButtonLink href="/">Back home</ButtonLink>
        <Link
          href="/projects/"
          className="inline-flex items-center rounded-xl border border-line px-5 py-3 text-sm font-semibold transition hover:border-accent/60 hover:bg-accent-soft"
        >
          Browse projects
        </Link>
      </div>
    </div>
  );
}
