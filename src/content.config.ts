import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";
import { editorialConvexLoader } from "./loaders/editorialConvexLoader";

const blogPostSchema = z.object({
  title: z.string(),
  description: z.string(),
  pubDate: z.coerce.date(),
  updatedDate: z.coerce.date().optional(),
  tags: z.array(z.string()).optional(),
  draft: z.boolean().optional(),
  /** When false, the post is built and sitemapped but omitted from /blog/ index. Default: true */
  listInIndex: z.boolean().optional(),
});

const blog = defineCollection({
  loader: glob({ base: "./src/content/blog", pattern: "**/*.{md,mdx}" }),
  schema: blogPostSchema,
});

const editorial = defineCollection({
  loader: editorialConvexLoader(),
  schema: blogPostSchema.extend({
    source: z.enum(["ai", "manual"]),
  }),
});

export const collections = { blog, editorial };
