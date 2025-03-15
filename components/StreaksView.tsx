import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";
import StreakForm from "./StreakForm";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PlusCircle, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { LogType } from "@/types";

// Define types for our data structures
interface Streak {
  _id: Id<"streaks">;
  userId: string;
  name: string;
  logTypeId: Id<"logTypes">;
  interval: "day" | "week";
  rule: {
    field: string;
    operator: "exists" | "gt" | "lt" | "eq";
    value?: number;
  };
  target: number;
}

interface StreakStatus {
  current: number;
  longest: number;
}

// Add interfaces for our history data
interface Block {
  date: string;
  count: number;
}

interface DayData extends Block {}

interface WeekData extends Block {
  days: DayData[];
  count: number;
  date: string;
}

// Solid colors for completed days
const streakColors = [
  "bg-[#ff5555]",
  "bg-[#ffb86c]",
  "bg-[#f1fa8c]",
  "bg-[#50fa7b]",
  "bg-[#8be9fd]",
  "bg-[#bd93f9]",
  "bg-[#ff79c6]",
];

export default function StreaksView() {
  const [showForm, setShowForm] = useState(false);
  const logTypes = useQuery(api.logTypes.list) || [];
  const streaks = useQuery(api.streaks.list) || [];
  const streakStatuses = useQuery(api.streaks.getStatuses) || {};

  const MAX_BLOCKS = 30; // Show last 30 days

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-handwriting text-pencil/90">
          Progress Streaks
        </h2>
        <Button
          size="sm"
          className="font-notebook bg-highlight hover:bg-highlight/90 text-paper border-none shadow-sm"
          onClick={() => setShowForm(!showForm)}
        >
          <PlusCircle className="w-4 h-4 mr-1.5" />
          Create Streak
        </Button>
      </div>

      {showForm && (
        <Card className="p-6 border-pencil/10 bg-paper shadow-sm">
          <StreakForm
            logTypes={logTypes}
            onComplete={() => setShowForm(false)}
          />
        </Card>
      )}

      <div className="space-y-4">
        {streaks.map((streak, i) => {
          const status = streakStatuses[streak._id];
          const current = status?.current || 0;
          const color = streakColors[i % streakColors.length];

          return (
            <div key={streak._id} className="relative">
              <div className="absolute left-0 top-1/2 -translate-y-1/2 pr-4 font-handwriting text-pencil/90">
                {streak.name}
                <div className="text-sm text-pencil/60">
                  {current} day{current !== 1 ? "s" : ""}
                </div>
              </div>

              <div className="ml-48 flex gap-1">
                {Array.from({ length: MAX_BLOCKS }, (_, i) => (
                  <div
                    key={i}
                    className={cn(
                      "w-6 h-6 rounded-sm",
                      i < current
                        ? color
                        : "bg-pencil/5 border border-pencil/10",
                    )}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface StreakCardProps {
  streak: Streak;
  logTypes: LogType[];
}

function StreakCard({ streak, logTypes }: StreakCardProps) {
  const logType = logTypes.find((type) => type._id === streak.logTypeId);
  const deleteStreak = useMutation(api.streaks.remove);
  const streakHistory =
    useQuery(api.streaks.getHistory, {
      streakId: streak._id,
      days: streak.interval === "week" ? 49 : 28,
    }) || [];

  if (!logType) return null;

  // Don't reverse the blocks anymore - natural left to right
  const blocks =
    streak.interval === "week"
      ? groupIntoWeeks(streakHistory as DayData[])
      : (streakHistory as DayData[]);

  return (
    <div className="group">
      <div className="flex items-center gap-2 mb-1">
        <h3 className="font-handwriting text-base text-pencil">
          {streak.name}
        </h3>
        <Button
          variant="ghost"
          size="icon"
          className="opacity-0 group-hover:opacity-100 transition-opacity text-pencil/40 hover:text-pencil/60 hover:bg-pencil/5 h-6 w-6"
          onClick={() => deleteStreak({ streakId: streak._id })}
        >
          <Trash2 className="w-3 h-3" />
        </Button>
      </div>

      <div className="flex gap-px h-6">
        {blocks.map((block) => (
          <div
            key={block.date}
            className="flex-1"
            title={`${formatDate(block.date)}: ${block.count}/${streak.target}`}
          >
            {streak.interval === "week" ? (
              <div className="flex flex-col gap-px h-full">
                {(block as WeekData).days.map((day) => (
                  <div
                    key={day.date}
                    className={cn(
                      "flex-1 rounded-[1px] transition-colors",
                      !day.count && "bg-pencil/5",
                      day.count > 0 &&
                        block.count < streak.target &&
                        "bg-highlight/50",
                      day.count > 0 &&
                        block.count >= streak.target &&
                        "bg-highlight",
                    )}
                    title={`${formatDate(day.date)}: ${day.count} activities`}
                  />
                ))}
              </div>
            ) : (
              <div
                className={cn(
                  "h-full rounded-[1px] transition-colors",
                  !block.count && "bg-pencil/5",
                  block.count > 0 &&
                    block.count < streak.target &&
                    "bg-highlight/50",
                  block.count >= streak.target && "bg-highlight",
                )}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function groupIntoWeeks(days: DayData[]): WeekData[] {
  const weeks: WeekData[] = [];
  let currentWeek: WeekData = { days: [], count: 0, date: "" };

  for (const day of days) {
    const date = new Date(day.date);
    if (date.getDay() === 0 && currentWeek.days.length > 0) {
      weeks.push(currentWeek);
      currentWeek = { days: [], count: 0, date: day.date };
    }
    currentWeek.days.push(day);
    currentWeek.count += day.count;
    if (!currentWeek.date) currentWeek.date = day.date;
  }

  if (currentWeek.days.length > 0) {
    weeks.push(currentWeek);
  }

  return weeks;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function getCurrentStreak(blocks: (DayData | WeekData)[]): number {
  let streak = 0;
  for (const block of [...blocks].reverse()) {
    if (block.count > 0) streak++;
    else break;
  }
  return streak;
}
