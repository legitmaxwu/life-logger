import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const userId = identity.subject;
    return await ctx.db
      .query("logs")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();
  },
});

export const create = mutation({
  args: {
    typeId: v.id("logTypes"),
    values: v.record(v.string(), v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    return await ctx.db.insert("logs", {
      userId: identity.subject,
      typeId: args.typeId,
      values: args.values,
      notes: args.notes,
      timestamp: Date.now(),
    });
  },
});

export const remove = mutation({
  args: { id: v.id("logs") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const log = await ctx.db.get(args.id);
    if (!log || log.userId !== identity.subject) {
      throw new Error("Not authorized");
    }

    await ctx.db.delete(args.id);
  },
});

export const getExistingLog = query({
  args: {
    typeId: v.id("logTypes"),
    timestamp: v.number(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const userId = identity.subject;
    const startOfDay = new Date(args.timestamp);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);

    return await ctx.db
      .query("logs")
      .withIndex("by_type_and_user", (q) =>
        q.eq("typeId", args.typeId).eq("userId", userId),
      )
      .filter((q) =>
        q.and(
          q.gte(q.field("timestamp"), startOfDay.getTime()),
          q.lt(q.field("timestamp"), endOfDay.getTime()),
        ),
      )
      .first();
  },
});

// Add update mutation
export const update = mutation({
  args: {
    id: v.id("logs"),
    values: v.record(v.string(), v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const { id, ...updates } = args;
    const log = await ctx.db.get(id);
    if (!log || log.userId !== identity.subject) {
      throw new Error("Not authorized");
    }

    await ctx.db.patch(id, updates);
  },
});
