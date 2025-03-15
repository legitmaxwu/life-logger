import LogTypeIcon from "./LogTypeIcon";
import { Button } from "./ui/button";

export default function LogTypeSelect({ logTypes, onSelect }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
      {logTypes.map((type) => (
        <Button
          key={type._id}
          variant="outline"
          className="h-auto p-4 flex flex-col items-center gap-2"
          onClick={() => onSelect(type)}
        >
          <LogTypeIcon iconId={type.iconId} />
          <span className="font-handwriting text-lg">{type.name}</span>
        </Button>
      ))}
    </div>
  );
}
