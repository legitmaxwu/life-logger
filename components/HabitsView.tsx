import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PlusCircle, Trash2, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { LogType } from "@/types";
import HabitForm from "./HabitForm";
import React from "react";
import { calculateDailyValue } from "../convex/habits";
import LogTypeIcon from "./LogTypeIcon";
import {
  HoverCard,
  HoverCardTrigger,
  HoverCardContent,
} from "@/components/ui/hover-card";

// Solid colors for completed days
const habitColors = [
  "#ff5555", // Red
  "#ffb86c", // Orange
  "#f1fa8c", // Yellow
  "#50fa7b", // Green
  "#8be9fd", // Cyan
  "#bd93f9", // Purple
  "#ff79c6", // Pink
];

function getColorStyle(
  color: string,
  value: number,
  target: number,
): React.CSSProperties {
  const intensity = Math.min(value / target, 2);
  const opacity = Math.max(0.2, Math.min(1, intensity * 0.6));

  // Convert Tailwind color to RGB values
  const rgbValues = {
    "#ff5555": "255, 85, 85", // Red
    "#ffb86c": "255, 184, 108", // Orange
    "#f1fa8c": "241, 250, 140", // Yellow
    "#50fa7b": "80, 250, 123", // Green
    "#8be9fd": "139, 233, 253", // Cyan
    "#bd93f9": "189, 147, 249", // Purple
    "#ff79c6": "255, 121, 198", // Pink
  }[color];

  return {
    backgroundColor: `rgba(${rgbValues}, ${opacity})`,
  };
}

export default function HabitsView() {
  const [showForm, setShowForm] = useState(false);
  const [editingHabit, setEditingHabit] = useState<any>(null);
  const logTypes = useQuery(api.logTypes.list) || [];
  const habits = useQuery(api.habits.list) || [];
  const habitStatuses = useQuery(api.habits.getStatuses) || {};
  const allLogs = useQuery(api.logs.list) || [];
  const deleteHabit = useMutation(api.habits.remove);

  // Group logs by habit
  const logsByHabit = React.useMemo(() => {
    const map = new Map();
    for (const habit of habits) {
      map.set(
        habit._id,
        allLogs.filter((log) => habit.logTypeIds.includes(log.typeId)),
      );
    }
    return map;
  }, [habits, allLogs]);

  // Get the value for a specific field from a log
  const getLogValue = (log: any, field: string) => {
    return parseFloat(log.values[field]) || 0;
  };

  // Calculate daily value considering all tracked fields
  const calculateDailyValue = (logs: any[], habit: any, date: Date) => {
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    const dayLogs = logs.filter(
      (log) =>
        log.timestamp >= dayStart.getTime() &&
        log.timestamp <= dayEnd.getTime(),
    );

    // Find the log type that matches this habit
    const logType = logTypes.find((t) => habit.logTypeIds.includes(t._id));
    if (!logType) return 0;

    // Use the selected field from the habit
    return dayLogs.reduce((sum, log) => sum + getLogValue(log, habit.field), 0);
  };

  const MAX_BLOCKS = 30; // Show last 30 days

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-handwriting text-pencil/90">
          Habit Tracking
        </h2>
        <Button
          size="sm"
          className="font-notebook bg-highlight hover:bg-highlight/90 text-paper border-none shadow-sm"
          onClick={() => {
            setEditingHabit(null);
            setShowForm(true);
          }}
        >
          <PlusCircle className="w-4 h-4 mr-1.5" />
          Track New Habit
        </Button>
      </div>

      {showForm && (
        <Card className="p-6 border-pencil/10 bg-paper shadow-sm">
          <HabitForm
            logTypes={logTypes}
            initialData={editingHabit}
            onComplete={() => {
              setShowForm(false);
              setEditingHabit(null);
            }}
          />
        </Card>
      )}

      <div className="space-y-4">
        {habits.map((habit, i) => {
          const status = habitStatuses[habit._id];
          const current = status?.current || 0;
          const color = habitColors[i % habitColors.length];
          const logType = logTypes.find((t) =>
            habit.logTypeIds.includes(t._id),
          );

          // Get names of log types that satisfy this habit
          const activityNames = logTypes
            .filter((type) => habit.logTypeIds.includes(type._id))
            .map((type) => type.name)
            .join(" or ");

          return (
            <div key={habit._id} className="relative group">
              <div className="absolute right-0 top-1/2 -translate-y-1/2">
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-pencil/40 hover:text-pencil/60 hover:bg-pencil/5 h-6 w-6"
                    onClick={() => {
                      setEditingHabit(habit);
                      setShowForm(true);
                    }}
                  >
                    <Settings className="w-3 h-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-pencil/40 hover:text-pencil/60 hover:bg-pencil/5 h-6 w-6"
                    onClick={() => deleteHabit({ id: habit._id })}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
              <div className="absolute left-0 top-1/2 -translate-y-1/2 pr-4 flex items-center gap-3">
                <HoverCard>
                  <HoverCardTrigger asChild>
                    <div className="flex items-center gap-3 cursor-help">
                      {logType && (
                        <LogTypeIcon
                          iconId={logType.iconId}
                          className="w-6 h-6"
                        />
                      )}
                      <div className="font-handwriting text-pencil/90">
                        {habit.name}
                      </div>
                    </div>
                  </HoverCardTrigger>
                  <HoverCardContent className="w-80">
                    <div className="space-y-2">
                      <div className="text-xs font-notebook text-pencil/60">
                        via {activityNames}
                      </div>
                      <div className="text-sm font-notebook text-pencil/60">
                        {current} consecutive days
                      </div>
                      <div className="text-sm font-notebook text-pencil/60">
                        Target: {habit.rule.value} {habit.unit} per day
                      </div>
                    </div>
                  </HoverCardContent>
                </HoverCard>
              </div>

              <div className="ml-48 flex gap-1">
                {Array.from({ length: MAX_BLOCKS }, (_, i) => {
                  const dayOffset = i;
                  const date = new Date();
                  date.setDate(date.getDate() - dayOffset);
                  const dayValue = calculateDailyValue(
                    logsByHabit.get(habit._id),
                    habit,
                    date,
                  );

                  return (
                    <div
                      key={i}
                      className={cn(
                        "w-6 h-6 rounded-sm transition-colors",
                        // Show empty style when there's no value OR when value is below target
                        (!dayValue || dayValue < habit.rule.value) &&
                          "bg-pencil/5 border border-pencil/10",
                      )}
                      style={
                        dayValue >= habit.rule.value
                          ? getColorStyle(color, dayValue, habit.rule.value)
                          : undefined
                      }
                      title={`${dayValue || 0} ${habit.unit}`}
                    />
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
