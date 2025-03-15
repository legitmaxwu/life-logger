import { useState, useEffect } from "react";
import { useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { LogType } from "@/types";
import { Id } from "../convex/_generated/dataModel";

interface LogEntryFormProps {
  logType: LogType;
  existingLog?: {
    _id: Id<"logs">;
    values: Record<string, string>;
    notes?: string;
  };
  onComplete: () => void;
}

export default function LogEntryForm({
  logType,
  existingLog,
  onComplete,
}: LogEntryFormProps) {
  const createLog = useMutation(api.logs.create);
  const updateLog = useMutation(api.logs.update);
  const [values, setValues] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string>();

  useEffect(() => {
    if (existingLog) {
      setValues(existingLog.values);
      setNotes(existingLog.notes || "");
    }
  }, [existingLog]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(undefined);
    try {
      if (existingLog) {
        await updateLog({
          id: existingLog._id,
          values,
          notes: notes || undefined,
        });
      } else {
        await createLog({
          typeId: logType._id,
          values,
          notes: notes || undefined,
        });
      }
      onComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-4">
        <h3 className="font-handwriting text-lg text-pencil">{logType.name}</h3>

        {Object.entries(logType.quantities.fields).map(
          ([fieldName, config]) => (
            <div key={fieldName} className="space-y-2">
              <label className="font-notebook text-sm text-pencil/70">
                {fieldName}
              </label>

              {config.presets && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {config.presets.map((preset) => (
                    <Button
                      key={preset}
                      type="button"
                      variant="outline"
                      onClick={() =>
                        setValues((prev) => ({
                          ...prev,
                          [fieldName]: preset,
                        }))
                      }
                      className={
                        values[fieldName] === preset
                          ? "bg-highlight/10 border-highlight"
                          : ""
                      }
                    >
                      {preset} {config.unit}
                    </Button>
                  ))}
                </div>
              )}

              <div className="flex gap-2 items-center">
                {config.unit === "boolean" ? (
                  <Button
                    type="button"
                    onClick={() =>
                      setValues((prev) => ({
                        ...prev,
                        [fieldName]: prev[fieldName] === "done" ? "" : "done",
                      }))
                    }
                    variant={
                      values[fieldName] === "done" ? "default" : "outline"
                    }
                  >
                    {values[fieldName] === "done" ? "Done" : "Mark as Done"}
                  </Button>
                ) : (
                  <>
                    <Input
                      type="number"
                      value={values[fieldName] || ""}
                      onChange={(e) =>
                        setValues((prev) => ({
                          ...prev,
                          [fieldName]: e.target.value,
                        }))
                      }
                      placeholder={`Enter ${fieldName}`}
                      className="font-notebook"
                      required
                    />
                    <span className="font-notebook text-pencil/70">
                      {config.unit}
                    </span>
                  </>
                )}
              </div>
            </div>
          ),
        )}

        <div className="space-y-2">
          <label className="font-notebook text-sm text-pencil/70">
            Notes (optional)
          </label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add any notes..."
            className="font-notebook"
          />
        </div>
      </div>

      <div className="flex justify-end">
        <Button
          type="submit"
          className="font-notebook bg-highlight hover:bg-highlight/90"
        >
          {existingLog ? "Update Log" : "Add Log"}
        </Button>
      </div>

      {error && (
        <div className="text-red-500 text-sm font-notebook">{error}</div>
      )}
    </form>
  );
}
