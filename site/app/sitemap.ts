import type { MetadataRoute } from "next";

export const dynamic = "force-static";
import { SITE, getProjects } from "@/lib/data";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = ["", "/projects/", "/open-source/", "/contact/"].map(
    (path) => ({
      url: `${SITE.url}${path}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: path === "" ? 1 : 0.8,
    }),
  );

  const projectRoutes = getProjects().map((project) => ({
    url: `${SITE.url}/projects/${project.slug}/`,
    lastModified: new Date(project.pushed_at),
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  return [...staticRoutes, ...projectRoutes];
}
