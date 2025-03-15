import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { useConvexStorage } from "@/hooks/useConvexStorage";
import { Image } from "lucide-react";
import { cn } from "@/lib/utils";
import { Id } from "../convex/_generated/dataModel";

interface LogTypeIconProps {
  iconId?: Id<"icons">;
  className?: string;
}

export default function LogTypeIcon({ iconId, className }: LogTypeIconProps) {
  if (!iconId) {
    return (
      <div
        className={cn(
          "w-8 h-8 rounded flex items-center justify-center overflow-hidden flex-shrink-0",
          className,
        )}
      >
        <div className="w-full h-full flex items-center justify-center bg-pencil/5">
          <Image className="w-4 h-4 text-pencil/20" />
        </div>
      </div>
    );
  }

  return <InternalIcon iconId={iconId} className={className} />;
}

function InternalIcon({
  iconId,
  className,
}: {
  iconId: Id<"icons">;
  className?: string;
}) {
  const icon = useQuery(api.icons.get, { id: iconId });
  const { url, loading } = useConvexStorage(icon?.storageId);

  return (
    <div
      className={cn(
        "w-8 h-8 rounded flex items-center justify-center overflow-hidden flex-shrink-0",
        className,
      )}
    >
      {loading ? (
        <div className="animate-pulse w-full h-full bg-pencil/10" />
      ) : url ? (
        <img src={url} alt="" className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-pencil/5">
          <Image className="w-4 h-4 text-pencil/20" />
        </div>
      )}
    </div>
  );
}
