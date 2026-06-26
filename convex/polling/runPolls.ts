import { internalAction } from "../_generated/server";
import { v } from "convex/values";
import { internal } from "../_generated/api";
import { pollSource } from "./pollSource";
import type { PollRecord } from "./recordPoll";
import type { EnabledDataSource } from "../lib/pollStatus";

async function pollToRecord(source: EnabledDataSource): Promise<PollRecord> {
  try {
    const pollResult = await pollSource(source);

    return {
      dataSourceKey: source.key,
      source: source.name,
      parsedStatus: pollResult.parsedStatus,
      currentStatusDetail: pollResult.currentStatusDetail,
      checkOk: true,
      payload: pollResult.payload,
      summary: pollResult.summary,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown polling error";

    return {
      dataSourceKey: source.key,
      source: source.name,
      parsedStatus: "error",
      currentStatusDetail: message,
      checkOk: false,
      error: message,
      payload: JSON.stringify({ error: message }),
      summary: `Poll failed: ${message}`,
    };
  }
}

export const runPolls = internalAction({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const sources = await ctx.runQuery(internal.polling.listEnabled.listEnabledSources);
    const records: PollRecord[] = [];

    for (const source of sources) {
      records.push(await pollToRecord(source));
    }

    if (records.length > 0) {
      await ctx.runMutation(internal.polling.recordPoll.recordPollBatch, {
        records,
      });
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
    const source = await ctx.runQuery(
      internal.polling.listEnabled.getPollSourceByKey,
      { key: args.key },
    );

    if (!source) {
      throw new Error(`Data source not found: ${args.key}`);
    }

    const record = await pollToRecord(source);
    await ctx.runMutation(internal.polling.recordPoll.recordPoll, record);
    return null;
  },
});
