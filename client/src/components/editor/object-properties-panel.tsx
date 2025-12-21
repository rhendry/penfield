import React from "react";
import { TransformControls } from "./transform-controls";
import { ColorTintControls } from "./color-tint-controls";
import { ColorAdjustmentsControls } from "./color-adjustments";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { PixelObject } from "@shared/types/pixel-asset";

export interface ObjectPropertiesPanelProps {
  object: PixelObject | null;
  onObjectChange?: (object: PixelObject) => void;
  className?: string;
}

export function ObjectPropertiesPanel({
  object,
  onObjectChange,
  className,
}: ObjectPropertiesPanelProps) {
  if (!object) {
    return (
      <div className={cn("flex flex-col border rounded-lg bg-card p-4", className)}>
        <Label className="text-sm font-semibold mb-2">Object Properties</Label>
        <div className="text-sm text-muted-foreground text-center py-8">
          No object selected
        </div>
      </div>
    );
  }

  const handleTransformChange = (transform: typeof object.transform) => {
    onObjectChange?.({ ...object, transform });
  };

  const handleColorTintChange = (colorTint: typeof object.colorTint) => {
    onObjectChange?.({ ...object, colorTint });
  };

  const handleColorAdjustmentsChange = (colorAdjustments: typeof object.colorAdjustments) => {
    onObjectChange?.({ ...object, colorAdjustments });
  };

  return (
    <div className={cn("flex flex-col border rounded-lg bg-card", className)}>
      <div className="p-3 border-b">
        <Label className="text-sm font-semibold">{object.name}</Label>
      </div>
      <div className="p-4 space-y-6 overflow-y-auto">
        <TransformControls
          transform={object.transform}
          onTransformChange={handleTransformChange}
        />
        <ColorTintControls
          colorTint={object.colorTint}
          onColorTintChange={handleColorTintChange}
        />
        <ColorAdjustmentsControls
          colorAdjustments={object.colorAdjustments}
          onColorAdjustmentsChange={handleColorAdjustmentsChange}
        />
      </div>
    </div>
  );
}

