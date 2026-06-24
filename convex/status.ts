import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireAdminSession } from "./lib/auth";

const statusReturnValidator = v.object({
  isAlive: v.boolean(),
  updatedAt: v.number(),
  note: v.union(v.string(), v.null()),
});

export const get = query({
  args: {},
  returns: v.union(statusReturnValidator, v.null()),
  handler: async (ctx) => {
    const status = await ctx.db.query("status").first();
    if (!status) {
      return null;
    }

    return {
      isAlive: status.isAlive,
      updatedAt: status.updatedAt,
      note: status.note ?? null,
    };
  },
});

export const set = mutation({
  args: {
    token: v.string(),
    isAlive: v.boolean(),
    note: v.optional(v.string()),
  },
  returns: statusReturnValidator,
  handler: async (ctx, args) => {
    await requireAdminSession(ctx, args.token);

    const existing = await ctx.db.query("status").first();
    const updatedAt = Date.now();
    const patch = {
      isAlive: args.isAlive,
      updatedAt,
      note: args.note,
    };

    if (existing) {
      await ctx.db.patch("status", existing._id, patch);
    } else {
      await ctx.db.insert("status", patch);
    }

    return {
      isAlive: args.isAlive,
      updatedAt,
      note: args.note ?? null,
    };
  },
});
