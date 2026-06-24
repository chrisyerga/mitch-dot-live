import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireAdminSession } from "./lib/auth";

const newsItemValidator = v.object({
  _id: v.id("newsItems"),
  title: v.string(),
  url: v.string(),
  source: v.string(),
  publishedAt: v.number(),
  isPublished: v.boolean(),
  sortOrder: v.number(),
});

export const listPublished = query({
  args: {},
  returns: v.array(newsItemValidator),
  handler: async (ctx) => {
    const items = await ctx.db
      .query("newsItems")
      .withIndex("by_published_and_sort", (q) => q.eq("isPublished", true))
      .collect();

    return items
      .sort((a, b) => a.sortOrder - b.sortOrder || b.publishedAt - a.publishedAt)
      .map((item) => ({
        _id: item._id,
        title: item.title,
        url: item.url,
        source: item.source,
        publishedAt: item.publishedAt,
        isPublished: item.isPublished,
        sortOrder: item.sortOrder,
      }));
  },
});

export const listAll = query({
  args: {
    token: v.string(),
  },
  returns: v.array(newsItemValidator),
  handler: async (ctx, args) => {
    await requireAdminSession(ctx, args.token);

    const items = await ctx.db.query("newsItems").collect();
    return items
      .sort((a, b) => a.sortOrder - b.sortOrder || b.publishedAt - a.publishedAt)
      .map((item) => ({
        _id: item._id,
        title: item.title,
        url: item.url,
        source: item.source,
        publishedAt: item.publishedAt,
        isPublished: item.isPublished,
        sortOrder: item.sortOrder,
      }));
  },
});

export const create = mutation({
  args: {
    token: v.string(),
    title: v.string(),
    url: v.string(),
    source: v.string(),
    publishedAt: v.number(),
    isPublished: v.boolean(),
    sortOrder: v.number(),
  },
  returns: v.id("newsItems"),
  handler: async (ctx, args) => {
    await requireAdminSession(ctx, args.token);

    return await ctx.db.insert("newsItems", {
      title: args.title,
      url: args.url,
      source: args.source,
      publishedAt: args.publishedAt,
      isPublished: args.isPublished,
      sortOrder: args.sortOrder,
    });
  },
});

export const update = mutation({
  args: {
    token: v.string(),
    id: v.id("newsItems"),
    title: v.string(),
    url: v.string(),
    source: v.string(),
    publishedAt: v.number(),
    isPublished: v.boolean(),
    sortOrder: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireAdminSession(ctx, args.token);

    const item = await ctx.db.get("newsItems", args.id);
    if (!item) {
      throw new Error("News item not found");
    }

    await ctx.db.patch("newsItems", args.id, {
      title: args.title,
      url: args.url,
      source: args.source,
      publishedAt: args.publishedAt,
      isPublished: args.isPublished,
      sortOrder: args.sortOrder,
    });

    return null;
  },
});

export const remove = mutation({
  args: {
    token: v.string(),
    id: v.id("newsItems"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireAdminSession(ctx, args.token);

    const item = await ctx.db.get("newsItems", args.id);
    if (!item) {
      throw new Error("News item not found");
    }

    await ctx.db.delete("newsItems", args.id);
    return null;
  },
});
