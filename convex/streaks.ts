import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { DataModel } from "./_generated/dataModel";
import { DatabaseReader } from "./_generated/server";
import { QueryCtx } from "./_generated/server";

// Define type-safe argument validators
const intervalValidator = v.union(v.literal("day"), v.literal("week"));
const operatorValidator = v.union(
  v.literal("exists"),
  v.literal("gt"),
  v.literal("lt"),
  v.literal("eq"),
);

export const list = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    const userId = identity.subject;
    const streaks = await ctx.db
      .query("streaks")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    return streaks;
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    logTypeId: v.id("logTypes"),
    interval: intervalValidator,
    rule: v.object({
      field: v.string(),
      operator: operatorValidator,
      value: v.optional(v.any()),
    }),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const userId = identity.subject;

    const streakId = await ctx.db.insert("streaks", {
      userId,
      name: args.name,
      logTypeId: args.logTypeId,
      interval: args.interval,
      rule: args.rule,
    });

    return streakId;
  },
});

export const getStatus = query({
  args: {
    streakId: v.id("streaks"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return { current: 0, longest: 0 };
    }

    const userId = identity.subject;

    const streak = await ctx.db.get(args.streakId);
    if (!streak || streak.userId !== userId) {
      return { current: 0, longest: 0 };
    }

    const logs = await ctx.db
      .query("logs")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("typeId"), streak.logTypeId))
      .collect();

    // Calculate current and longest streak
    const now = new Date();
    const today = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    ).getTime();
    const yesterday = today - 86400000; // 24 hours in milliseconds

    // Check if there's a log for today that meets the streak rule
    const hasLogToday = logs.some((log) => {
      const logDate = new Date(log.timestamp).setHours(0, 0, 0, 0);
      return logDate === today && checkRule(log, streak.rule);
    });

    // Find the most recent streak
    let currentStreak = hasLogToday ? 1 : 0;
    let checkDate = yesterday;

    while (currentStreak > 0) {
      const hasLogOnDate = logs.some((log) => {
        const logDate = new Date(log.timestamp).setHours(0, 0, 0, 0);
        return logDate === checkDate && checkRule(log, streak.rule);
      });

      if (hasLogOnDate) {
        currentStreak++;
        checkDate -= 86400000; // Go back one day
      } else {
        break;
      }
    }

    // Find the longest streak
    let longestStreak = currentStreak;
    let currentRun = 0;
    let lastDate = null;

    // Sort logs by date
    const sortedLogs = [...logs]
      .filter((log) => checkRule(log, streak.rule))
      .sort((a, b) => a.timestamp - b.timestamp);

    for (const log of sortedLogs) {
      const logDate = new Date(log.timestamp).setHours(0, 0, 0, 0);

      if (lastDate === null || logDate === lastDate) {
        // Same day, continue current run
        if (currentRun === 0) currentRun = 1;
      } else if (logDate === lastDate + 86400000) {
        // Next day, continue streak
        currentRun++;
      } else {
        // Gap in streak, reset
        currentRun = 1;
      }

      lastDate = logDate;
      longestStreak = Math.max(longestStreak, currentRun);
    }

    return {
      current: currentStreak,
      longest: longestStreak,
    };
  },
});

// Helper function to check if a log meets a streak rule
function checkRule(
  log: any,
  rule: { field: string; operator: "exists" | "gt" | "lt" | "eq"; value?: any },
) {
  if (rule.operator === "exists") return log.value === "done";
  const value = parseFloat(log.value);
  if (isNaN(value)) return false;

  if (rule.operator === "gt") return value > rule.value;
  if (rule.operator === "lt") return value < rule.value;
  if (rule.operator === "eq") return value === rule.value;
  return false;
}

export const remove = mutation({
  args: { streakId: v.id("streaks") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const streak = await ctx.db.get(args.streakId);
    if (!streak || streak.userId !== identity.subject) {
      throw new Error("Not authorized");
    }

    await ctx.db.delete(args.streakId);
  },
});

export const getHistory = query({
  args: {
    streakId: v.id("streaks"),
    days: v.number(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const streak = await ctx.db.get(args.streakId);
    if (!streak || streak.userId !== identity.subject) {
      throw new Error("Not authorized");
    }

    const now = new Date();
    const history = [];

    // Start from (days-1) days ago and move forward to today
    for (let i = 0; i < args.days; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() - (args.days - 1) + i);
      date.setHours(0, 0, 0, 0);
      const nextDate = new Date(date.getTime() + 24 * 60 * 60 * 1000);

      const logs = await ctx.db
        .query("logs")
        .withIndex("by_type_and_user", (q) =>
          q.eq("typeId", streak.logTypeId).eq("userId", identity.subject),
        )
        .filter((q) =>
          q.and(
            q.gte(q.field("timestamp"), date.getTime()),
            q.lt(q.field("timestamp"), nextDate.getTime()),
          ),
        )
        .collect();

      const count = logs.filter((log) => matchesRule(log, streak.rule)).length;

      history.push({
        date: date.toISOString().split("T")[0],
        count,
      });
    }

    return history;
  },
});

function matchesRule(log: any, rule: any) {
  if (rule.operator === "exists") return log.value === "done";
  const value = parseFloat(log.value);
  if (isNaN(value)) return false;

  if (rule.operator === "gt") return value > rule.value;
  if (rule.operator === "lt") return value < rule.value;
  if (rule.operator === "eq") return value === rule.value;
  return false;
}

export const getStatuses = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return {};

    const userId = identity.subject;
    const streaks = await ctx.db
      .query("streaks")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const now = Date.now();
    const statuses: Record<
      Id<"streaks">,
      { current: number; longest: number }
    > = {};

    for (const streak of streaks) {
      const logs = await getLogsForStreak(ctx, streak, now);
      statuses[streak._id] = {
        current: calculateCurrentStreak(logs, streak),
        longest: calculateLongestStreak(logs, streak),
      };
    }

    return statuses;
  },
});

// Helper functions with proper typing
async function getLogsForStreak(
  ctx: QueryCtx,
  streak: { logTypeId: Id<"logTypes">; userId: string },
  now: number,
) {
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);

  const thirtyDaysAgo = new Date(startOfDay);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  return await ctx.db
    .query("logs")
    .withIndex("by_type_and_user", (q) =>
      q.eq("typeId", streak.logTypeId).eq("userId", streak.userId),
    )
    .filter((q) =>
      q.and(
        q.gte(q.field("timestamp"), thirtyDaysAgo.getTime()),
        q.lt(q.field("timestamp"), now),
      ),
    )
    .collect();
}

function calculateCurrentStreak(logs: any[], streak: any): number {
  if (!logs.length) return 0;

  // Sort logs by date descending
  const sortedLogs = [...logs].sort((a, b) => b.timestamp - a.timestamp);

  let currentStreak = 0;
  let lastDate = new Date(sortedLogs[0].timestamp);
  lastDate.setHours(0, 0, 0, 0);

  for (const log of sortedLogs) {
    const logDate = new Date(log.timestamp);
    logDate.setHours(0, 0, 0, 0);

    // If this log meets the streak rule
    if (matchesRule(log, streak.rule)) {
      if (currentStreak === 0) {
        currentStreak = 1;
      } else {
        // Check if this log is from the previous day
        const expectedDate = new Date(lastDate);
        expectedDate.setDate(expectedDate.getDate() - 1);
        if (logDate.getTime() === expectedDate.getTime()) {
          currentStreak++;
          lastDate = logDate;
        } else {
          break; // Streak is broken
        }
      }
    }
  }

  return currentStreak;
}

function calculateLongestStreak(logs: any[], streak: any): number {
  if (!logs.length) return 0;

  // Sort logs by date ascending
  const sortedLogs = [...logs].sort((a, b) => a.timestamp - b.timestamp);

  let longestStreak = 0;
  let currentStreak = 0;
  let lastDate: Date | null = null;

  for (const log of sortedLogs) {
    if (!matchesRule(log, streak.rule)) continue;

    const logDate = new Date(log.timestamp);
    logDate.setHours(0, 0, 0, 0);

    if (!lastDate) {
      currentStreak = 1;
    } else {
      const expectedDate = new Date(lastDate);
      expectedDate.setDate(expectedDate.getDate() + 1);

      if (logDate.getTime() === expectedDate.getTime()) {
        currentStreak++;
      } else {
        currentStreak = 1;
      }
    }

    lastDate = logDate;
    longestStreak = Math.max(longestStreak, currentStreak);
  }

  return longestStreak;
}
