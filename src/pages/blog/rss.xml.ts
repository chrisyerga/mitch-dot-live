import rss from "@astrojs/rss";
import MarkdownIt from "markdown-it";
import sanitizeHtml from "sanitize-html";
import { BLOG_ENABLED } from "../../lib/blogConfig";
import { SITE } from "../../lib/site";
import { getPublishedBlogPosts } from "../../lib/blog";

const parser = new MarkdownIt();

function renderMarkdownBody(body: string | undefined): string | undefined {
  if (!body) return undefined;
  return sanitizeHtml(parser.render(body), {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat(["img"]),
  });
}

export async function GET(context: { site: URL | undefined }) {
  if (!BLOG_ENABLED) {
    return new Response("Not Found", { status: 404 });
  }

  const posts = await getPublishedBlogPosts();

  return rss({
    title: `${SITE.name} Blog`,
    description:
      "Articles about Senator Mitch McConnell, Senate leadership, and how this live status tracker works.",
    site: context.site ?? SITE.url,
    items: posts.map((post) => ({
      title: post.title,
      description: post.description,
      pubDate: post.pubDate,
      link: `/blog/${post.slug}/`,
      content: renderMarkdownBody(
        "body" in post.entry ? post.entry.body : undefined,
      ),
    })),
    customData: `<language>en-us</language>`,
  });
}
