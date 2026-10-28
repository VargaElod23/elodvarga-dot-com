import { getAllPosts } from "@/lib/writing";

// ─── RSS ─────────────────────────────────────────────────────────────────────
// RSS 2.0 feed of all published posts, rendered once at build time.

export const dynamic = "force-static";

const SITE_URL = "https://0xelod.com";

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function GET() {
  const posts = getAllPosts().filter((post) => !post.draft);

  const items = posts
    .map((post) => {
      const link = `${SITE_URL}/writing/${post.slug}`;
      return [
        "    <item>",
        `      <title>${escapeXml(post.title)}</title>`,
        `      <link>${link}</link>`,
        `      <guid isPermaLink="true">${link}</guid>`,
        post.date && `      <pubDate>${new Date(post.date).toUTCString()}</pubDate>`,
        `      <description>${escapeXml(post.summary)}</description>`,
        "    </item>",
      ]
        .filter(Boolean)
        .join("\n");
    })
    .join("\n");

  const lastBuildDate = posts[0]?.date
    ? `\n    <lastBuildDate>${new Date(posts[0].date).toUTCString()}</lastBuildDate>`
    : "";

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Writing | Előd Varga</title>
    <link>${SITE_URL}/writing</link>
    <description>Long-form write-ups of things Előd Varga built and is proud of.</description>
    <language>en</language>
    <atom:link href="${SITE_URL}/writing/rss.xml" rel="self" type="application/rss+xml" />${lastBuildDate}
${items}
  </channel>
</rss>
`;

  return new Response(xml, {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8" },
  });
}
