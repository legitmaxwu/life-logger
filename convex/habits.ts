import { mutation, query, QueryCtx } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const userId = identity.subject;
    return await ctx.db
      .query("habits")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
  },
});

export const create = mutation({
  args: {
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
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    return await ctx.db.insert("habits", {
      userId: identity.subject,
      ...args,
    });
  },
});

export const getStatuses = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return {};

    const userId = identity.subject;
    const habits = await ctx.db
      .query("habits")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const now = Date.now();
    const statuses: Record<
      Id<"habits">,
      { current: number; longest: number }
    > = {};

    for (const habit of habits) {
      const logs = await getLogsForHabit(ctx, habit, now);
      statuses[habit._id] = {
        current: calculateCurrentStreak(logs, habit),
        longest: calculateLongestStreak(logs, habit),
      };
    }

    return statuses;
  },
});

async function getLogsForHabit(
  ctx: QueryCtx,
  habit: { logTypeIds: Id<"logTypes">[]; userId: string },
  now: number,
) {
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);

  const thirtyDaysAgo = new Date(startOfDay);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Get logs for any of the habit's log types
  const logs = [];
  for (const logTypeId of habit.logTypeIds) {
    const typeLogs = await ctx.db
      .query("logs")
      .withIndex("by_type_and_user", (q) =>
        q.eq("typeId", logTypeId).eq("userId", habit.userId),
      )
      .filter((q) =>
        q.and(
          q.gte(q.field("timestamp"), thirtyDaysAgo.getTime()),
          q.lt(q.field("timestamp"), now),
        ),
      )
      .collect();
    logs.push(...typeLogs);
  }

  return logs;
}

interface Log {
  _id: Id<"logs">;
  typeId: Id<"logTypes">;
  userId: string;
  timestamp: number;
  values: Record<string, string>;
}

interface Habit {
  _id: Id<"habits">;
  userId: string;
  name: string;
  unit: string;
  logTypeIds: Id<"logTypes">[];
  field: string;
  interval: "day" | "week";
  rule: {
    operator: "gt" | "lt" | "eq";
    value: number;
  };
  iconId?: Id<"icons">;
}

function calculateDailyValue(logs: Log[], habit: Habit, date: Date): number {
  const dayLogs = logs.filter((log) => {
    const logDate = new Date(log.timestamp);
    return (
      logDate.getFullYear() === date.getFullYear() &&
      logDate.getMonth() === date.getMonth() &&
      logDate.getDate() === date.getDate()
    );
  });

  // Sum up all values for the tracked unit across all logs
  return dayLogs.reduce((total, log) => {
    const value = parseFloat(log.values[habit.unit] || "0");
    return total + (isNaN(value) ? 0 : value);
  }, 0);
}

function matchesRule(value: number, rule: Habit["rule"]): boolean {
  if (rule.operator === "gt") return value > rule.value;
  if (rule.operator === "lt") return value < rule.value;
  if (rule.operator === "eq") return value === rule.value;
  return false;
}

function calculateCurrentStreak(logs: Log[], habit: Habit): number {
  if (!logs.length) return 0;

  const now = new Date();
  now.setHours(0, 0, 0, 0);
  let currentStreak = 0;
  let checkDate = now;

  while (true) {
    const dayValue = calculateDailyValue(logs, habit, checkDate);
    if (matchesRule(dayValue, habit.rule)) {
      currentStreak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  return currentStreak;
}

function calculateLongestStreak(logs: Log[], habit: Habit): number {
  if (!logs.length) return 0;

  const dates = new Set(
    logs.map((log) => {
      const date = new Date(log.timestamp);
      date.setHours(0, 0, 0, 0);
      return date.getTime();
    }),
  );

  const sortedDates = Array.from(dates).sort();
  let longestStreak = 0;
  let currentStreak = 0;
  let lastDate: number | null = null;

  for (const date of sortedDates) {
    const dayValue = calculateDailyValue(logs, habit, new Date(date));

    if (matchesRule(dayValue, habit.rule)) {
      if (!lastDate || date - lastDate === 86400000) {
        currentStreak++;
      } else {
        currentStreak = 1;
      }
      longestStreak = Math.max(longestStreak, currentStreak);
    } else {
      currentStreak = 0;
    }
    lastDate = date;
  }

  return longestStreak;
}

export const remove = mutation({
  args: { id: v.id("habits") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const habit = await ctx.db.get(args.id);
    if (!habit || habit.userId !== identity.subject) {
      throw new Error("Not authorized");
    }

    await ctx.db.delete(args.id);
  },
});

export const update = mutation({
  args: {
    id: v.id("habits"),
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
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const { id, ...updates } = args;
    const habit = await ctx.db.get(id);
    if (!habit || habit.userId !== identity.subject) {
      throw new Error("Not authorized");
    }

    await ctx.db.patch(id, updates);
  },
});

export { calculateDailyValue };
