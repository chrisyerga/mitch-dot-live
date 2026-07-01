import { getCollection, type CollectionEntry } from "astro:content";

export type BlogCollection = "blog" | "editorial";

export type UnifiedBlogPost = {
  slug: string;
  collection: BlogCollection;
  entry: CollectionEntry<"blog"> | CollectionEntry<"editorial">;
  title: string;
  description: string;
  pubDate: Date;
  updatedDate?: Date;
  tags?: string[];
  source: "markdown" | "ai" | "manual";
  listInIndex: boolean;
};

function slugFromMarkdownId(id: string): string {
  return id.replace(/\.mdx?$/i, "");
}

function toUnifiedPost(
  collection: BlogCollection,
  entry: CollectionEntry<"blog"> | CollectionEntry<"editorial">,
): UnifiedBlogPost {
  const slug =
    collection === "blog" ? slugFromMarkdownId(entry.id) : entry.id;

  const source =
    collection === "blog"
      ? "markdown"
      : (entry as CollectionEntry<"editorial">).data.source;

  return {
    slug,
    collection,
    entry,
    title: entry.data.title,
    description: entry.data.description,
    pubDate: entry.data.pubDate,
    updatedDate: entry.data.updatedDate,
    tags: entry.data.tags,
    source,
    listInIndex: entry.data.listInIndex ?? true,
  };
}

export async function getPublishedBlogPosts(): Promise<UnifiedBlogPost[]> {
  const markdownPosts = await getCollection("blog", ({ data }) => !data.draft);

  let editorialPosts: CollectionEntry<"editorial">[] = [];
  try {
    editorialPosts = await getCollection("editorial");
  } catch {
    editorialPosts = [];
  }

  const unified = [
    ...markdownPosts.map((entry) => toUnifiedPost("blog", entry)),
    ...editorialPosts.map((entry) => toUnifiedPost("editorial", entry)),
  ];

  const slugCounts = new Map<string, number>();
  for (const post of unified) {
    slugCounts.set(post.slug, (slugCounts.get(post.slug) ?? 0) + 1);
  }

  const collisions = [...slugCounts.entries()]
    .filter(([, count]) => count > 1)
    .map(([slug]) => slug);

  if (collisions.length > 0) {
    throw new Error(
      `Duplicate blog slugs across markdown and Convex editorial posts: ${collisions.join(", ")}`,
    );
  }

  return unified.sort(
    (a, b) => b.pubDate.getTime() - a.pubDate.getTime(),
  );
}

/** Posts visible on /blog/ index (excludes listInIndex: false). */
export async function getBlogIndexPosts(): Promise<UnifiedBlogPost[]> {
  const posts = await getPublishedBlogPosts();
  return posts.filter((post) => post.listInIndex);
}

export function formatBlogDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "America/New_York",
  }).format(date);
}

export function getBlogLastmod(post: UnifiedBlogPost): string {
  return (post.updatedDate ?? post.pubDate).toISOString();
}
