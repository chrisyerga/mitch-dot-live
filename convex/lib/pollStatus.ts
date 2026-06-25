import { v } from "convex/values";

export const parsedStatusValidator = v.union(
  v.literal("alive"),
  v.literal("deceased"),
  v.literal("unknown"),
  v.literal("error"),
);

export type ParsedStatus =
  | "alive"
  | "deceased"
  | "unknown"
  | "error";

export const dataSourceConfigValidator = v.object({
  wikidataEntityId: v.optional(v.string()),
  googleKgmid: v.optional(v.string()),
  deathProperty: v.optional(v.string()),
  wikipediaPageTitle: v.optional(v.string()),
  bioguideId: v.optional(v.string()),
  allowedDomains: v.optional(v.array(v.string())),
  searchQuery: v.optional(v.string()),
  xQuery: v.optional(v.string()),
  maxAgeHours: v.optional(v.number()),
  rumorThreshold: v.optional(v.number()),
});

export type DataSourceConfig = {
  wikidataEntityId?: string;
  googleKgmid?: string;
  deathProperty?: string;
  wikipediaPageTitle?: string;
  bioguideId?: string;
  allowedDomains?: string[];
  searchQuery?: string;
  xQuery?: string;
  maxAgeHours?: number;
  rumorThreshold?: number;
};

export type PollResult = {
  parsedStatus: ParsedStatus;
  currentStatusDetail: string;
  payload: string;
  summary: string;
};

export type EnabledDataSource = {
  key: string;
  name: string;
  config: DataSourceConfig | null;
};
