import { Id } from "../convex/_generated/dataModel";

export interface LogType {
  _id: Id<"logTypes">;
  userId: string;
  name: string;
  iconStorageId?: Id<"_storage">;
  format: "check" | "quantity";
  unit?: string;
  presets?: string[];
  uniqueDaily?: boolean;
}

export interface Log {
  _id: Id<"logs">;
  userId: string;
  typeId: Id<"logTypes">;
  timestamp: number;
  value: string;
  notes?: string;
}
