import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ColorAdjustments } from "@shared/types/pixel-asset";
import { createDefaultColorAdjustments } from "@shared/utils/pixel-asset";

export interface ColorAdjustmentsControlsProps {
  colorAdjustments: ColorAdjustments;
  onColorAdjustmentsChange?: (adjustments: ColorAdjustments) => void;
  className?: string;
}

export function ColorAdjustmentsControls({
  colorAdjustments,
  onColorAdjustmentsChange,
  className,
}: ColorAdjustmentsControlsProps) {
  const handleChange = (field: keyof ColorAdjustments, value: number) => {
    const clampedValue = Math.max(-1, Math.min(1, value));
    const newAdjustments = { ...colorAdjustments, [field]: clampedValue };
    onColorAdjustmentsChange?.(newAdjustments);
  };

  const handleReset = () => {
    onColorAdjustmentsChange?.(createDefaultColorAdjustments());
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        <Label className="text-sm font-semibold">Color Adjustments</Label>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={handleReset}
          title="Reset to defaults"
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-3">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="adjust-brightness" className="text-xs text-muted-foreground">
              Brightness
            </Label>
            <span className="text-xs text-muted-foreground">
              {colorAdjustments.brightness.toFixed(2)}
            </span>
          </div>
          <Input
            id="adjust-brightness"
            type="range"
            min="-1"
            max="1"
            step="0.01"
            value={colorAdjustments.brightness}
            onChange={(e) => handleChange("brightness", parseFloat(e.target.value) || 0)}
            className="h-2"
          />
          <Input
            type="number"
            min="-1"
            max="1"
            step="0.01"
            value={colorAdjustments.brightness.toFixed(2)}
            onChange={(e) => handleChange("brightness", parseFloat(e.target.value) || 0)}
            className="h-8 text-sm"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="adjust-contrast" className="text-xs text-muted-foreground">
              Contrast
            </Label>
            <span className="text-xs text-muted-foreground">
              {colorAdjustments.contrast.toFixed(2)}
            </span>
          </div>
          <Input
            id="adjust-contrast"
            type="range"
            min="-1"
            max="1"
            step="0.01"
            value={colorAdjustments.contrast}
            onChange={(e) => handleChange("contrast", parseFloat(e.target.value) || 0)}
            className="h-2"
          />
          <Input
            type="number"
            min="-1"
            max="1"
            step="0.01"
            value={colorAdjustments.contrast.toFixed(2)}
            onChange={(e) => handleChange("contrast", parseFloat(e.target.value) || 0)}
            className="h-8 text-sm"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="adjust-saturation" className="text-xs text-muted-foreground">
              Saturation
            </Label>
            <span className="text-xs text-muted-foreground">
              {colorAdjustments.saturation.toFixed(2)}
            </span>
          </div>
          <Input
            id="adjust-saturation"
            type="range"
            min="-1"
            max="1"
            step="0.01"
            value={colorAdjustments.saturation}
            onChange={(e) => handleChange("saturation", parseFloat(e.target.value) || 0)}
            className="h-2"
          />
          <Input
            type="number"
            min="-1"
            max="1"
            step="0.01"
            value={colorAdjustments.saturation.toFixed(2)}
            onChange={(e) => handleChange("saturation", parseFloat(e.target.value) || 0)}
            className="h-8 text-sm"
          />
        </div>
      </div>
    </div>
  );
}

