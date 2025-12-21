import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Link2, Link2Off } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Transform } from "@shared/types/pixel-asset";

export interface TransformControlsProps {
  transform: Transform;
  onTransformChange?: (transform: Transform) => void;
  className?: string;
}

export function TransformControls({
  transform,
  onTransformChange,
  className,
}: TransformControlsProps) {
  const [uniformScale, setUniformScale] = React.useState(true);
  const [rotationDegrees, setRotationDegrees] = React.useState(
    Math.round((transform.rotation * 180) / Math.PI)
  );

  const handleChange = (field: keyof Transform, value: number) => {
    const newTransform = { ...transform, [field]: value };
    onTransformChange?.(newTransform);
  };

  const handleRotationChange = (degrees: number) => {
    setRotationDegrees(degrees);
    const radians = (degrees * Math.PI) / 180;
    handleChange("rotation", radians);
  };

  const handleScaleXChange = (value: number) => {
    handleChange("scaleX", value);
    if (uniformScale) {
      handleChange("scaleY", value);
    }
  };

  const handleScaleYChange = (value: number) => {
    handleChange("scaleY", value);
  };

  React.useEffect(() => {
    setRotationDegrees(Math.round((transform.rotation * 180) / Math.PI));
  }, [transform.rotation]);

  return (
    <div className={cn("space-y-4", className)}>
      <div className="space-y-2">
        <Label className="text-sm font-semibold">Transform</Label>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label htmlFor="transform-x" className="text-xs text-muted-foreground">
              X
            </Label>
            <Input
              id="transform-x"
              type="number"
              value={transform.x.toFixed(2)}
              onChange={(e) => handleChange("x", parseFloat(e.target.value) || 0)}
              className="h-8 text-sm"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="transform-y" className="text-xs text-muted-foreground">
              Y
            </Label>
            <Input
              id="transform-y"
              type="number"
              value={transform.y.toFixed(2)}
              onChange={(e) => handleChange("y", parseFloat(e.target.value) || 0)}
              className="h-8 text-sm"
            />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="transform-rotation" className="text-xs text-muted-foreground">
          Rotation (°)
        </Label>
        <Input
          id="transform-rotation"
          type="number"
          value={rotationDegrees}
          onChange={(e) => handleRotationChange(parseInt(e.target.value) || 0)}
          className="h-8 text-sm"
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs text-muted-foreground">Scale</Label>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => setUniformScale(!uniformScale)}
            title={uniformScale ? "Unlink scale" : "Link scale"}
          >
            {uniformScale ? (
              <Link2 className="h-4 w-4" />
            ) : (
              <Link2Off className="h-4 w-4" />
            )}
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label htmlFor="transform-scale-x" className="text-xs text-muted-foreground">
              Scale X
            </Label>
            <Input
              id="transform-scale-x"
              type="number"
              step="0.1"
              value={transform.scaleX.toFixed(2)}
              onChange={(e) =>
                handleScaleXChange(parseFloat(e.target.value) || 1)
              }
              className="h-8 text-sm"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="transform-scale-y" className="text-xs text-muted-foreground">
              Scale Y
            </Label>
            <Input
              id="transform-scale-y"
              type="number"
              step="0.1"
              value={transform.scaleY.toFixed(2)}
              onChange={(e) =>
                handleScaleYChange(parseFloat(e.target.value) || 1)
              }
              className="h-8 text-sm"
              disabled={uniformScale}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

