import type { MetadataRoute } from "next";
import { SITE, data, getProjects } from "@/lib/data";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date(data.generated_at);
  const staticRoutes = ["", "/projects/", "/open-source/", "/contact/"].map((path) => ({
    url: `${SITE.url}${path}`,
    lastModified,
    changeFrequency: "weekly" as const,
    priority: path === "" ? 1 : 0.8,
  }));

  const projectRoutes = getProjects().map((project) => ({
    url: `${SITE.url}/projects/${project.slug}/`,
    lastModified: new Date(project.pushed_at),
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  return [...staticRoutes, ...projectRoutes];
}
