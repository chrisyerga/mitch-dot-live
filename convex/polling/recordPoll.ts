import type { MutationCtx } from "../_generated/server";
import { internalMutation } from "../_generated/server";
import { v } from "convex/values";
import { parsedStatusValidator } from "../lib/pollStatus";

export const pollRecordValidator = v.object({
  dataSourceKey: v.string(),
  source: v.string(),
  parsedStatus: parsedStatusValidator,
  currentStatusDetail: v.optional(v.string()),
  checkOk: v.boolean(),
  error: v.optional(v.string()),
  payload: v.string(),
  summary: v.optional(v.string()),
});

export type PollRecord = {
  dataSourceKey: string;
  source: string;
  parsedStatus: "alive" | "deceased" | "unknown" | "error";
  currentStatusDetail?: string;
  checkOk: boolean;
  error?: string;
  payload: string;
  summary?: string;
};

async function applyPollRecord(
  ctx: MutationCtx,
  record: PollRecord,
  fetchedAt: number,
): Promise<void> {
  await ctx.db.insert("pollSnapshots", {
    dataSourceKey: record.dataSourceKey,
    source: record.source,
    fetchedAt,
    payload: record.payload,
    summary: record.summary,
    parsedStatus: record.parsedStatus,
    checkOk: record.checkOk,
    error: record.error,
  });

  const dataSource = await ctx.db
    .query("dataSources")
    .withIndex("by_key", (q) => q.eq("key", record.dataSourceKey))
    .unique();

  if (!dataSource) {
    throw new Error(`Data source not found: ${record.dataSourceKey}`);
  }

  await ctx.db.patch("dataSources", dataSource._id, {
    currentStatus: record.parsedStatus,
    currentStatusDetail: record.currentStatusDetail,
    lastCheckedAt: fetchedAt,
    lastError: record.checkOk ? undefined : record.error,
  });
}

export const recordPoll = internalMutation({
  args: pollRecordValidator,
  returns: v.null(),
  handler: async (ctx, args) => {
    await applyPollRecord(ctx, args, Date.now());
    return null;
  },
});

export const recordPollBatch = internalMutation({
  args: {
    records: v.array(pollRecordValidator),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const fetchedAt = Date.now();

    for (const record of args.records) {
      await applyPollRecord(ctx, record, fetchedAt);
    }

    return null;
  },
});
