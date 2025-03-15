import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// The schema is entirely optional.
// You can delete this file (schema.ts) and the
// app will continue to work.
// The schema provides more precise TypeScript types.
export default defineSchema({
  logTypes: defineTable({
    userId: v.string(),
    name: v.string(),
    iconId: v.optional(v.id("icons")),

    // Replace format/unit with quantities
    quantities: v.object({
      // Each key is the quantity name (duration, calories, etc)
      // Value is the configuration for that quantity
      fields: v.record(
        v.string(),
        v.object({
          unit: v.string(),
          presets: v.optional(v.array(v.string())),
        }),
      ),
    }),
  }).index("by_user", ["userId"]),

  logs: defineTable({
    userId: v.string(),
    typeId: v.id("logTypes"),
    timestamp: v.number(),
    // Replace single value with values object
    values: v.record(v.string(), v.string()),
    notes: v.optional(v.string()),
  })
    .index("by_user", ["userId"])
    .index("by_type_and_user", ["typeId", "userId"])
    .index("by_timestamp", ["timestamp"]),

  streaks: defineTable({
    userId: v.string(),
    name: v.string(),
    logTypeId: v.id("logTypes"),
    interval: v.union(v.literal("day"), v.literal("week")),
    rule: v.object({
      field: v.string(),
      operator: v.union(
        v.literal("exists"),
        v.literal("gt"),
        v.literal("lt"),
        v.literal("eq"),
      ),
      value: v.optional(v.any()),
    }),
  }).index("by_user", ["userId"]),

  habits: defineTable({
    userId: v.string(),
    name: v.string(),
    unit: v.string(),
    logTypeIds: v.array(v.id("logTypes")),
    field: v.string(),
    interval: v.union(v.literal("day"), v.literal("week")),
    rule: v.object({
      operator: v.union(v.literal("gt"), v.literal("lt"), v.literal("eq")),
      value: v.number(),
    }),
    iconId: v.optional(v.id("icons")),
  }).index("by_user", ["userId"]),

  icons: defineTable({
    userId: v.string(),
    name: v.string(),
    storageId: v.id("_storage"),
    // Track which log types are using this icon
    usageCount: v.number(),
  }).index("by_user", ["userId"]),
});
