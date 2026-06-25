import { internalQuery } from "../_generated/server";
import { v } from "convex/values";
import {
  dataSourceConfigValidator,
  parsedStatusValidator,
} from "../lib/pollStatus";

const dataSourceReturnValidator = v.object({
  key: v.string(),
  name: v.string(),
  url: v.string(),
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
      currentStatus: source.currentStatus,
      currentStatusDetail: source.currentStatusDetail ?? null,
      lastCheckedAt: source.lastCheckedAt ?? null,
      lastError: source.lastError ?? null,
      enabled: source.enabled,
      config: source.config ?? null,
    }));
  },
});
