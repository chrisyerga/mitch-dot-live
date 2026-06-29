import type { Loader } from "astro/loaders";
import { z } from "astro/zod";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../convex/_generated/api";

const editorialSchema = z.object({
  title: z.string(),
  description: z.string(),
  pubDate: z.coerce.date(),
  updatedDate: z.coerce.date().optional(),
  tags: z.array(z.string()).optional(),
  source: z.enum(["ai", "manual"]),
});

type EditorialApiPost = {
  slug: string;
  title: string;
  description: string;
  body: string;
  publishedAt: number;
  updatedAt: number | null;
  tags: string[] | null;
  source: "ai" | "manual";
};

export function editorialConvexLoader(): Loader {
  return {
    name: "editorial-convex-loader",
    load: async ({ store, parseData, logger }) => {
      store.clear();

      const convexUrl = import.meta.env.PUBLIC_CONVEX_URL;
      if (!convexUrl) {
        logger.warn(
          "PUBLIC_CONVEX_URL is not set; skipping Convex editorial posts at build time.",
        );
        return;
      }

      try {
        const client = new ConvexHttpClient(convexUrl);
        const posts: EditorialApiPost[] = await client.query(
          api.editorial.listPublished,
          {},
        );

        for (const post of posts) {
          const data = await parseData({
            id: post.slug,
            data: {
              title: post.title,
              description: post.description,
              pubDate: new Date(post.publishedAt),
              updatedDate: post.updatedAt ? new Date(post.updatedAt) : undefined,
              tags: post.tags ?? undefined,
              source: post.source,
            },
          });

          store.set({
            id: post.slug,
            data,
            body: post.body,
          });
        }
      } catch (error) {
        logger.error(
          `Failed to load editorial posts from Convex: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    },
    schema: editorialSchema,
  } satisfies Loader;
}
