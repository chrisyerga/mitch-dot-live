import { internalMutation, mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireAdminSession } from "./lib/auth";
import { internal } from "./_generated/api";
import type { Doc } from "./_generated/dataModel";

const editorialSourceValidator = v.union(v.literal("ai"), v.literal("manual"));
const editorialStatusValidator = v.union(
  v.literal("draft"),
  v.literal("published"),
);
const deployStatusValidator = v.union(
  v.literal("pending"),
  v.literal("triggered"),
  v.literal("failed"),
);

const editorialPostValidator = v.object({
  _id: v.id("editorialPosts"),
  title: v.string(),
  slug: v.string(),
  description: v.string(),
  body: v.string(),
  publishedAt: v.number(),
  updatedAt: v.union(v.number(), v.null()),
  isPublished: v.boolean(),
  status: editorialStatusValidator,
  source: editorialSourceValidator,
  tags: v.union(v.array(v.string()), v.null()),
  listInIndex: v.union(v.boolean(), v.null()),
  deployRequestedAt: v.union(v.number(), v.null()),
  deployStatus: v.union(deployStatusValidator, v.null()),
  deployError: v.union(v.string(), v.null()),
});

const publishedPostValidator = v.object({
  slug: v.string(),
  title: v.string(),
  description: v.string(),
  body: v.string(),
  publishedAt: v.number(),
  updatedAt: v.union(v.number(), v.null()),
  tags: v.union(v.array(v.string()), v.null()),
  source: editorialSourceValidator,
  listInIndex: v.boolean(),
});

function normalizeSlug(slug: string): string {
  const normalized = slug
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  if (!normalized) {
    throw new Error("Slug is required");
  }
  return normalized;
}

function toEditorialPost(post: Doc<"editorialPosts">) {
  return {
    _id: post._id,
    title: post.title,
    slug: post.slug,
    description: post.description,
    body: post.body,
    publishedAt: post.publishedAt,
    updatedAt: post.updatedAt ?? null,
    isPublished: post.isPublished,
    status: post.status,
    source: post.source,
    tags: post.tags ?? null,
    listInIndex: post.listInIndex ?? null,
    deployRequestedAt: post.deployRequestedAt ?? null,
    deployStatus: post.deployStatus ?? null,
    deployError: post.deployError ?? null,
  };
}

function toPublishedPost(post: Doc<"editorialPosts">) {
  return {
    slug: post.slug,
    title: post.title,
    description: post.description,
    body: post.body,
    publishedAt: post.publishedAt,
    updatedAt: post.updatedAt ?? null,
    tags: post.tags ?? null,
    source: post.source,
    listInIndex: post.listInIndex ?? true,
  };
}

export const listPublished = query({
  args: {},
  returns: v.array(publishedPostValidator),
  handler: async (ctx) => {
    const posts = await ctx.db
      .query("editorialPosts")
      .withIndex("by_published", (q) => q.eq("isPublished", true))
      .collect();

    return posts
      .filter((post) => post.status === "published")
      .sort((a, b) => b.publishedAt - a.publishedAt)
      .map(toPublishedPost);
  },
});

export const listAll = query({
  args: {
    token: v.string(),
  },
  returns: v.array(editorialPostValidator),
  handler: async (ctx, args) => {
    await requireAdminSession(ctx, args.token);

    const posts = await ctx.db.query("editorialPosts").collect();
    return posts
      .sort((a, b) => b.publishedAt - a.publishedAt)
      .map(toEditorialPost);
  },
});

export const create = mutation({
  args: {
    token: v.string(),
    title: v.string(),
    slug: v.string(),
    description: v.string(),
    body: v.string(),
    publishedAt: v.number(),
    status: editorialStatusValidator,
    source: editorialSourceValidator,
    tags: v.optional(v.array(v.string())),
    listInIndex: v.optional(v.boolean()),
  },
  returns: v.id("editorialPosts"),
  handler: async (ctx, args) => {
    await requireAdminSession(ctx, args.token);

    const slug = normalizeSlug(args.slug);
    const existing = await ctx.db
      .query("editorialPosts")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .unique();
    if (existing) {
      throw new Error(`Slug already in use: ${slug}`);
    }

    const now = Date.now();
    const isPublished = args.status === "published";

    const postId = await ctx.db.insert("editorialPosts", {
      title: args.title.trim(),
      slug,
      description: args.description.trim(),
      body: args.body,
      publishedAt: args.publishedAt,
      updatedAt: now,
      isPublished,
      status: args.status,
      source: args.source,
      tags: args.tags,
      listInIndex: args.listInIndex ?? true,
      deployStatus: isPublished ? "pending" : undefined,
      deployRequestedAt: isPublished ? now : undefined,
    });

    if (isPublished) {
      await ctx.scheduler.runAfter(0, internal.editorialDeploy.triggerSiteDeploy, {
        postId,
      });
    }

    return postId;
  },
});

export const update = mutation({
  args: {
    token: v.string(),
    id: v.id("editorialPosts"),
    title: v.string(),
    slug: v.string(),
    description: v.string(),
    body: v.string(),
    publishedAt: v.number(),
    status: editorialStatusValidator,
    source: editorialSourceValidator,
    tags: v.optional(v.array(v.string())),
    listInIndex: v.optional(v.boolean()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireAdminSession(ctx, args.token);

    const post = await ctx.db.get("editorialPosts", args.id);
    if (!post) {
      throw new Error("Editorial post not found");
    }

    const slug = normalizeSlug(args.slug);
    const slugOwner = await ctx.db
      .query("editorialPosts")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .unique();
    if (slugOwner && slugOwner._id !== args.id) {
      throw new Error(`Slug already in use: ${slug}`);
    }

    const now = Date.now();
    const isPublished = args.status === "published";
    const wasPublished = post.status === "published";
    const nextListInIndex = args.listInIndex ?? true;
    const previousListInIndex = post.listInIndex ?? true;
    const shouldTriggerDeploy =
      isPublished &&
      (!wasPublished ||
        post.body !== args.body ||
        previousListInIndex !== nextListInIndex);

    await ctx.db.patch(args.id, {
      title: args.title.trim(),
      slug,
      description: args.description.trim(),
      body: args.body,
      publishedAt: args.publishedAt,
      updatedAt: now,
      isPublished,
      status: args.status,
      source: args.source,
      tags: args.tags,
      listInIndex: nextListInIndex,
      deployStatus: shouldTriggerDeploy ? "pending" : post.deployStatus,
      deployRequestedAt: shouldTriggerDeploy ? now : post.deployRequestedAt,
      deployError: shouldTriggerDeploy ? undefined : post.deployError,
    });

    if (shouldTriggerDeploy) {
      await ctx.scheduler.runAfter(0, internal.editorialDeploy.triggerSiteDeploy, {
        postId: args.id,
      });
    }

    return null;
  },
});

export const publish = mutation({
  args: {
    token: v.string(),
    id: v.id("editorialPosts"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireAdminSession(ctx, args.token);

    const post = await ctx.db.get("editorialPosts", args.id);
    if (!post) {
      throw new Error("Editorial post not found");
    }

    const now = Date.now();
    await ctx.db.patch(args.id, {
      status: "published",
      isPublished: true,
      updatedAt: now,
      deployStatus: "pending",
      deployRequestedAt: now,
      deployError: undefined,
    });

    await ctx.scheduler.runAfter(0, internal.editorialDeploy.triggerSiteDeploy, {
      postId: args.id,
    });

    return null;
  },
});

export const unpublish = mutation({
  args: {
    token: v.string(),
    id: v.id("editorialPosts"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireAdminSession(ctx, args.token);

    const post = await ctx.db.get("editorialPosts", args.id);
    if (!post) {
      throw new Error("Editorial post not found");
    }

    const now = Date.now();
    await ctx.db.patch(args.id, {
      status: "draft",
      isPublished: false,
      updatedAt: now,
      deployStatus: "pending",
      deployRequestedAt: now,
      deployError: undefined,
    });

    await ctx.scheduler.runAfter(0, internal.editorialDeploy.triggerSiteDeploy, {
      postId: args.id,
    });

    return null;
  },
});

export const remove = mutation({
  args: {
    token: v.string(),
    id: v.id("editorialPosts"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireAdminSession(ctx, args.token);

    const post = await ctx.db.get("editorialPosts", args.id);
    if (!post) {
      throw new Error("Editorial post not found");
    }

    const wasPublished = post.status === "published";
    await ctx.db.delete(args.id);

    if (wasPublished) {
      await ctx.scheduler.runAfter(0, internal.editorialDeploy.triggerSiteDeploy, {
        postId: args.id,
      });
    }

    return null;
  },
});

export const markDeployResult = internalMutation({
  args: {
    postId: v.id("editorialPosts"),
    deployStatus: deployStatusValidator,
    deployError: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const post = await ctx.db.get("editorialPosts", args.postId);
    if (!post) {
      return null;
    }

    await ctx.db.patch(args.postId, {
      deployStatus: args.deployStatus,
      deployError: args.deployError,
    });

    return null;
  },
});
