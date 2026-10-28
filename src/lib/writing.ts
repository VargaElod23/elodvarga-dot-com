import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

// ─── Writing ─────────────────────────────────────────────────────────────────
// Posts live as markdown in /content/writing/<slug>.md with frontmatter.

const WRITING_DIR = path.join(process.cwd(), "content", "writing");

export interface PostMeta {
  slug: string;
  title: string;
  summary: string;
  date: string;
  tags: string[];
  draft: boolean;
  readingMinutes: number;
}

export interface Post extends PostMeta {
  content: string;
}

function readPost(file: string): Post {
  const slug = file.replace(/\.md$/, "");
  const raw = fs.readFileSync(path.join(WRITING_DIR, file), "utf8");
  const { data, content } = matter(raw);
  const words = content.split(/\s+/).filter(Boolean).length;
  return {
    slug,
    title: data.title ?? slug,
    summary: data.summary ?? "",
    date: data.date ? new Date(data.date).toISOString() : "",
    tags: data.tags ?? [],
    draft: data.draft ?? false,
    readingMinutes: Math.max(1, Math.round(words / 230)),
    content,
  };
}

// Drafts are visible in `next dev` but excluded from production builds.
function isVisible(post: PostMeta) {
  return !post.draft || process.env.NODE_ENV !== "production";
}

export function getAllPosts(): PostMeta[] {
  if (!fs.existsSync(WRITING_DIR)) return [];
  return fs
    .readdirSync(WRITING_DIR)
    .filter((f) => f.endsWith(".md"))
    .map(readPost)
    .filter(isVisible)
    .sort((a, b) => b.date.localeCompare(a.date))
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    .map(({ content, ...meta }) => meta);
}

export function getPost(slug: string): Post | null {
  const file = `${slug}.md`;
  if (!fs.existsSync(path.join(WRITING_DIR, file))) return null;
  const post = readPost(file);
  return isVisible(post) ? post : null;
}
