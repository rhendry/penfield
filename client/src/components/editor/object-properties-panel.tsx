import React from "react";
import * as Slider from "@radix-ui/react-slider";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { PixelObject, ColorAdjustments } from "@shared/types/pixel-asset";

export interface ObjectPropertiesPanelProps {
  selectedObject: PixelObject | null;
  onColorAdjustmentsChange?: (adjustments: ColorAdjustments) => void;
  className?: string;
}

export function ObjectPropertiesPanel({
  selectedObject,
  onColorAdjustmentsChange,
  className,
}: ObjectPropertiesPanelProps) {
  if (!selectedObject) {
    return (
      <div className={cn("flex flex-col border rounded-lg bg-card p-4", className)}>
        <h3 className="text-sm font-semibold mb-2">Properties</h3>
        <p className="text-sm text-muted-foreground">No object selected</p>
      </div>
    );
  }

  const adjustments = selectedObject.colorAdjustments;

  const handleBrightnessChange = (value: number[]) => {
    onColorAdjustmentsChange?.({
      ...adjustments,
      brightness: value[0],
    });
  };

  const handleContrastChange = (value: number[]) => {
    onColorAdjustmentsChange?.({
      ...adjustments,
      contrast: value[0],
    });
  };

  const handleSaturationChange = (value: number[]) => {
    onColorAdjustmentsChange?.({
      ...adjustments,
      saturation: value[0],
    });
  };

  return (
    <div className={cn("flex flex-col border rounded-lg bg-card", className)}>
      <div className="p-3 border-b">
        <h3 className="text-sm font-semibold">Properties</h3>
        <p className="text-xs text-muted-foreground mt-0.5">{selectedObject.name}</p>
      </div>
      <div className="p-4 space-y-4">
        {/* Brightness */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="brightness" className="text-sm">
              Brightness
            </Label>
            <span className="text-xs text-muted-foreground">{adjustments.brightness.toFixed(2)}</span>
          </div>
          <Slider.Root
            id="brightness"
            className="relative flex items-center select-none touch-none w-full h-5"
            value={[adjustments.brightness]}
            onValueChange={handleBrightnessChange}
            min={-1}
            max={1}
            step={0.01}
          >
            <Slider.Track className="bg-secondary relative grow rounded-full h-2">
              <Slider.Range className="absolute bg-primary rounded-full h-full" />
            </Slider.Track>
            <Slider.Thumb
              className="block w-4 h-4 bg-background border-2 border-primary rounded-full shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              aria-label="Brightness"
            />
          </Slider.Root>
        </div>

        {/* Contrast */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="contrast" className="text-sm">
              Contrast
            </Label>
            <span className="text-xs text-muted-foreground">{adjustments.contrast.toFixed(2)}</span>
          </div>
          <Slider.Root
            id="contrast"
            className="relative flex items-center select-none touch-none w-full h-5"
            value={[adjustments.contrast]}
            onValueChange={handleContrastChange}
            min={-1}
            max={1}
            step={0.01}
          >
            <Slider.Track className="bg-secondary relative grow rounded-full h-2">
              <Slider.Range className="absolute bg-primary rounded-full h-full" />
            </Slider.Track>
            <Slider.Thumb
              className="block w-4 h-4 bg-background border-2 border-primary rounded-full shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              aria-label="Contrast"
            />
          </Slider.Root>
        </div>

        {/* Saturation */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="saturation" className="text-sm">
              Saturation
            </Label>
            <span className="text-xs text-muted-foreground">{adjustments.saturation.toFixed(2)}</span>
          </div>
          <Slider.Root
            id="saturation"
            className="relative flex items-center select-none touch-none w-full h-5"
            value={[adjustments.saturation]}
            onValueChange={handleSaturationChange}
            min={-1}
            max={1}
            step={0.01}
          >
            <Slider.Track className="bg-secondary relative grow rounded-full h-2">
              <Slider.Range className="absolute bg-primary rounded-full h-full" />
            </Slider.Track>
            <Slider.Thumb
              className="block w-4 h-4 bg-background border-2 border-primary rounded-full shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              aria-label="Saturation"
            />
          </Slider.Root>
        </div>
      </div>
    </div>
  );
}

