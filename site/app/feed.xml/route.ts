import { SITE, data } from "@/lib/data";

export const dynamic = "force-static";

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function GET() {
  const recent =
    data.contributions.recent.length > 0
      ? data.contributions.recent
      : data.contributions.upstream;

  const items = recent
    .slice(0, 30)
    .map((pr) => {
      const published = new Date(pr.merged_at).toUTCString();
      const title = `${pr.repo} #${pr.number}: ${pr.title}`;
      return `    <item>
      <title>${escapeXml(title)}</title>
      <link>${escapeXml(pr.url)}</link>
      <guid isPermaLink="true">${escapeXml(pr.url)}</guid>
      <pubDate>${published}</pubDate>
      <description>${escapeXml(`Merged pull request by ${pr.author} in ${pr.repo}.`)}</description>
    </item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(`${SITE.title} - merged work`)}</title>
    <link>${escapeXml(SITE.url)}</link>
    <description>${escapeXml("Recent merged pull requests across Darshan Kachare's public repositories and upstream projects.")}</description>
    <language>en-us</language>
    <lastBuildDate>${new Date(data.generated_at).toUTCString()}</lastBuildDate>
    <atom:link href="${escapeXml(`${SITE.url}/feed.xml`)}" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>
`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
    },
  });
}
