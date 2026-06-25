import { internalMutation } from "../_generated/server";
import { v } from "convex/values";
import { parsedStatusValidator } from "../lib/pollStatus";

export const recordPoll = internalMutation({
  args: {
    dataSourceKey: v.string(),
    source: v.string(),
    parsedStatus: parsedStatusValidator,
    currentStatusDetail: v.optional(v.string()),
    checkOk: v.boolean(),
    error: v.optional(v.string()),
    payload: v.string(),
    summary: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const fetchedAt = Date.now();

    await ctx.db.insert("pollSnapshots", {
      dataSourceKey: args.dataSourceKey,
      source: args.source,
      fetchedAt,
      payload: args.payload,
      summary: args.summary,
      parsedStatus: args.parsedStatus,
      checkOk: args.checkOk,
      error: args.error,
    });

    const dataSource = await ctx.db
      .query("dataSources")
      .withIndex("by_key", (q) => q.eq("key", args.dataSourceKey))
      .unique();

    if (!dataSource) {
      throw new Error(`Data source not found: ${args.dataSourceKey}`);
    }

    await ctx.db.patch("dataSources", dataSource._id, {
      currentStatus: args.parsedStatus,
      currentStatusDetail: args.currentStatusDetail,
      lastCheckedAt: fetchedAt,
      lastError: args.checkOk ? undefined : args.error,
    });

    return null;
  },
});
