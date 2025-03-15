import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Image, Upload, Plus, X } from "lucide-react";
import { LogType } from "@/types";
import { useConvexStorage } from "@/hooks/useConvexStorage";
import { cn } from "@/lib/utils";
import { Id } from "../convex/_generated/dataModel";

interface QuantityField {
  unit: string;
  presets?: string[];
}

interface FormData {
  name: string;
  quantities: {
    fields: Record<string, QuantityField>;
  };
}

interface LogTypeFormProps {
  initialData?: LogType | null;
  onComplete: () => void;
}

// Create a separate component for icon items
function IconGridItem({
  icon,
  isSelected,
  onSelect,
}: {
  icon: { _id: Id<"icons">; storageId: Id<"_storage">; name: string };
  isSelected: boolean;
  onSelect: () => void;
}) {
  const { url } = useConvexStorage(icon.storageId);

  return (
    <div
      className={cn(
        "w-12 h-12 rounded-lg bg-pencil/5 cursor-pointer overflow-hidden",
        isSelected && "ring-2 ring-highlight",
      )}
      onClick={onSelect}
    >
      {url && (
        <img src={url} alt={icon.name} className="w-full h-full object-cover" />
      )}
    </div>
  );
}

export default function LogTypeForm({
  initialData,
  onComplete,
}: LogTypeFormProps) {
  const createLogType = useMutation(api.logTypes.create);
  const updateLogType = useMutation(api.logTypes.update);
  const generateUploadUrl = useMutation(api.logTypes.generateUploadUrl);
  const icons = useQuery(api.icons.list) || [];
  const createIcon = useMutation(api.icons.create);
  const incrementIconUsage = useMutation(api.icons.incrementUsage);
  const decrementIconUsage = useMutation(api.icons.decrementUsage);

  const [formData, setFormData] = useState<FormData>({
    name: initialData?.name ?? "",
    quantities: {
      fields: initialData?.quantities?.fields ?? {},
    },
  });
  const [newQuantity, setNewQuantity] = useState({
    name: "",
    unit: "",
    preset: "",
  });
  const [selectedIconId, setSelectedIconId] = useState<Id<"icons"> | undefined>(
    initialData?.iconId,
  );
  const [iconFile, setIconFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    let iconId = selectedIconId;

    if (iconFile) {
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

        // Create new icon record
        iconId = await createIcon({
          name: iconFile.name,
          storageId,
        });
      } catch (error) {
        console.error("Failed to upload icon:", error);
      }
      setUploading(false);
    }

    // If changing icons, update usage counts
    if (initialData?.iconId && initialData.iconId !== iconId) {
      await decrementIconUsage({ id: initialData.iconId });
    }
    if (iconId && iconId !== initialData?.iconId) {
      await incrementIconUsage({ id: iconId });
    }

    const data = {
      ...formData,
      iconId,
    };

    if (initialData) {
      await updateLogType({ id: initialData._id, ...data });
    } else {
      await createLogType(data);
    }
    onComplete();
  };

  const addQuantity = () => {
    if (!newQuantity.name || !newQuantity.unit) return;
    setFormData((prev) => ({
      ...prev,
      quantities: {
        fields: {
          ...prev.quantities.fields,
          [newQuantity.name]: {
            unit: newQuantity.unit,
            presets: [],
          },
        },
      },
    }));
    setNewQuantity({ name: "", unit: "", preset: "" });
  };

  const addPreset = (quantityName: string, preset: string) => {
    if (!preset) return;
    setFormData((prev) => ({
      ...prev,
      quantities: {
        fields: {
          ...prev.quantities.fields,
          [quantityName]: {
            ...prev.quantities.fields[quantityName],
            presets: [
              ...(prev.quantities.fields[quantityName].presets || []),
              preset,
            ],
          },
        },
      },
    }));
  };

  const removePreset = (quantityName: string, presetToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      quantities: {
        fields: {
          ...prev.quantities.fields,
          [quantityName]: {
            ...prev.quantities.fields[quantityName],
            presets: prev.quantities.fields[quantityName].presets?.filter(
              (p) => p !== presetToRemove,
            ),
          },
        },
      },
    }));
  };

  const removeQuantity = (quantityName: string) => {
    setFormData((prev) => {
      const newFields = { ...prev.quantities.fields };
      delete newFields[quantityName];
      return {
        ...prev,
        quantities: { fields: newFields },
      };
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label>Icon</Label>
        <div className="space-y-4">
          {/* Existing icons grid */}
          <div className="grid grid-cols-6 gap-2">
            {icons.map((icon) => (
              <IconGridItem
                key={icon._id}
                icon={icon}
                isSelected={selectedIconId === icon._id}
                onSelect={() => {
                  setSelectedIconId(icon._id);
                  setIconFile(null);
                }}
              />
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
                    setSelectedIconId(undefined);
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                asChild
                className="font-notebook"
                disabled={uploading}
              >
                <label htmlFor="icon-upload" className="cursor-pointer">
                  <Upload className="w-4 h-4 mr-2" />
                  {uploading ? "Uploading..." : "Upload New Icon"}
                </label>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Name</Label>
        <Input
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />
      </div>

      <div className="space-y-4">
        <Label>Quantities</Label>

        {/* Add new quantity */}
        <div className="flex gap-2">
          <Input
            placeholder="Quantity name (e.g. Distance)"
            value={newQuantity.name}
            onChange={(e) =>
              setNewQuantity((prev) => ({ ...prev, name: e.target.value }))
            }
          />
          <Input
            placeholder="Unit (e.g. km)"
            value={newQuantity.unit}
            onChange={(e) =>
              setNewQuantity((prev) => ({ ...prev, unit: e.target.value }))
            }
          />
          <Button
            type="button"
            variant="outline"
            onClick={addQuantity}
            disabled={!newQuantity.name || !newQuantity.unit}
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        {/* List of quantities */}
        <div className="space-y-4">
          {Object.entries(formData.quantities.fields).map(([name, field]) => (
            <div
              key={name}
              className="border border-pencil/10 rounded-lg p-4 space-y-2"
            >
              <div className="flex items-center justify-between">
                <div className="font-handwriting text-lg">
                  {name} ({field.unit})
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeQuantity(name)}
                  className="h-6 w-6 text-pencil/40 hover:text-pencil/60"
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>

              {/* Presets for this quantity */}
              <div className="space-y-2">
                <Label className="text-sm">Quick select values</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder={`Add preset (e.g. 5 ${field.unit})`}
                    value={newQuantity.preset}
                    onChange={(e) =>
                      setNewQuantity((prev) => ({
                        ...prev,
                        preset: e.target.value,
                      }))
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addPreset(name, newQuantity.preset);
                        setNewQuantity((prev) => ({ ...prev, preset: "" }));
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      addPreset(name, newQuantity.preset);
                      setNewQuantity((prev) => ({ ...prev, preset: "" }));
                    }}
                  >
                    Add
                  </Button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {field.presets?.map((preset) => (
                    <div
                      key={preset}
                      className="px-2 py-1 bg-pencil/5 rounded-md text-sm flex items-center gap-2"
                    >
                      <span>{preset}</span>
                      <button
                        type="button"
                        className="text-pencil/40 hover:text-pencil/60"
                        onClick={() => removePreset(name, preset)}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onComplete}>
          Cancel
        </Button>
        <Button type="submit">
          {initialData ? "Update" : "Create"} Log Type
        </Button>
      </div>
    </form>
  );
}
