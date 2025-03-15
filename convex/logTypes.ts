import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Define shared validators
const schemaFieldValidator = v.object({
  type: v.union(v.literal("string"), v.literal("number"), v.literal("boolean")),
  required: v.boolean(),
  min: v.optional(v.number()),
  max: v.optional(v.number()),
});

export const list = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const userId = identity.subject;
    return await ctx.db
      .query("logTypes")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    iconId: v.optional(v.id("icons")),
    quantities: v.object({
      fields: v.record(
        v.string(),
        v.object({
          unit: v.string(),
          presets: v.optional(v.array(v.string())),
        }),
      ),
    }),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    return await ctx.db.insert("logTypes", {
      userId: identity.subject,
      ...args,
    });
  },
});

export const createDefaultTypes = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    const userId = identity.subject;

    // Exercise - tracks duration, distance, and calories
    await ctx.db.insert("logTypes", {
      userId,
      name: "Exercise",
      quantities: {
        fields: {
          duration: {
            unit: "minutes",
            presets: ["15", "30", "45", "60", "90"],
          },
          distance: {
            unit: "km",
            presets: ["1", "2", "3", "5", "10"],
          },
          calories: {
            unit: "kcal",
            presets: ["100", "200", "300", "500"],
          },
        },
      },
    });

    // Weight Training - tracks sets, reps, and weight
    await ctx.db.insert("logTypes", {
      userId,
      name: "Weight Training",
      quantities: {
        fields: {
          sets: {
            unit: "sets",
            presets: ["3", "4", "5"],
          },
          reps: {
            unit: "reps",
            presets: ["8", "10", "12", "15"],
          },
          weight: {
            unit: "kg",
            presets: ["5", "10", "15", "20", "25", "30"],
          },
        },
      },
    });

    // Food - tracks calories, protein, carbs, and fat
    await ctx.db.insert("logTypes", {
      userId,
      name: "Food",
      quantities: {
        fields: {
          calories: {
            unit: "kcal",
            presets: ["300", "500", "700", "1000"],
          },
          protein: {
            unit: "g",
            presets: ["20", "30", "40", "50"],
          },
          carbs: {
            unit: "g",
            presets: ["30", "50", "75", "100"],
          },
          fat: {
            unit: "g",
            presets: ["10", "20", "30", "40"],
          },
        },
      },
    });

    // Sleep - tracks duration and quality
    await ctx.db.insert("logTypes", {
      userId,
      name: "Sleep",
      quantities: {
        fields: {
          duration: {
            unit: "hours",
            presets: ["6", "7", "8", "9"],
          },
          quality: {
            unit: "rating",
            presets: ["1", "2", "3", "4", "5"],
          },
        },
      },
    });

    // Water - tracks volume
    await ctx.db.insert("logTypes", {
      userId,
      name: "Water",
      quantities: {
        fields: {
          amount: {
            unit: "ml",
            presets: ["250", "500", "750", "1000"],
          },
        },
      },
    });

    // Meditation - tracks duration and type
    await ctx.db.insert("logTypes", {
      userId,
      name: "Meditation",
      quantities: {
        fields: {
          duration: {
            unit: "minutes",
            presets: ["5", "10", "15", "20", "30"],
          },
          completed: {
            unit: "boolean",
          },
        },
      },
    });

    // Reading - tracks duration and pages
    await ctx.db.insert("logTypes", {
      userId,
      name: "Reading",
      quantities: {
        fields: {
          duration: {
            unit: "minutes",
            presets: ["15", "30", "45", "60"],
          },
          pages: {
            unit: "pages",
            presets: ["10", "25", "50", "100"],
          },
        },
      },
    });
  },
});

export const remove = mutation({
  args: { id: v.id("logTypes") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const logType = await ctx.db.get(args.id);
    if (!logType || logType.userId !== identity.subject) {
      throw new Error("Not authorized");
    }

    // Delete all logs of this type
    const logs = await ctx.db
      .query("logs")
      .withIndex("by_type_and_user", (q) =>
        q.eq("typeId", args.id).eq("userId", identity.subject),
      )
      .collect();

    for (const log of logs) {
      await ctx.db.delete(log._id);
    }

    // Delete the log type
    await ctx.db.delete(args.id);
  },
});

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    return await ctx.storage.generateUploadUrl();
  },
});

export const update = mutation({
  args: {
    id: v.id("logTypes"),
    name: v.string(),
    iconId: v.optional(v.id("icons")),
    quantities: v.object({
      fields: v.record(
        v.string(),
        v.object({
          unit: v.string(),
          presets: v.optional(v.array(v.string())),
        }),
      ),
    }),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const { id, ...updates } = args;
    const logType = await ctx.db.get(id);
    if (!logType || logType.userId !== identity.subject) {
      throw new Error("Not authorized");
    }

    await ctx.db.patch(id, updates);
  },
});
