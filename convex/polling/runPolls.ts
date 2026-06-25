import { internalAction, type ActionCtx } from "../_generated/server";
import { v } from "convex/values";
import { internal } from "../_generated/api";
import { pollSource } from "./pollSource";
import type { EnabledDataSource } from "../lib/pollStatus";

async function executePoll(ctx: ActionCtx, source: EnabledDataSource) {
  try {
    const pollResult = await pollSource(source);

    await ctx.runMutation(internal.polling.recordPoll.recordPoll, {
      dataSourceKey: source.key,
      source: source.name,
      parsedStatus: pollResult.parsedStatus,
      currentStatusDetail: pollResult.currentStatusDetail,
      checkOk: true,
      payload: pollResult.payload,
      summary: pollResult.summary,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown polling error";

    await ctx.runMutation(internal.polling.recordPoll.recordPoll, {
      dataSourceKey: source.key,
      source: source.name,
      parsedStatus: "error",
      currentStatusDetail: message,
      checkOk: false,
      error: message,
      payload: JSON.stringify({ error: message }),
      summary: `Poll failed: ${message}`,
    });
  }
}

export const runPolls = internalAction({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const sources = await ctx.runQuery(internal.polling.listEnabled.listEnabledSources);

    for (const source of sources) {
      await executePoll(ctx, source);
    }

    return null;
  },
});

export const runSource = internalAction({
  args: {
    key: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const sources = await ctx.runQuery(internal.polling.listEnabled.listEnabledSources);
    const source = sources.find((item) => item.key === args.key);

    if (!source) {
      throw new Error(`Enabled data source not found: ${args.key}`);
    }

    await executePoll(ctx, source);
    return null;
  },
});
