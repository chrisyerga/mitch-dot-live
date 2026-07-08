"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import {
  createForgeTask,
  getForgeTask,
  mapForgeStatus,
  parseDeliverable,
} from "./lib/forgeClient";

export const startGeneration = action({
  args: {
    token: v.string(),
    prompt: v.string(),
  },
  returns: v.id("forgeGenerationJobs"),
  handler: async (ctx, args) => {
    const trimmed = args.prompt.trim();
    if (!trimmed) {
      throw new Error("Prompt is required");
    }

    await ctx.runQuery(internal.forge.validateAdmin, { token: args.token });

    const { taskId } = await createForgeTask(trimmed);

    return await ctx.runMutation(internal.forge.createJob, {
      prompt: trimmed,
      forgeTaskId: taskId,
    });
  },
});

export const syncGeneration = action({
  args: {
    token: v.string(),
    jobId: v.id("forgeGenerationJobs"),
  },
  returns: v.object({
    status: v.union(
      v.literal("queued"),
      v.literal("running"),
      v.literal("complete"),
      v.literal("failed"),
    ),
    currentStage: v.union(v.string(), v.null()),
    iteration: v.union(v.number(), v.null()),
    maxIterations: v.union(v.number(), v.null()),
    errorMessage: v.union(v.string(), v.null()),
    editorialPostId: v.union(v.id("editorialPosts"), v.null()),
    resultTitle: v.union(v.string(), v.null()),
    resultSlug: v.union(v.string(), v.null()),
  }),
  handler: async (ctx, args) => {
    await ctx.runQuery(internal.forge.validateAdmin, { token: args.token });

    const job = await ctx.runQuery(internal.forge.getJobInternal, {
      jobId: args.jobId,
    });
    if (!job) {
      throw new Error("Generation job not found");
    }

    if (
      (job.status === "complete" && job.editorialPostId) ||
      job.status === "failed"
    ) {
      return {
        status: job.status,
        currentStage: job.currentStage,
        iteration: job.iteration,
        maxIterations: job.maxIterations,
        errorMessage: job.errorMessage,
        editorialPostId: job.editorialPostId,
        resultTitle: job.resultTitle,
        resultSlug: job.resultSlug,
      };
    }

    const forgeTask = await getForgeTask(job.forgeTaskId);
    const status = mapForgeStatus(forgeTask.status);
    const finishedAt =
      status === "complete" || status === "failed"
        ? forgeTask.finishedAt ?? Date.now()
        : undefined;

    await ctx.runMutation(internal.forge.updateJobFromForge, {
      jobId: args.jobId,
      status,
      currentStage: forgeTask.currentStage ?? undefined,
      iteration: forgeTask.iteration,
      maxIterations: forgeTask.maxIterations,
      errorMessage: forgeTask.errorMessage ?? undefined,
      finishedAt,
    });

    if (status === "complete") {
      const deliverable = parseDeliverable(forgeTask.deliverable);
      if (!deliverable) {
        await ctx.runMutation(internal.forge.updateJobFromForge, {
          jobId: args.jobId,
          status: "failed",
          errorMessage: "Forge completed but returned an invalid deliverable",
          finishedAt: Date.now(),
        });

        return {
          status: "failed" as const,
          currentStage: forgeTask.currentStage,
          iteration: forgeTask.iteration,
          maxIterations: forgeTask.maxIterations,
          errorMessage: "Forge completed but returned an invalid deliverable",
          editorialPostId: null,
          resultTitle: null,
          resultSlug: null,
        };
      }

      const postId = await ctx.runMutation(internal.forge.ingestDeliverable, {
        jobId: args.jobId,
        deliverable: {
          title: deliverable.title,
          slug: deliverable.slug,
          metaDescription: deliverable.metaDescription,
          bodyMarkdown: deliverable.bodyMarkdown,
          tags: deliverable.tags,
        },
      });

      return {
        status: "complete" as const,
        currentStage: forgeTask.currentStage,
        iteration: forgeTask.iteration,
        maxIterations: forgeTask.maxIterations,
        errorMessage: null,
        editorialPostId: postId,
        resultTitle: deliverable.title,
        resultSlug: deliverable.slug,
      };
    }

    return {
      status,
      currentStage: forgeTask.currentStage,
      iteration: forgeTask.iteration,
      maxIterations: forgeTask.maxIterations,
      errorMessage: forgeTask.errorMessage,
      editorialPostId: null,
      resultTitle: null,
      resultSlug: null,
    };
  },
});
