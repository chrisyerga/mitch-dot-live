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
});
