import { internalMutation } from "./_generated/server";
import { v } from "convex/values";

const seedNews = [
  {
    title: "McConnell announces he will step down as Senate GOP leader",
    url: "https://www.nbcnews.com/politics/congress/mitch-mcconnell-step-senate-gop-leader-rcna123456",
    source: "NBC News",
    publishedAt: Date.parse("2024-02-28"),
    sortOrder: 1,
  },
  {
    title: "Senator Mitch McConnell — Official U.S. Senate biography",
    url: "https://www.mcconnell.senate.gov/public/index.cfm/biography",
    source: "U.S. Senate",
    publishedAt: Date.parse("2024-01-01"),
    sortOrder: 2,
  },
  {
    title: "Mitch McConnell — Wikipedia",
    url: "https://en.wikipedia.org/wiki/Mitch_McConnell",
    source: "Wikipedia",
    publishedAt: Date.parse("2024-01-01"),
    sortOrder: 3,
  },
  {
    title: "McConnell freezes during news conference, then returns",
    url: "https://www.nytimes.com/2023/07/26/us/politics/mitch-mcconnell-freezes.html",
    source: "New York Times",
    publishedAt: Date.parse("2023-07-26"),
    sortOrder: 4,
  },
  {
    title: "Kentucky's longest-serving senator: a career timeline",
    url: "https://www.courier-journal.com/story/news/politics/2024/02/28/mitch-mcconnell-career-timeline-kentucky-senate/7345678901234/",
    source: "Louisville Courier-Journal",
    publishedAt: Date.parse("2024-02-28"),
    sortOrder: 5,
  },
];

export const seed = internalMutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const existingStatus = await ctx.db.query("status").first();
    if (!existingStatus) {
      await ctx.db.insert("status", {
        isAlive: true,
        updatedAt: Date.now(),
        note: "Initial seed",
      });
    }

    const existingNews = await ctx.db.query("newsItems").first();
    if (!existingNews) {
      for (const item of seedNews) {
        await ctx.db.insert("newsItems", {
          ...item,
          isPublished: true,
        });
      }
    }

    return null;
  },
});
