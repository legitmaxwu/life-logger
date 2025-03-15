import { useState, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import LogEntryForm from "./LogEntryForm";
import { Button } from "@/components/ui/button";
import { PlusCircle, Trash2 } from "lucide-react";
import { LogType } from "@/types";
import LogTypeIcon from "./LogTypeIcon";
import { Id } from "../convex/_generated/dataModel";

interface GroupedLogs {
  [date: string]: {
    timestamp: number;
    logs: Array<{
      _id: Id<"logs">;
      typeId: Id<"logTypes">;
      timestamp: number;
      values: Record<string, string>;
      notes?: string;
    }>;
  };
}

export default function LogsView() {
  const [showLogForm, setShowLogForm] = useState(false);
  const [selectedLogType, setSelectedLogType] = useState<LogType | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const logs = useQuery(api.logs.list) || [];
  const logTypes = useQuery(api.logTypes.list) || [];
  const deleteLog = useMutation(api.logs.remove);

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-handwriting text-pencil/90">
            Activity Logs
          </h2>
          <div className="text-sm font-notebook text-pencil/50 mt-1">
            {currentTime.toLocaleString(undefined, {
              weekday: "long",
              month: "long",
              day: "numeric",
              hour: "numeric",
              minute: "numeric",
            })}
          </div>
        </div>
        <Button
          size="sm"
          className="font-notebook bg-highlight hover:bg-highlight/90 text-paper border-none shadow-sm"
          onClick={() => setShowLogForm(true)}
        >
          <PlusCircle className="w-4 h-4 mr-1.5" />
          Add Log
        </Button>
      </div>

      {showLogForm && (
        <div className="p-6 border-pencil/10 bg-paper/50 rounded-lg">
          {selectedLogType ? (
            <LogEntryForm
              logType={selectedLogType}
              onComplete={() => {
                setShowLogForm(false);
                setSelectedLogType(null);
              }}
            />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {logTypes.map((type) => (
                <Button
                  key={type._id}
                  variant="outline"
                  className="font-notebook text-left justify-start h-auto py-3"
                  onClick={() => setSelectedLogType(type)}
                >
                  <div className="flex items-center gap-3">
                    <LogTypeIcon iconId={type.iconId} className="w-6 h-6" />
                    <div className="font-medium">{type.name}</div>
                  </div>
                </Button>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="relative">
        <div className="absolute left-8 top-0 bottom-0 w-px bg-highlight/10" />

        {logs.length === 0 ? (
          <div className="text-center py-12">
            <p className="font-notebook text-pencil/60 italic">
              No logs yet. Start tracking your activities!
            </p>
          </div>
        ) : (
          <div>
            {logs.map((log) => (
              <LogItem
                key={log._id}
                log={log}
                logTypes={logTypes}
                onDelete={() => deleteLog({ id: log._id })}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function LogItem({
  log,
  logTypes,
  onDelete,
}: {
  log: {
    _id: Id<"logs">;
    typeId: Id<"logTypes">;
    timestamp: number;
    values: Record<string, string>;
    notes?: string;
  };
  logTypes: LogType[];
  onDelete: () => void;
}) {
  const logType = logTypes.find((type) => type._id === log.typeId);
  if (!logType) return null;

  const formattedDate = new Date(log.timestamp).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
  });

  return (
    <div className="relative pl-8 py-3 border-b border-pencil/10 group hover:bg-pencil/[0.02] transition-colors">
      <div className="absolute left-0 top-0 bottom-0 w-px bg-highlight/10" />

      <div className="space-y-1">
        <div className="flex items-baseline justify-between gap-3">
          <div className="flex items-center gap-3 flex-1">
            <LogTypeIcon iconId={logType.iconId} />

            <div className="flex items-baseline gap-3">
              <h3 className="font-handwriting text-lg text-pencil">
                {logType.name}
              </h3>
              <time className="text-xs font-notebook text-pencil/40">
                {formattedDate}
              </time>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="opacity-0 group-hover:opacity-100 transition-opacity text-pencil/40 hover:text-pencil/60 hover:bg-pencil/5 h-6 w-6"
            onClick={onDelete}
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>

        <div className="font-notebook text-base text-pencil/80 ml-11">
          {Object.entries(log.values).map(([field, value]) => (
            <div key={field}>
              {field}: {value} {logType.quantities.fields[field]?.unit}
            </div>
          ))}
          {log.notes && (
            <div className="text-sm text-pencil/60 mt-1">{log.notes}</div>
          )}
        </div>
      </div>
    </div>
  );
}
