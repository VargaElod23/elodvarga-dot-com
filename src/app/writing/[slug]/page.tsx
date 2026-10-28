import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllPosts, getPost } from "@/lib/writing";
import Markdown from "../markdown";

export function generateStaticParams() {
  return getAllPosts().map(({ slug }) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const post = getPost((await params).slug);
  if (!post) return {};
  return {
    title: `${post.title} | Előd Varga`,
    description: post.summary,
    openGraph: { title: post.title, description: post.summary, type: "article" },
  };
}

export default async function PostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const post = getPost((await params).slug);
  if (!post) notFound();

  return (
    <div className="flex min-h-screen justify-center p-2 sm:p-6">
      <article className="w-full max-w-3xl border border-border bg-surface sm:rounded-lg overflow-hidden">
        <div className="flex items-center gap-2 border-b border-border bg-surface-light px-4 py-2.5 text-xs">
          <span className="h-3 w-3 rounded-full bg-red" />
          <span className="h-3 w-3 rounded-full bg-amber" />
          <span className="h-3 w-3 rounded-full bg-green" />
          <span className="ml-2 text-gray-light truncate">
            ~/writing/{post.slug}.md
          </span>
        </div>

        <div className="px-5 py-8 sm:px-10 sm:py-10 text-foreground">
          <nav className="mb-8 text-xs">
            <Link href="/writing" className="text-blue hover:text-green transition-colors">
              [cd ../writing]
            </Link>
          </nav>

          <header className="mb-8">
            <h1 className="text-green font-bold text-2xl sm:text-3xl leading-tight">
              {post.title}
            </h1>
            <p className="mt-3 text-gray-light">{post.summary}</p>
            <div className="mt-4 flex flex-wrap items-center gap-1.5 text-xs">
              <span className="text-gray">
                {new Date(post.date).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}{" "}
                · {post.readingMinutes} min read
              </span>
              {post.draft && <span className="text-red">[DRAFT]</span>}
              {post.tags.map((tag) => (
                <span key={tag} className="bg-surface-light px-1.5 py-0.5 text-cyan">
                  {tag}
                </span>
              ))}
            </div>
          </header>

          <div className="text-[15px]">
            <Markdown>{post.content}</Markdown>
          </div>

          <footer className="mt-12 border-t border-border pt-6 text-xs text-gray-light flex flex-wrap gap-4">
            <Link href="/writing" className="text-blue hover:text-green transition-colors">
              [more writing]
            </Link>
            <Link href="/" className="text-blue hover:text-green transition-colors">
              [cd ~]
            </Link>
            <a href="mailto:elod@apeconsulting.xyz" className="text-blue hover:text-green transition-colors">
              [reply by email]
            </a>
          </footer>
        </div>
      </article>
    </div>
  );
}
