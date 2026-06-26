import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import {
  dataSourceConfigValidator,
  parsedStatusValidator,
} from "./lib/pollStatus";

export default defineSchema({
  status: defineTable({
    isAlive: v.boolean(),
    updatedAt: v.number(),
    note: v.optional(v.string()),
    message: v.optional(v.string()),
  }),

  newsItems: defineTable({
    title: v.string(),
    url: v.string(),
    source: v.string(),
    publishedAt: v.number(),
    isPublished: v.boolean(),
    sortOrder: v.number(),
    imageUrl: v.optional(v.string()),
  }).index("by_published_and_sort", ["isPublished", "sortOrder"]),

  adminSessions: defineTable({
    token: v.string(),
    expiresAt: v.number(),
  }).index("by_token", ["token"]),

  dataSources: defineTable({
    key: v.string(),
    name: v.string(),
    url: v.string(),
    confidence: v.optional(v.number()),
    currentStatus: parsedStatusValidator,
    currentStatusDetail: v.optional(v.string()),
    lastCheckedAt: v.optional(v.number()),
    lastError: v.optional(v.string()),
    enabled: v.boolean(),
    config: v.optional(dataSourceConfigValidator),
  })
    .index("by_key", ["key"])
    .index("by_enabled", ["enabled"]),

  pollSnapshots: defineTable({
    dataSourceKey: v.string(),
    source: v.string(),
    fetchedAt: v.number(),
    payload: v.string(),
    summary: v.optional(v.string()),
    parsedStatus: parsedStatusValidator,
    checkOk: v.boolean(),
    error: v.optional(v.string()),
  }).index("by_data_source_and_time", ["dataSourceKey", "fetchedAt"])
    .index("by_fetched_at", ["fetchedAt"]),

  editorialPosts: defineTable({
    title: v.string(),
    slug: v.string(),
    body: v.string(),
    publishedAt: v.number(),
    isPublished: v.boolean(),
  }).index("by_slug", ["slug"]),
});
