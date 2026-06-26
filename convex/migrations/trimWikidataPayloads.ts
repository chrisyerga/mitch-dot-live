import { internalMutation } from "../_generated/server";
import { v } from "convex/values";
import { internal } from "../_generated/api";
import {
  buildCompactWikidataPayload,
  parseEntityIdFromWikidataPayload,
  wikidataPayloadHasFullClaims,
} from "../polling/wikidata";

const DEFAULT_BATCH_SIZE = 50;

function compactDetail(snapshot: {
  parsedStatus: "alive" | "deceased" | "unknown" | "error";
  summary?: string;
  error?: string;
}): string {
  if (snapshot.parsedStatus === "error") {
    return snapshot.error ?? snapshot.summary ?? "poll error";
  }
  if (snapshot.summary) {
    return snapshot.summary;
  }
  if (snapshot.parsedStatus === "alive") {
    return "no P570 claim";
  }
  return snapshot.parsedStatus;
}

export const trimBatch = internalMutation({
  args: {
    batchSize: v.optional(v.number()),
    cursor: v.union(v.string(), v.null()),
  },
  returns: v.object({
    trimmed: v.number(),
    skipped: v.number(),
    done: v.boolean(),
    continueCursor: v.union(v.string(), v.null()),
  }),
  handler: async (ctx, args) => {
    const batchSize = Math.max(
      1,
      Math.min(args.batchSize ?? DEFAULT_BATCH_SIZE, 200),
    );
    let trimmed = 0;
    let skipped = 0;

    const page = await ctx.db
      .query("pollSnapshots")
      .withIndex("by_data_source_and_time", (q) =>
        q.eq("dataSourceKey", "wikidata"),
      )
      .paginate({ numItems: batchSize, cursor: args.cursor });

    for (const snapshot of page.page) {
      if (snapshot.parsedStatus === "deceased") {
        skipped += 1;
        continue;
      }

      if (!wikidataPayloadHasFullClaims(snapshot.payload)) {
        skipped += 1;
        continue;
      }

      const entityId = parseEntityIdFromWikidataPayload(snapshot.payload);
      await ctx.db.patch("pollSnapshots", snapshot._id, {
        payload: buildCompactWikidataPayload(
          entityId,
          snapshot.parsedStatus,
          compactDetail(snapshot),
        ),
      });
      trimmed += 1;
    }

    if (!page.isDone) {
      await ctx.scheduler.runAfter(
        0,
        internal.migrations.trimWikidataPayloads.trimBatch,
        {
          batchSize,
          cursor: page.continueCursor,
        },
      );
    }

    return {
      trimmed,
      skipped,
      done: page.isDone,
      continueCursor: page.isDone ? null : page.continueCursor,
    };
  },
});

/** One-time cleanup entrypoint. Schedules batched trims until all rows are processed. */
export const runAll = internalMutation({
  args: {
    batchSize: v.optional(v.number()),
  },
  returns: v.object({
    trimmed: v.number(),
    skipped: v.number(),
    done: v.boolean(),
  }),
  handler: async (ctx, args) => {
    const batchSize = args.batchSize ?? DEFAULT_BATCH_SIZE;

    await ctx.scheduler.runAfter(
      0,
      internal.migrations.trimWikidataPayloads.trimBatch,
      {
        batchSize,
        cursor: null,
      },
    );

    return { trimmed: 0, skipped: 0, done: false };
  },
});
