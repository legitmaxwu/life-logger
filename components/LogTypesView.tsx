import { useState, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { PlusCircle, Trash2, Pencil, Image, Settings } from "lucide-react";
import { LogType } from "@/types";
import LogTypeForm from "./LogTypeForm";
import { useConvexStorage } from "../hooks/useConvexStorage";
import LogTypeIcon from "./LogTypeIcon";

interface LogTypeItemProps {
  type: LogType;
  onEdit: () => void;
  onDelete: () => void;
}

function LogTypeItem({ type, onEdit, onDelete }: LogTypeItemProps) {
  return (
    <div className="p-4 bg-paper/50 rounded-lg border border-pencil/10 group">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <LogTypeIcon iconId={type.iconId} />

          <div>
            <h3 className="font-handwriting text-lg text-pencil">
              {type.name}
            </h3>
            <div className="font-notebook text-sm text-pencil/60 mt-1">
              {Object.entries(type.quantities.fields).map(([name, config]) => (
                <div key={name}>
                  {name} ({config.unit})
                </div>
              ))}
            </div>

            {/* Show presets for each quantity */}
            {Object.entries(type.quantities.fields).map(
              ([name, config]) =>
                config.presets &&
                config.presets.length > 0 && (
                  <div key={name} className="flex flex-wrap gap-1 mt-2">
                    <div className="text-xs font-notebook text-pencil/50 mr-1">
                      {name}:
                    </div>
                    {config.presets.map((preset) => (
                      <div
                        key={preset}
                        className="px-2 py-0.5 bg-pencil/5 rounded text-xs font-notebook text-pencil/70"
                      >
                        {preset} {config.unit}
                      </div>
                    ))}
                  </div>
                ),
            )}
          </div>
        </div>

        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="icon"
            className="text-pencil/40 hover:text-pencil/60 hover:bg-pencil/5 h-8 w-8"
            onClick={onEdit}
          >
            <Settings className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-pencil/40 hover:text-pencil/60 hover:bg-pencil/5 h-8 w-8"
            onClick={onDelete}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function LogTypesView() {
  const [showForm, setShowForm] = useState(false);
  const [editingType, setEditingType] = useState<LogType | null>(null);
  const logTypes = useQuery(api.logTypes.list) || [];
  const deleteLogType = useMutation(api.logTypes.remove);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-handwriting text-pencil/90">Log Types</h2>
        <Button
          size="sm"
          className="font-notebook bg-highlight hover:bg-highlight/90 text-paper border-none shadow-sm"
          onClick={() => {
            setEditingType(null);
            setShowForm(true);
          }}
        >
          <PlusCircle className="w-4 h-4 mr-1.5" />
          Create Log Type
        </Button>
      </div>

      {showForm && (
        <div className="p-6 border-pencil/10 bg-paper/50 rounded-lg">
          <LogTypeForm
            initialData={editingType}
            onComplete={() => {
              setShowForm(false);
              setEditingType(null);
            }}
          />
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {logTypes.map((type) => (
          <LogTypeItem
            key={type._id}
            type={type}
            onEdit={() => {
              setEditingType(type);
              setShowForm(true);
            }}
            onDelete={() => deleteLogType({ id: type._id })}
          />
        ))}
      </div>
    </div>
  );
}
