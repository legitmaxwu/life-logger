import React, { useState, useMemo } from "react";
import { useQuery, useMutation } from "react-query";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { api } from "@/lib/api";
import { LogType } from "@/types";
import { lucideIcons } from "@/lib/lucide-icons";

export function QuickLog() {
  const [open, setOpen] = useState(false);
  const logTypes = useQuery(api.logTypes.list) || [];
  const createLog = useMutation(api.logs.create);

  // Group log types by category
  const categories = useMemo(() => {
    const grouped = new Map<string, LogType[]>();
    logTypes.forEach((type) => {
      const cat = type.category || "Other";
      if (!grouped.has(cat)) grouped.set(cat, []);
      grouped.get(cat)!.push(type);
    });
    return grouped;
  }, [logTypes]);

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {open && (
        <div className="absolute bottom-full right-0 mb-4 w-64 bg-paper rounded-lg shadow-lg border border-pencil/10">
          {Array.from(categories.entries()).map(([category, types]) => (
            <div key={category} className="p-2">
              <div className="text-xs font-notebook text-pencil/50 mb-1">
                {category}
              </div>
              <div className="space-y-1">
                {types.map((type) => (
                  <QuickLogButton key={type._id} type={type} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
      <Button
        size="lg"
        className="rounded-full h-14 w-14 shadow-lg"
        onClick={() => setOpen(!open)}
      >
        <PlusCircle className="h-6 w-6" />
      </Button>
    </div>
  );
}

function QuickLogButton({ type }: { type: LogType }) {
  const Icon = lucideIcons[type.icon];
  const createLog = useMutation(api.logs.create);

  const handleClick = async () => {
    switch (type.inputType) {
      case "quick":
        await createLog({ typeId: type._id, value: true });
        break;
      case "duration":
      case "activity":
      case "daily_number":
        // Show quick input dialog
        break;
    }
  };

  return (
    <Button
      variant="ghost"
      className="w-full justify-start text-left"
      onClick={handleClick}
    >
      <Icon className="h-4 w-4 mr-2" />
      {type.name}
    </Button>
  );
}
