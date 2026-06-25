import { paginationOptsValidator } from "convex/server";
import { query } from "./_generated/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { parsedStatusValidator } from "./lib/pollStatus";

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
    paginationOpts: paginationOptsValidator,
  },
  returns: v.object({
    page: v.array(pollSnapshotReturnValidator),
    isDone: v.boolean(),
    continueCursor: v.union(v.string(), v.null()),
  }),
  handler: async (ctx, args) => {
    const results = args.dataSourceKey
      ? await ctx.db
          .query("pollSnapshots")
          .withIndex("by_data_source_and_time", (q) =>
            q.eq("dataSourceKey", args.dataSourceKey!),
          )
          .order("desc")
          .paginate(args.paginationOpts)
      : await ctx.db
          .query("pollSnapshots")
          .order("desc")
          .paginate(args.paginationOpts);

    return {
      page: results.page.map(toPollSnapshotReturn),
      isDone: results.isDone,
      continueCursor: results.continueCursor,
    };
  },
});
