import { query } from "./_generated/server";
import { v } from "convex/values";
import {
  dataSourceConfigValidator,
  parsedStatusValidator,
} from "./lib/pollStatus";

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

function toDataSourceReturn(source: {
  key: string;
  name: string;
  url: string;
  currentStatus: "alive" | "deceased" | "unknown" | "error";
  currentStatusDetail?: string;
  lastCheckedAt?: number;
  lastError?: string;
  enabled: boolean;
  config?: {
    wikidataEntityId?: string;
    googleKgmid?: string;
    deathProperty?: string;
  };
}) {
  return {
    key: source.key,
    name: source.name,
    url: source.url,
    currentStatus: source.currentStatus,
    currentStatusDetail: source.currentStatusDetail ?? null,
    lastCheckedAt: source.lastCheckedAt ?? null,
    lastError: source.lastError ?? null,
    enabled: source.enabled,
    config: source.config ?? null,
  };
}

export const list = query({
  args: {},
  returns: v.array(dataSourceReturnValidator),
  handler: async (ctx) => {
    const sources = await ctx.db.query("dataSources").collect();
    return sources.map(toDataSourceReturn);
  },
});

export const getByKey = query({
  args: {
    key: v.string(),
  },
  returns: v.union(dataSourceReturnValidator, v.null()),
  handler: async (ctx, args) => {
    const source = await ctx.db
      .query("dataSources")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .unique();

    if (!source) {
      return null;
    }

    return toDataSourceReturn(source);
  },
});
