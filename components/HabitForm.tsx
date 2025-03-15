import React, { useState } from "react";
import { useMutation } from "convex/react";
import { cn } from "../lib/utils";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { api } from "../convex/_generated/api";
import { LogType } from "@/types";
import { Id } from "../convex/_generated/dataModel";
import IconSelector from "./IconSelector";

interface HabitFormData {
  name: string;
  unit: string;
  logTypeIds: Id<"logTypes">[];
  field: string;
  interval: "day" | "week";
  rule: {
    operator: "gt" | "lt" | "eq";
    value: number;
  };
  iconId: Id<"icons"> | undefined;
}

interface HabitFormProps {
  logTypes: LogType[];
  onComplete: () => void;
  initialData?: {
    _id: Id<"habits">;
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
  };
}

export default function HabitForm({
  logTypes,
  onComplete,
  initialData,
}: HabitFormProps) {
  const createHabit = useMutation(api.habits.create);
  const updateHabit = useMutation(api.habits.update);
  const [selectedUnit, setSelectedUnit] = useState<string>(
    initialData?.unit ?? "",
  );
  const [formData, setFormData] = useState<HabitFormData>({
    name: initialData?.name ?? "",
    unit: initialData?.unit ?? "",
    logTypeIds: initialData?.logTypeIds ?? [],
    field: initialData?.field ?? "",
    interval: initialData?.interval ?? "day",
    rule: initialData?.rule ?? {
      operator: "gt",
      value: 0,
    },
    iconId: initialData?.iconId,
  });
  const [error, setError] = useState<string>();

  // Get all available units from log types
  const availableUnits = React.useMemo(() => {
    const units = new Set<string>();
    logTypes.forEach((type) => {
      Object.values(type.quantities.fields).forEach((field) => {
        units.add(field.unit);
      });
    });
    return Array.from(units);
  }, [logTypes]);

  // Get log types that track the selected unit
  const compatibleLogTypes = React.useMemo(() => {
    if (!selectedUnit) return [];
    return logTypes.filter((type) =>
      Object.values(type.quantities.fields).some(
        (field) => field.unit === selectedUnit,
      ),
    );
  }, [logTypes, selectedUnit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(undefined);
    try {
      if (initialData) {
        await updateHabit({
          id: initialData._id,
          ...formData,
        });
      } else {
        await createHabit(formData);
      }
      onComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>Name</Label>
        <Input
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="e.g. Daily Exercise"
          required
        />
      </div>

      <div className="space-y-2">
        <Label>Unit to Track</Label>
        <Select
          value={selectedUnit}
          onValueChange={(value) => {
            setSelectedUnit(value);
            setFormData((prev) => ({
              ...prev,
              unit: value,
              logTypeIds: [],
            }));
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a unit" />
          </SelectTrigger>
          <SelectContent>
            {availableUnits.map((unit) => (
              <SelectItem key={unit} value={unit}>
                {unit}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedUnit && (
        <div className="space-y-2">
          <Label>Activities that track {selectedUnit}</Label>
          <div className="grid grid-cols-2 gap-2">
            {compatibleLogTypes.map((type) => (
              <div
                key={type._id}
                className={cn(
                  "p-3 rounded-lg border border-pencil/10 cursor-pointer transition-colors",
                  formData.logTypeIds.includes(type._id)
                    ? "bg-highlight/10 border-highlight"
                    : "hover:bg-pencil/5",
                )}
                onClick={() => {
                  setFormData((prev) => {
                    const newIds = prev.logTypeIds.includes(type._id)
                      ? prev.logTypeIds.filter((id) => id !== type._id)
                      : [...prev.logTypeIds, type._id];
                    return {
                      ...prev,
                      logTypeIds: newIds,
                    };
                  });
                }}
              >
                <div className="font-notebook">{type.name}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedUnit && (
        <div className="space-y-2">
          <Label>Field to Track</Label>
          <Select
            value={formData.field}
            onValueChange={(value) =>
              setFormData({ ...formData, field: value })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select field to track" />
            </SelectTrigger>
            <SelectContent>
              {Array.from(
                new Set(
                  compatibleLogTypes.flatMap((type) =>
                    Object.entries(type.quantities.fields)
                      .filter(([_, config]) => config.unit === selectedUnit)
                      .map(([field]) => field),
                  ),
                ),
              ).map((field) => (
                <SelectItem key={field} value={field}>
                  {field} ({selectedUnit})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="space-y-2">
        <Label>Rule</Label>
        <div className="flex gap-2">
          {formData.logTypeIds.length > 0 && (
            <>
              <Select
                value={formData.rule.operator}
                onValueChange={(value: "gt" | "lt" | "eq") =>
                  setFormData({
                    ...formData,
                    rule: { ...formData.rule, operator: value },
                  })
                }
              >
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gt">Greater than</SelectItem>
                  <SelectItem value="lt">Less than</SelectItem>
                  <SelectItem value="eq">Equal to</SelectItem>
                </SelectContent>
              </Select>
              <Input
                type="number"
                value={isNaN(formData.rule.value) ? "" : formData.rule.value}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    rule: {
                      ...formData.rule,
                      value:
                        e.target.value === "" ? 0 : parseFloat(e.target.value),
                    },
                  })
                }
                className="w-24"
                required
              />
            </>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Interval</Label>
        <Select
          value={formData.interval}
          onValueChange={(value: "day" | "week") =>
            setFormData({ ...formData, interval: value })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="day">Daily</SelectItem>
            <SelectItem value="week">Weekly</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Icon (optional)</Label>
        <IconSelector
          selectedIconId={formData.iconId}
          onSelectIcon={(iconId) => setFormData({ ...formData, iconId })}
        />
      </div>

      {error && (
        <div className="text-red-500 text-sm font-notebook">{error}</div>
      )}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onComplete}>
          Cancel
        </Button>
        <Button type="submit" disabled={formData.logTypeIds.length === 0}>
          {initialData ? "Update" : "Create"} Habit
        </Button>
      </div>
    </form>
  );
}
