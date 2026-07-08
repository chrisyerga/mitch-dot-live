import type { AstroIntegration } from "astro";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { BLOG_ENABLED } from "../lib/blogConfig.ts";
import { buildBlogLastmodMap } from "../lib/blogLastmod.ts";

/** Shared lastmod dates for blog post URLs, populated at build start. */
export const blogLastmodBySlug = new Map<string, string>();

export function blogSitemapDates(): AstroIntegration {
  return {
    name: "blog-sitemap-dates",
    hooks: {
      "astro:build:start": async () => {
        blogLastmodBySlug.clear();
        if (!BLOG_ENABLED) {
          return;
        }
        const lastmods = await buildBlogLastmodMap();
        for (const [slug, lastmod] of lastmods) {
          blogLastmodBySlug.set(slug, lastmod);
        }
      },
      "astro:build:done": ({ dir }) => {
        if (BLOG_ENABLED) {
          return;
        }

        const blogDir = path.join(fileURLToPath(dir), "blog");
        fs.rmSync(blogDir, { recursive: true, force: true });
      },
    },
  };
}
