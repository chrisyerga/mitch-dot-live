import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  status: defineTable({
    isAlive: v.boolean(),
    updatedAt: v.number(),
    note: v.optional(v.string()),
  }),

  newsItems: defineTable({
    title: v.string(),
    url: v.string(),
    source: v.string(),
    publishedAt: v.number(),
    isPublished: v.boolean(),
    sortOrder: v.number(),
  }).index("by_published_and_sort", ["isPublished", "sortOrder"]),

  adminSessions: defineTable({
    token: v.string(),
    expiresAt: v.number(),
  }).index("by_token", ["token"]),

  pollSnapshots: defineTable({
    source: v.string(),
    fetchedAt: v.number(),
    payload: v.string(),
    summary: v.optional(v.string()),
  }),

  editorialPosts: defineTable({
    title: v.string(),
    slug: v.string(),
    body: v.string(),
    publishedAt: v.number(),
    isPublished: v.boolean(),
  }).index("by_slug", ["slug"]),
});
