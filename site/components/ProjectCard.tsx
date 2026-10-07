import Link from "next/link";
import { Badge, LanguageDot, Stars } from "@/components/ui";
import { timeAgo, type Project } from "@/lib/data";

export default function ProjectCard({
  project,
  featured = false,
}: {
  project: Project;
  featured?: boolean;
}) {
  return (
    <article
      className={`card group relative flex flex-col p-5 transition duration-300 hover:border-accent/50 hover:shadow-glow ${
        featured ? "sm:p-6" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-base font-semibold tracking-tight">
            <Link href={`/projects/${project.slug}/`} className="after:absolute after:inset-0">
              {project.name}
              <span className="sr-only"> (project detail)</span>
            </Link>
          </h3>
          {project.homepage && (
            <a
              href={project.homepage}
              target="_blank"
              rel="noopener noreferrer"
              className="relative z-20 mt-0.5 inline-block max-w-full truncate text-xs text-emerald transition hover:underline"
            >
              {project.homepage.replace(/^https?:\/\//, "").replace(/\/$/, "")} ↗
            </a>
          )}
        </div>
        <Stars value={project.stars} />
      </div>

      <p className="mt-3 line-clamp-3 flex-1 text-sm leading-relaxed text-muted">
        {project.description ?? "No description provided."}
      </p>

      {project.topics.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {project.topics.slice(0, 3).map((topic) => (
            <Badge key={topic}>{topic}</Badge>
          ))}
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-line pt-4">
        <LanguageDot name={project.language} />
        <span className="text-xs text-faint">{timeAgo(project.pushed_at)}</span>
        {project.archived && <Badge tone="amber">archived</Badge>}
      </div>
    </article>
  );
}
