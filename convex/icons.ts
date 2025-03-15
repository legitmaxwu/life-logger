import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    return await ctx.db
      .query("icons")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .collect();
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    storageId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    return await ctx.db.insert("icons", {
      userId: identity.subject,
      name: args.name,
      storageId: args.storageId,
      usageCount: 1,
    });
  },
});

export const incrementUsage = mutation({
  args: { id: v.id("icons") },
  handler: async (ctx, args) => {
    const icon = await ctx.db.get(args.id);
    if (!icon) return;
    await ctx.db.patch(args.id, { usageCount: icon.usageCount + 1 });
  },
});

export const decrementUsage = mutation({
  args: { id: v.id("icons") },
  handler: async (ctx, args) => {
    const icon = await ctx.db.get(args.id);
    if (!icon) return;
    if (icon.usageCount <= 1) {
      // Delete the icon and its storage if no one is using it
      await ctx.storage.delete(icon.storageId);
      await ctx.db.delete(args.id);
    } else {
      await ctx.db.patch(args.id, { usageCount: icon.usageCount - 1 });
    }
  },
});

export const get = query({
  args: { id: v.id("icons") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});
