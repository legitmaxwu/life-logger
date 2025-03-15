import { useState, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";

export function useConvexStorage(
  storageId: Id<"_storage"> | string | undefined,
) {
  const [url, setUrl] = useState<string>();
  const [loading, setLoading] = useState(false);

  // Convert string ID to proper Convex ID if needed
  const actualStorageId =
    typeof storageId === "string" && storageId.startsWith("{")
      ? (JSON.parse(storageId).storageId as Id<"_storage">)
      : (storageId as Id<"_storage">);

  const storageUrl = useQuery(
    api.storage.getUrl,
    actualStorageId ? { storageId: actualStorageId } : "skip",
  );

  useEffect(() => {
    if (storageUrl) {
      setLoading(true);
      setUrl(storageUrl);
      setLoading(false);
    } else {
      setUrl(undefined);
    }
  }, [storageUrl]);

  return { url, loading };
}
