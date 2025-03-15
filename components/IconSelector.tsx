import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Upload } from "lucide-react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";
import LogTypeIcon from "./LogTypeIcon";
import { useState } from "react";
import { cn } from "../lib/utils";

interface IconSelectorProps {
  selectedIconId?: Id<"icons">;
  onSelectIcon: (iconId: Id<"icons"> | undefined) => void;
}

export default function IconSelector({
  selectedIconId,
  onSelectIcon,
}: IconSelectorProps) {
  const icons = useQuery(api.icons.list) || [];
  const createIcon = useMutation(api.icons.create);
  const generateUploadUrl = useMutation(api.logTypes.generateUploadUrl);
  const [iconFile, setIconFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async () => {
    if (!iconFile) return;
    setUploading(true);
    try {
      const uploadUrl = await generateUploadUrl();
      const result = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": iconFile.type },
        body: iconFile,
      });
      if (!result.ok) throw new Error("Upload failed");
      const { storageId } = JSON.parse(await result.text());

      const iconId = await createIcon({
        name: iconFile.name,
        storageId,
      });
      onSelectIcon(iconId);
      setIconFile(null);
    } catch (error) {
      console.error("Failed to upload icon:", error);
    }
    setUploading(false);
  };

  return (
    <div className="space-y-4">
      {/* Existing icons grid */}
      <div className="grid grid-cols-6 gap-2">
        {icons.map((icon) => (
          <div
            key={icon._id}
            className={cn(
              "w-12 h-12 rounded-lg bg-pencil/5 cursor-pointer overflow-hidden",
              selectedIconId === icon._id && "ring-2 ring-highlight",
            )}
            onClick={() => {
              onSelectIcon(icon._id);
              setIconFile(null);
            }}
          >
            <LogTypeIcon iconId={icon._id} className="w-full h-full" />
          </div>
        ))}
      </div>

      {/* Upload new icon option */}
      <div className="flex items-center gap-4">
        {iconFile && (
          <div className="relative w-12 h-12 rounded-lg bg-pencil/5 overflow-hidden">
            <img
              src={URL.createObjectURL(iconFile)}
              alt="New icon preview"
              className="w-full h-full object-cover"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute top-0 right-0 bg-paper/80 hover:bg-paper"
              onClick={() => setIconFile(null)}
            >
              ×
            </Button>
          </div>
        )}
        <div>
          <Input
            type="file"
            accept="image/*"
            className="hidden"
            id="icon-upload"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                setIconFile(file);
                onSelectIcon(undefined);
              }
            }}
          />
          <Button
            type="button"
            variant="outline"
            asChild
            className="font-notebook"
            disabled={uploading}
            onClick={handleUpload}
          >
            <label htmlFor="icon-upload" className="cursor-pointer">
              <Upload className="w-4 h-4 mr-2" />
              {uploading ? "Uploading..." : "Upload New Icon"}
            </label>
          </Button>
        </div>
      </div>
    </div>
  );
}
