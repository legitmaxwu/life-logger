import React, { useState } from "react";
import { useQuery } from "react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PlusCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { HabitForm } from "@/components/HabitForm";
import { api } from "@/lib/api";

export default function ProgressView() {
  const [showForm, setShowForm] = useState(false);
  const logTypes = useQuery(api.logTypes.list) || [];
  const habits = useQuery(api.habits.list) || [];
  const habitStatuses = useQuery(api.habits.getStatuses) || {};

  const MAX_BLOCKS = 30; // Show last 30 days

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-handwriting text-pencil/90">
          Progress Tracking
        </h2>
        <Button
          size="sm"
          className="font-notebook bg-highlight hover:bg-highlight/90 text-paper border-none shadow-sm"
          onClick={() => setShowForm(!showForm)}
        >
          <PlusCircle className="w-4 h-4 mr-1.5" />
          Track New Habit
        </Button>
      </div>

      {showForm && (
        <Card className="p-6 border-pencil/10 bg-paper shadow-sm">
          <HabitForm
            logTypes={logTypes}
            onComplete={() => setShowForm(false)}
          />
        </Card>
      )}

      <div className="space-y-4">
        {habits.map((habit, i) => {
          const status = habitStatuses[habit._id];
          const current = status?.current || 0;
          const color = habitColors[i % habitColors.length];

          return (
            <div key={habit._id} className="relative">
              <div className="absolute left-0 top-1/2 -translate-y-1/2 pr-4 font-handwriting text-pencil/90">
                {habit.name}
                <div className="text-sm text-pencil/60">
                  {current} consecutive days
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
