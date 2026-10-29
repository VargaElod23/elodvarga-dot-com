import type { MetadataRoute } from "next";
import { getAllPosts } from "@/lib/writing";

// ─── Sitemap ─────────────────────────────────────────────────────────────────

const SITE_URL = "https://www.elodvarga.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const posts = getAllPosts().filter((post) => !post.draft);

  return [
    { url: SITE_URL, changeFrequency: "monthly", priority: 1 },
    {
      url: `${SITE_URL}/writing`,
      lastModified: posts[0]?.date || undefined,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    ...posts.map((post) => ({
      url: `${SITE_URL}/writing/${post.slug}`,
      lastModified: post.date || undefined,
      changeFrequency: "yearly" as const,
      priority: 0.6,
    })),
  ];
}
