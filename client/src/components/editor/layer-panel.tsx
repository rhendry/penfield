import React from "react";
import { Eye, EyeOff, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { Layer } from "@shared/types/pixel-asset";

export interface LayerPanelProps {
  layers: Layer[];
  activeLayerId: string | null;
  onLayerClick?: (layerId: string) => void;
  onLayerVisibilityToggle?: (layerId: string) => void;
  onLayerNameChange?: (layerId: string, name: string) => void;
  onLayerReorder?: (layerId: string, newOrder: number) => void;
  className?: string;
}

export function LayerPanel({
  layers,
  activeLayerId,
  onLayerClick,
  onLayerVisibilityToggle,
  onLayerNameChange,
  onLayerReorder,
  className,
}: LayerPanelProps) {
  // Sort layers by order (higher order = drawn on top, so show at top of list)
  const sortedLayers = [...layers].sort((a, b) => b.order - a.order);

  return (
    <div className={cn("flex flex-col border rounded-lg bg-card", className)}>
      <div className="p-3 border-b">
        <h3 className="text-sm font-semibold">Layers</h3>
      </div>
      <div className="flex flex-col divide-y">
        {sortedLayers.length === 0 ? (
          <div className="p-4 text-sm text-muted-foreground text-center">
            No layers
          </div>
        ) : (
          sortedLayers.map((layer) => (
            <LayerItem
              key={layer.id}
              layer={layer}
              isActive={layer.id === activeLayerId}
              onClick={() => onLayerClick?.(layer.id)}
              onVisibilityToggle={() => onLayerVisibilityToggle?.(layer.id)}
              onNameChange={(name) => onLayerNameChange?.(layer.id, name)}
            />
          ))
        )}
      </div>
    </div>
  );
}

interface LayerItemProps {
  layer: Layer;
  isActive: boolean;
  onClick?: () => void;
  onVisibilityToggle?: () => void;
  onNameChange?: (name: string) => void;
}

function LayerItem({
  layer,
  isActive,
  onClick,
  onVisibilityToggle,
  onNameChange,
}: LayerItemProps) {
  const [isEditing, setIsEditing] = React.useState(false);
  const [editName, setEditName] = React.useState(layer.name);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleDoubleClick = () => {
    setIsEditing(true);
  };

  const handleBlur = () => {
    setIsEditing(false);
    if (editName !== layer.name && editName.trim()) {
      onNameChange?.(editName.trim());
    } else {
      setEditName(layer.name);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      inputRef.current?.blur();
    } else if (e.key === "Escape") {
      setEditName(layer.name);
      setIsEditing(false);
    }
  };

  return (
    <div
      className={cn(
        "flex items-center gap-2 p-2 hover:bg-accent cursor-pointer transition-colors",
        isActive && "bg-accent"
      )}
      onClick={onClick}
    >
      <GripVertical className="h-4 w-4 text-muted-foreground flex-shrink-0" />
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 flex-shrink-0"
        onClick={(e) => {
          e.stopPropagation();
          onVisibilityToggle?.();
        }}
      >
        {layer.visible ? (
          <Eye className="h-4 w-4" />
        ) : (
          <EyeOff className="h-4 w-4 text-muted-foreground" />
        )}
      </Button>
      {isEditing ? (
        <Input
          ref={inputRef}
          value={editName}
          onChange={(e) => setEditName(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className="h-7 flex-1 text-sm"
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <span
          className="flex-1 text-sm truncate"
          onDoubleClick={handleDoubleClick}
        >
          {layer.name}
        </span>
      )}
    </div>
  );
}

