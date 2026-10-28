import type { Metadata } from "next";
import Link from "next/link";
import { getAllPosts } from "@/lib/writing";

export const metadata: Metadata = {
  title: "Writing | Előd Varga",
  description: "Long-form write-ups of things Előd Varga built and is proud of.",
  alternates: {
    types: { "application/rss+xml": "https://0xelod.com/writing/rss.xml" },
  },
};

export default function WritingIndex() {
  const posts = getAllPosts();

  return (
    <div className="flex min-h-screen justify-center p-2 sm:p-6">
      <main className="w-full max-w-3xl border border-border bg-surface sm:rounded-lg overflow-hidden">
        <div className="flex items-center gap-2 border-b border-border bg-surface-light px-4 py-2.5 text-xs">
          <span className="h-3 w-3 rounded-full bg-red" />
          <span className="h-3 w-3 rounded-full bg-amber" />
          <span className="h-3 w-3 rounded-full bg-green" />
          <span className="ml-2 text-gray-light">~/writing</span>
        </div>

        <div className="px-5 py-8 sm:px-10 sm:py-10 text-foreground">
          <nav className="mb-8 text-xs">
            <Link href="/" className="text-blue hover:text-green transition-colors">
              [cd ~]
            </Link>
          </nav>
          <div className="mb-2 text-sm">
            <span className="text-green">elod@varga</span>
            <span className="text-gray-light">:</span>
            <span className="text-blue">~/writing</span>
            <span>$ </span>
            <span className="text-amber">ls -t</span>
          </div>
          <p className="mb-8 text-gray-light text-sm">
            Things I built and am proud of, written up properly.
          </p>

          <ul className="space-y-6">
            {posts.map((post) => (
              <li key={post.slug} className="border-l border-green-dark pl-4">
                <Link
                  href={`/writing/${post.slug}`}
                  className="text-green font-bold hover:text-amber transition-colors"
                >
                  {post.title}
                </Link>
                <div className="text-gray text-xs mt-1">
                  {new Date(post.date).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}{" "}
                  · {post.readingMinutes} min
                  {post.draft && <span className="text-red"> [DRAFT]</span>}
                </div>
                <p className="text-sm mt-2 leading-relaxed">{post.summary}</p>
              </li>
            ))}
          </ul>
        </div>
      </main>
    </div>
  );
}
