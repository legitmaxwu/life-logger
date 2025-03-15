import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LogType } from "@/types";

interface StreakFormProps {
  logTypes: LogType[];
  onComplete: () => void;
}

export default function StreakForm({ logTypes, onComplete }: StreakFormProps) {
  const createStreak = useMutation(api.streaks.create);
  const [selectedTypeId, setSelectedTypeId] = useState<string>("");
  const [selectedField, setSelectedField] = useState<string>("");
  const selectedType = logTypes.find((t) => t._id === selectedTypeId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedType || !selectedField) return;

    await createStreak({
      name: selectedType.name,
      logTypeId: selectedType._id,
      interval: "day",
      rule: {
        field: selectedField,
        operator: "gt",
        value: 0,
      },
    });
    onComplete();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>Activity Type</Label>
        <Select
          value={selectedTypeId}
          onValueChange={(value) => {
            setSelectedTypeId(value);
            setSelectedField("");
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select an activity type" />
          </SelectTrigger>
          <SelectContent>
            {logTypes.map((type) => (
              <SelectItem key={type._id} value={type._id}>
                {type.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedType && (
        <div className="space-y-2">
          <Label>Track Field</Label>
          <Select value={selectedField} onValueChange={setSelectedField}>
            <SelectTrigger>
              <SelectValue placeholder="Select field to track" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(selectedType.quantities.fields).map(
                ([field, config]) => (
                  <SelectItem key={field} value={field}>
                    {field} ({config.unit})
                  </SelectItem>
                ),
              )}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onComplete}>
          Cancel
        </Button>
        <Button type="submit" disabled={!selectedTypeId || !selectedField}>
          Create Streak
        </Button>
      </div>
    </form>
  );
}
