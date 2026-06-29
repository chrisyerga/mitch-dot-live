import fs from "node:fs";
import path from "node:path";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../convex/_generated/api";

function parseFrontmatterDates(source: string): {
  pubDate?: string;
  updatedDate?: string;
} {
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return {};

  const frontmatter = match[1];
  const pubDate = frontmatter.match(/^pubDate:\s*(.+)$/m)?.[1]?.trim();
  const updatedDate = frontmatter.match(/^updatedDate:\s*(.+)$/m)?.[1]?.trim();

  return { pubDate, updatedDate };
}

function loadMarkdownLastmods(): Map<string, string> {
  const blogDir = path.join(process.cwd(), "src/content/blog");
  const lastmodBySlug = new Map<string, string>();

  if (!fs.existsSync(blogDir)) {
    return lastmodBySlug;
  }

  for (const fileName of fs.readdirSync(blogDir)) {
    if (!/\.mdx?$/i.test(fileName)) continue;

    const slug = fileName.replace(/\.mdx?$/i, "");
    const source = fs.readFileSync(path.join(blogDir, fileName), "utf8");
    const { pubDate, updatedDate } = parseFrontmatterDates(source);
    const lastmod = updatedDate ?? pubDate;
    if (lastmod) {
      lastmodBySlug.set(slug, new Date(lastmod).toISOString());
    }
  }

  return lastmodBySlug;
}

async function loadConvexLastmods(): Promise<Map<string, string>> {
  const lastmodBySlug = new Map<string, string>();
  const convexUrl = process.env.PUBLIC_CONVEX_URL;

  if (!convexUrl) {
    return lastmodBySlug;
  }

  try {
    const client = new ConvexHttpClient(convexUrl);
    const posts = await client.query(api.editorial.listPublished, {});

    for (const post of posts) {
      const lastmod = post.updatedAt ?? post.publishedAt;
      lastmodBySlug.set(post.slug, new Date(lastmod).toISOString());
    }
  } catch {
    // Build should still succeed when Convex is unavailable locally.
  }

  return lastmodBySlug;
}

export async function buildBlogLastmodMap(): Promise<Map<string, string>> {
  const markdown = loadMarkdownLastmods();
  const convex = await loadConvexLastmods();

  for (const slug of convex.keys()) {
    if (markdown.has(slug)) {
      throw new Error(
        `Duplicate blog slug across markdown and Convex editorial posts: ${slug}`,
      );
    }
  }

  return new Map([...markdown, ...convex]);
}
