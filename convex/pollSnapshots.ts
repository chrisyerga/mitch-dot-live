import { query } from "./_generated/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { parsedStatusValidator } from "./lib/pollStatus";

export const MAX_RECENT_SNAPSHOTS = 20;

const pollSnapshotReturnValidator = v.object({
  _id: v.id("pollSnapshots"),
  dataSourceKey: v.string(),
  source: v.string(),
  fetchedAt: v.number(),
  summary: v.union(v.string(), v.null()),
  parsedStatus: parsedStatusValidator,
  checkOk: v.boolean(),
  error: v.union(v.string(), v.null()),
});

function toPollSnapshotReturn(snapshot: {
  _id: Id<"pollSnapshots">;
  dataSourceKey: string;
  source: string;
  fetchedAt: number;
  summary?: string;
  parsedStatus: "alive" | "deceased" | "unknown" | "error";
  checkOk: boolean;
  error?: string;
}) {
  return {
    _id: snapshot._id,
    dataSourceKey: snapshot.dataSourceKey,
    source: snapshot.source,
    fetchedAt: snapshot.fetchedAt,
    summary: snapshot.summary ?? null,
    parsedStatus: snapshot.parsedStatus,
    checkOk: snapshot.checkOk,
    error: snapshot.error ?? null,
  };
}

export const listRecent = query({
  args: {
    dataSourceKey: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  returns: v.array(pollSnapshotReturnValidator),
  handler: async (ctx, args) => {
    const limit = Math.max(
      1,
      Math.min(args.limit ?? MAX_RECENT_SNAPSHOTS, MAX_RECENT_SNAPSHOTS),
    );

    const snapshots = args.dataSourceKey
      ? await ctx.db
          .query("pollSnapshots")
          .withIndex("by_data_source_and_time", (q) =>
            q.eq("dataSourceKey", args.dataSourceKey!),
          )
          .order("desc")
          .take(limit)
      : await ctx.db
          .query("pollSnapshots")
          .withIndex("by_fetched_at")
          .order("desc")
          .take(limit);

    return snapshots.map(toPollSnapshotReturn);
  },
});
