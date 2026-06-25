import { internalQuery } from "../_generated/server";
import { v } from "convex/values";
import {
  dataSourceConfigValidator,
  parsedStatusValidator,
} from "../lib/pollStatus";
import { seedDataSources } from "../lib/seedDataSources";

function resolveConfidence(source: { key: string; confidence?: number }): number {
  if (source.confidence != null) {
    return source.confidence;
  }
  return seedDataSources.find((item) => item.key === source.key)?.confidence ?? 0;
}

const dataSourceReturnValidator = v.object({
  key: v.string(),
  name: v.string(),
  url: v.string(),
  confidence: v.number(),
  currentStatus: parsedStatusValidator,
  currentStatusDetail: v.union(v.string(), v.null()),
  lastCheckedAt: v.union(v.number(), v.null()),
  lastError: v.union(v.string(), v.null()),
  enabled: v.boolean(),
  config: v.union(dataSourceConfigValidator, v.null()),
});

export const listEnabledSources = internalQuery({
  args: {},
  returns: v.array(dataSourceReturnValidator),
  handler: async (ctx) => {
    const sources = await ctx.db
      .query("dataSources")
      .withIndex("by_enabled", (q) => q.eq("enabled", true))
      .collect();

    return sources.map((source) => ({
      key: source.key,
      name: source.name,
      url: source.url,
      confidence: resolveConfidence(source),
      currentStatus: source.currentStatus,
      currentStatusDetail: source.currentStatusDetail ?? null,
      lastCheckedAt: source.lastCheckedAt ?? null,
      lastError: source.lastError ?? null,
      enabled: source.enabled,
      config: source.config ?? null,
    }));
  },
});
