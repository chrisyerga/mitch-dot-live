import { internalAction } from "../_generated/server";
import { v } from "convex/values";
import { internal } from "../_generated/api";
import { fetchWikidataEntity } from "./wikidata";

async function pollWikidataSource(source: {
  key: string;
  name: string;
  config: {
    wikidataEntityId?: string;
    deathProperty?: string;
  } | null;
}) {
  const entityId = source.config?.wikidataEntityId;
  if (!entityId) {
    throw new Error(`Missing wikidataEntityId for source ${source.key}`);
  }

  const result = await fetchWikidataEntity(entityId);
  return {
    parsedStatus: result.parsedStatus,
    currentStatusDetail: result.detail,
    payload: result.rawPayload,
    summary: result.payloadSummary,
  };
}

export const runPolls = internalAction({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const sources = await ctx.runQuery(internal.polling.listEnabled.listEnabledSources);

    for (const source of sources) {
      try {
        let pollResult: {
          parsedStatus: "alive" | "deceased" | "unknown" | "error";
          currentStatusDetail: string;
          payload: string;
          summary: string;
        };

        switch (source.key) {
          case "wikidata":
            pollResult = await pollWikidataSource(source);
            break;
          default:
            throw new Error(`Unsupported data source key: ${source.key}`);
        }

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

    try {
      let pollResult: {
        parsedStatus: "alive" | "deceased" | "unknown" | "error";
        currentStatusDetail: string;
        payload: string;
        summary: string;
      };

      switch (source.key) {
        case "wikidata":
          pollResult = await pollWikidataSource(source);
          break;
        default:
          throw new Error(`Unsupported data source key: ${source.key}`);
      }

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

    return null;
  },
});
