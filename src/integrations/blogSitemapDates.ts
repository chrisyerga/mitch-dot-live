import type { AstroIntegration } from "astro";
import { buildBlogLastmodMap } from "../lib/blogLastmod.ts";

/** Shared lastmod dates for blog post URLs, populated at build start. */
export const blogLastmodBySlug = new Map<string, string>();

export function blogSitemapDates(): AstroIntegration {
  return {
    name: "blog-sitemap-dates",
    hooks: {
      "astro:build:start": async () => {
        blogLastmodBySlug.clear();
        const lastmods = await buildBlogLastmodMap();
        for (const [slug, lastmod] of lastmods) {
          blogLastmodBySlug.set(slug, lastmod);
        }
      },
    },
  };
}
