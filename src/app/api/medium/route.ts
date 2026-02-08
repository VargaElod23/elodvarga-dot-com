import { NextResponse } from "next/server";

const MEDIUM_USERNAME = "vargaelod";

export async function GET() {
  try {
    const res = await fetch(
      `https://medium.com/feed/@${MEDIUM_USERNAME}`,
      { next: { revalidate: 3600 } }
    );

    if (!res.ok) {
      return NextResponse.json({ articles: [], error: "Failed to fetch feed" }, { status: 502 });
    }

    const xml = await res.text();
    const articles = parseRSS(xml);

    return NextResponse.json({ articles });
  } catch {
    return NextResponse.json({ articles: [], error: "Failed to fetch feed" }, { status: 500 });
  }
}

interface Article {
  title: string;
  link: string;
  pubDate: string;
  categories: string[];
  description: string;
}

function parseRSS(xml: string): Article[] {
  const items: Article[] = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;

  while ((match = itemRegex.exec(xml)) !== null) {
    const item = match[1];
    const title = extractTag(item, "title");
    const link = extractTag(item, "link");
    const pubDate = extractTag(item, "pubDate");
    const description = extractTag(item, "description");

    const categories: string[] = [];
    const catRegex = /<category><!\[CDATA\[(.*?)\]\]><\/category>/g;
    let catMatch;
    while ((catMatch = catRegex.exec(item)) !== null) {
      categories.push(catMatch[1]);
    }

    if (title && link) {
      items.push({
        title: cleanCDATA(title),
        link: cleanCDATA(link),
        pubDate: pubDate || "",
        categories,
        description: stripHtml(cleanCDATA(description || "")).slice(0, 200),
      });
    }
  }

  return items;
}

function extractTag(xml: string, tag: string): string | null {
  const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`);
  const match = regex.exec(xml);
  return match ? match[1].trim() : null;
}

function cleanCDATA(text: string): string {
  return text.replace(/<!\[CDATA\[/g, "").replace(/\]\]>/g, "").trim();
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').trim();
}
