import {
  internalMutation,
  internalQuery,
  query,
} from "./_generated/server";
import { v } from "convex/values";
import { requireAdminSession } from "./lib/auth";
import type { ForgeDeliverable } from "./lib/forgeClient";
import type { Id } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";

const jobStatusValidator = v.union(
  v.literal("queued"),
  v.literal("running"),
  v.literal("complete"),
  v.literal("failed"),
);

const jobValidator = v.object({
  _id: v.id("forgeGenerationJobs"),
  prompt: v.string(),
  forgeTaskId: v.string(),
  status: jobStatusValidator,
  currentStage: v.union(v.string(), v.null()),
  iteration: v.union(v.number(), v.null()),
  maxIterations: v.union(v.number(), v.null()),
  errorMessage: v.union(v.string(), v.null()),
  editorialPostId: v.union(v.id("editorialPosts"), v.null()),
  resultTitle: v.union(v.string(), v.null()),
  resultSlug: v.union(v.string(), v.null()),
  createdAt: v.number(),
  finishedAt: v.union(v.number(), v.null()),
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

async function findAvailableSlug(
  ctx: MutationCtx,
  baseSlug: string,
): Promise<string> {
  let slug = normalizeSlug(baseSlug);
  let suffix = 2;

  while (true) {
    const existing = await ctx.db
      .query("editorialPosts")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .unique();
    if (!existing) {
      return slug;
    }
    slug = `${normalizeSlug(baseSlug)}-${suffix}`;
    suffix += 1;
  }
}

function toJob(job: {
  _id: Id<"forgeGenerationJobs">;
  prompt: string;
  forgeTaskId: string;
  status: "queued" | "running" | "complete" | "failed";
  currentStage?: string;
  iteration?: number;
  maxIterations?: number;
  errorMessage?: string;
  editorialPostId?: Id<"editorialPosts">;
  resultTitle?: string;
  resultSlug?: string;
  createdAt: number;
  finishedAt?: number;
}) {
  return {
    _id: job._id,
    prompt: job.prompt,
    forgeTaskId: job.forgeTaskId,
    status: job.status,
    currentStage: job.currentStage ?? null,
    iteration: job.iteration ?? null,
    maxIterations: job.maxIterations ?? null,
    errorMessage: job.errorMessage ?? null,
    editorialPostId: job.editorialPostId ?? null,
    resultTitle: job.resultTitle ?? null,
    resultSlug: job.resultSlug ?? null,
    createdAt: job.createdAt,
    finishedAt: job.finishedAt ?? null,
  };
}

export const validateAdmin = internalQuery({
  args: {
    token: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireAdminSession(ctx, args.token);
    return null;
  },
});

export const getJobInternal = internalQuery({
  args: {
    jobId: v.id("forgeGenerationJobs"),
  },
  returns: v.union(jobValidator, v.null()),
  handler: async (ctx, args) => {
    const job = await ctx.db.get("forgeGenerationJobs", args.jobId);
    if (!job) {
      return null;
    }

    return toJob(job);
  },
});

export const getJob = query({
  args: {
    token: v.string(),
    jobId: v.id("forgeGenerationJobs"),
  },
  returns: v.union(jobValidator, v.null()),
  handler: async (ctx, args) => {
    await requireAdminSession(ctx, args.token);

    const job = await ctx.db.get("forgeGenerationJobs", args.jobId);
    if (!job) {
      return null;
    }

    return toJob(job);
  },
});

export const listRecentJobs = query({
  args: {
    token: v.string(),
  },
  returns: v.array(jobValidator),
  handler: async (ctx, args) => {
    await requireAdminSession(ctx, args.token);

    const jobs = await ctx.db
      .query("forgeGenerationJobs")
      .withIndex("by_created_at")
      .order("desc")
      .take(10);

    return jobs.map(toJob);
  },
});

export const createJob = internalMutation({
  args: {
    prompt: v.string(),
    forgeTaskId: v.string(),
  },
  returns: v.id("forgeGenerationJobs"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("forgeGenerationJobs", {
      prompt: args.prompt.trim(),
      forgeTaskId: args.forgeTaskId,
      status: "queued",
      createdAt: Date.now(),
    });
  },
});

export const updateJobFromForge = internalMutation({
  args: {
    jobId: v.id("forgeGenerationJobs"),
    status: jobStatusValidator,
    currentStage: v.optional(v.string()),
    iteration: v.optional(v.number()),
    maxIterations: v.optional(v.number()),
    errorMessage: v.optional(v.string()),
    finishedAt: v.optional(v.number()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const job = await ctx.db.get("forgeGenerationJobs", args.jobId);
    if (!job) {
      throw new Error("Generation job not found");
    }

    await ctx.db.patch(args.jobId, {
      status: args.status,
      currentStage: args.currentStage,
      iteration: args.iteration,
      maxIterations: args.maxIterations,
      errorMessage: args.errorMessage,
      finishedAt: args.finishedAt,
    });

    return null;
  },
});

export const ingestDeliverable = internalMutation({
  args: {
    jobId: v.id("forgeGenerationJobs"),
    deliverable: v.object({
      title: v.string(),
      slug: v.string(),
      metaDescription: v.string(),
      bodyMarkdown: v.string(),
      tags: v.array(v.string()),
    }),
  },
  returns: v.id("editorialPosts"),
  handler: async (ctx, args) => {
    const job = await ctx.db.get("forgeGenerationJobs", args.jobId);
    if (!job) {
      throw new Error("Generation job not found");
    }

    if (job.editorialPostId) {
      return job.editorialPostId;
    }

    const slug = await findAvailableSlug(ctx, args.deliverable.slug);
    const now = Date.now();

    const postId = await ctx.db.insert("editorialPosts", {
      title: args.deliverable.title.trim(),
      slug,
      description: args.deliverable.metaDescription.trim(),
      body: args.deliverable.bodyMarkdown,
      publishedAt: now,
      updatedAt: now,
      isPublished: false,
      status: "draft",
      source: "ai",
      tags: args.deliverable.tags,
      listInIndex: true,
    });

    await ctx.db.patch(args.jobId, {
      editorialPostId: postId,
      resultTitle: args.deliverable.title.trim(),
      resultSlug: slug,
      status: "complete",
      finishedAt: now,
    });

    return postId;
  },
});

export type { ForgeDeliverable };
