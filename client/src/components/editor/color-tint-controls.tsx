import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { ColorTint } from "@shared/types/pixel-asset";

export interface ColorTintControlsProps {
  colorTint: ColorTint;
  onColorTintChange?: (colorTint: ColorTint) => void;
  className?: string;
}

export function ColorTintControls({
  colorTint,
  onColorTintChange,
  className,
}: ColorTintControlsProps) {
  const handleChange = (field: keyof ColorTint, value: number) => {
    const clampedValue = Math.max(0, Math.min(1, value));
    const newColorTint = { ...colorTint, [field]: clampedValue };
    onColorTintChange?.(newColorTint);
  };

  // Convert RGBA to hex for color picker
  const rgbaToHex = (r: number, g: number, b: number, a: number): string => {
    const toHex = (n: number) => {
      const hex = Math.round(n * 255).toString(16);
      return hex.length === 1 ? "0" + hex : hex;
    };
    return `#${toHex(r)}${toHex(g)}${toHex(b)}${toHex(a)}`;
  };

  // Convert hex to RGBA
  const hexToRgba = (hex: string): { r: number; g: number; b: number; a: number } => {
    const cleanHex = hex.replace("#", "");
    const r = parseInt(cleanHex.slice(0, 2), 16) / 255;
    const g = parseInt(cleanHex.slice(2, 4), 16) / 255;
    const b = parseInt(cleanHex.slice(4, 6), 16) / 255;
    const a = cleanHex.length === 8 ? parseInt(cleanHex.slice(6, 8), 16) / 255 : 1;
    return { r, g, b, a };
  };

  const handleColorPickerChange = (hex: string) => {
    const rgba = hexToRgba(hex);
    onColorTintChange?.(rgba);
  };

  const currentHex = rgbaToHex(colorTint.r, colorTint.g, colorTint.b, colorTint.a);

  return (
    <div className={cn("space-y-4", className)}>
      <div className="space-y-2">
        <Label className="text-sm font-semibold">Color Tint</Label>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={currentHex.slice(0, 7)} // Remove alpha for color picker
            onChange={(e) => {
              // Preserve alpha when changing RGB
              const rgba = hexToRgba(e.target.value);
              onColorTintChange?.({ ...rgba, a: colorTint.a });
            }}
            className="h-8 w-16 rounded border cursor-pointer"
          />
          <div className="flex-1 grid grid-cols-4 gap-2">
            <div className="space-y-1">
              <Label htmlFor="tint-r" className="text-xs text-muted-foreground">
                R
              </Label>
              <Input
                id="tint-r"
                type="number"
                min="0"
                max="1"
                step="0.01"
                value={colorTint.r.toFixed(2)}
                onChange={(e) => handleChange("r", parseFloat(e.target.value) || 0)}
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="tint-g" className="text-xs text-muted-foreground">
                G
              </Label>
              <Input
                id="tint-g"
                type="number"
                min="0"
                max="1"
                step="0.01"
                value={colorTint.g.toFixed(2)}
                onChange={(e) => handleChange("g", parseFloat(e.target.value) || 0)}
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="tint-b" className="text-xs text-muted-foreground">
                B
              </Label>
              <Input
                id="tint-b"
                type="number"
                min="0"
                max="1"
                step="0.01"
                value={colorTint.b.toFixed(2)}
                onChange={(e) => handleChange("b", parseFloat(e.target.value) || 0)}
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="tint-a" className="text-xs text-muted-foreground">
                A
              </Label>
              <Input
                id="tint-a"
                type="number"
                min="0"
                max="1"
                step="0.01"
                value={colorTint.a.toFixed(2)}
                onChange={(e) => handleChange("a", parseFloat(e.target.value) || 0)}
                className="h-8 text-sm"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Preview with sample pixels */}
      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">Preview</Label>
        <div className="flex gap-1">
          {[
            { r: 255, g: 0, b: 0, a: 255 }, // Red
            { r: 0, g: 255, b: 0, a: 255 }, // Green
            { r: 0, g: 0, b: 255, a: 255 }, // Blue
            { r: 255, g: 255, b: 255, a: 255 }, // White
            { r: 0, g: 0, b: 0, a: 255 }, // Black
          ].map((color, i) => {
            const tintedR = Math.round(color.r * colorTint.r * colorTint.a);
            const tintedG = Math.round(color.g * colorTint.g * colorTint.a);
            const tintedB = Math.round(color.b * colorTint.b * colorTint.a);
            const tintedColor = `rgb(${tintedR}, ${tintedG}, ${tintedB})`;
            const originalColor = `rgb(${color.r}, ${color.g}, ${color.b})`;
            return (
              <div key={i} className="flex flex-col gap-1">
                <div
                  className="w-8 h-8 rounded border"
                  style={{ backgroundColor: originalColor }}
                  title="Original"
                />
                <div
                  className="w-8 h-8 rounded border"
                  style={{ backgroundColor: tintedColor }}
                  title="Tinted"
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

