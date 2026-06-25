import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireAdminSession } from "./lib/auth";

const statusReturnValidator = v.object({
  isAlive: v.boolean(),
  updatedAt: v.number(),
  note: v.union(v.string(), v.null()),
  message: v.union(v.string(), v.null()),
});

function toStatusReturn(status: {
  isAlive: boolean;
  updatedAt: number;
  note?: string;
  message?: string;
}) {
  const message = status.message?.trim();
  return {
    isAlive: status.isAlive,
    updatedAt: status.updatedAt,
    note: status.note ?? null,
    message: message ? message : null,
  };
}

export const get = query({
  args: {},
  returns: v.union(statusReturnValidator, v.null()),
  handler: async (ctx) => {
    const status = await ctx.db.query("status").first();
    if (!status) {
      return null;
    }

    return toStatusReturn(status);
  },
});

export const set = mutation({
  args: {
    token: v.string(),
    isAlive: v.boolean(),
    note: v.optional(v.string()),
    message: v.optional(v.string()),
  },
  returns: statusReturnValidator,
  handler: async (ctx, args) => {
    await requireAdminSession(ctx, args.token);

    const existing = await ctx.db.query("status").first();
    const updatedAt = Date.now();
    const next = {
      isAlive: args.isAlive,
      updatedAt,
      note: args.note ?? existing?.note,
      message: args.message ?? existing?.message,
    };

    if (existing) {
      await ctx.db.patch("status", existing._id, next);
    } else {
      await ctx.db.insert("status", next);
    }

    return toStatusReturn(next);
  },
});

export const setMessage = mutation({
  args: {
    token: v.string(),
    message: v.optional(v.string()),
  },
  returns: statusReturnValidator,
  handler: async (ctx, args) => {
    await requireAdminSession(ctx, args.token);

    const existing = await ctx.db.query("status").first();
    if (!existing) {
      throw new Error("Status not found");
    }

    const message = args.message?.trim() ? args.message.trim() : undefined;
    await ctx.db.patch("status", existing._id, { message });

    return toStatusReturn({
      ...existing,
      message,
    });
  },
});
