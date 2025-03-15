import { Id } from "./convex/_generated/dataModel";

export interface LogType {
  _id: Id<"logTypes">;
  name: string;
  iconId?: Id<"icons">;
  quantities: {
    fields: Record<
      string,
      {
        unit: string;
        presets?: string[];
      }
    >;
  };
}

export interface Log {
  _id: Id<"logs">;
  typeId: Id<"logTypes">;
  userId: string;
  timestamp: number;
  values: Record<string, string>;
  notes?: string;
}

export interface Habit {
  _id: Id<"habits">;
  userId: string;
  name: string;
  unit: string;
  field: string;
  logTypeIds: Id<"logTypes">[];
  interval: "day" | "week";
  rule: {
    operator: "gt" | "lt" | "eq";
    value: number;
  };
  iconId?: Id<"icons">;
}
