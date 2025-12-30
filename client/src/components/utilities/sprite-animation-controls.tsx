import { useState, useCallback, useEffect } from "react";
import { Plus, Trash2, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { HotkeyTip } from "@/components/ui/hotkey-tip";
import { cn } from "@/lib/utils";
import type { SpriteAnimation, AnimationFrame } from "@shared/types/pixel-asset";
import { AnimationViewer } from "./animation-viewer";
import type { PixelObject } from "@shared/types/pixel-asset";
import type { GridConfig } from "@/utils/frame-extraction";

export interface SpriteAnimationControlsProps {
  gridConfig: GridConfig;
  onGridConfigChange: (config: GridConfig) => void;
  animation: SpriteAnimation | null;
  activeObject: PixelObject | null;
  maxSize: number;
  halfSize: number;
  onAnimationChange?: (animation: SpriteAnimation) => void;
  className?: string;
}

export function SpriteAnimationControls({
  gridConfig,
  onGridConfigChange,
  animation,
  activeObject,
  maxSize,
  halfSize,
  onAnimationChange,
  className,
}: SpriteAnimationControlsProps) {
  const [localAnimation, setLocalAnimation] = useState<SpriteAnimation | null>(animation);

  // Update local animation when prop changes
  const handleAnimationChange = useCallback((newAnimation: SpriteAnimation) => {
    setLocalAnimation(newAnimation);
    onAnimationChange?.(newAnimation);
  }, [onAnimationChange]);

  // Handle grid config changes
  const handleRowsChange = useCallback((rows: number) => {
    onGridConfigChange({ ...gridConfig, rows: Math.max(1, Math.floor(rows)) });
  }, [gridConfig, onGridConfigChange]);

  const handleColsChange = useCallback((cols: number) => {
    onGridConfigChange({ ...gridConfig, cols: Math.max(1, Math.floor(cols)) });
  }, [gridConfig, onGridConfigChange]);

  // Calculate total cells
  const totalCells = gridConfig.rows * gridConfig.cols;

  // Handle adding frame to animation
  const handleAddFrame = useCallback(() => {
    if (!localAnimation) {
      // Create new animation if none exists
      const newAnimation: SpriteAnimation = {
        id: crypto.randomUUID(),
        name: "Animation",
        frames: [{ cellIndex: 0, duration: 100 }],
        loop: true,
        playing: false,
        gridConfig: gridConfig,
        stickyGrid: false,
      };
      handleAnimationChange(newAnimation);
      return;
    }

    const newFrame: AnimationFrame = {
      cellIndex: 0,
      duration: 100,
    };
    handleAnimationChange({
      ...localAnimation,
      frames: [...localAnimation.frames, newFrame],
    });
  }, [localAnimation, handleAnimationChange]);

  // Handle removing frame from animation
  const handleRemoveFrame = useCallback((index: number) => {
    if (!localAnimation) return;
    handleAnimationChange({
      ...localAnimation,
      frames: localAnimation.frames.filter((_, i) => i !== index),
    });
  }, [localAnimation, handleAnimationChange]);

  // Handle updating frame cell index
  const handleFrameCellIndexChange = useCallback((index: number, cellIndex: number) => {
    if (!localAnimation) return;
    const newFrames = [...localAnimation.frames];
    newFrames[index] = {
      ...newFrames[index],
      cellIndex: Math.max(0, Math.min(totalCells - 1, Math.floor(cellIndex))),
    };
    handleAnimationChange({
      ...localAnimation,
      frames: newFrames,
    });
  }, [localAnimation, totalCells, handleAnimationChange]);

  // Handle updating frame duration
  const handleFrameDurationChange = useCallback((index: number, duration: number) => {
    if (!localAnimation) return;
    const newFrames = [...localAnimation.frames];
    newFrames[index] = {
      ...newFrames[index],
      duration: Math.max(1, Math.floor(duration)),
    };
    handleAnimationChange({
      ...localAnimation,
      frames: newFrames,
    });
  }, [localAnimation, handleAnimationChange]);

  // Handle loop toggle
  const handleLoopChange = useCallback((loop: boolean) => {
    if (!localAnimation) return;
    handleAnimationChange({
      ...localAnimation,
      loop,
    });
  }, [localAnimation, handleAnimationChange]);

  // Handle sticky grid toggle
  const handleStickyGridChange = useCallback((sticky: boolean) => {
    if (!localAnimation) return;
    handleAnimationChange({
      ...localAnimation,
      stickyGrid: sticky,
    });
  }, [localAnimation, handleAnimationChange]);

  // Handle 'z' hotkey for sticky toggle
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't handle if user is typing in an input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }

      // Don't handle if Ctrl/Cmd is pressed (Ctrl+Z is undo)
      if (e.ctrlKey || e.metaKey) {
        return;
      }

      if (e.key === "z" || e.key === "Z") {
        e.preventDefault();
        e.stopPropagation();
        if (localAnimation) {
          handleStickyGridChange(!localAnimation.stickyGrid);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown, { capture: true });
    return () => {
      window.removeEventListener("keydown", handleKeyDown, { capture: true });
    };
  }, [localAnimation, handleStickyGridChange]);

  return (
    <div className={cn("flex flex-col gap-6", className)}>
      {/* Grid Configuration */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Grid Configuration</h3>
          <div className="flex items-center gap-2">
            <Label htmlFor="sticky-grid-toggle" className="text-xs cursor-pointer">
              Sticky Grid
            </Label>
            <Switch
              id="sticky-grid-toggle"
              checked={localAnimation?.stickyGrid ?? false}
              onCheckedChange={handleStickyGridChange}
            />
            <HotkeyTip keys={["Z"]} size="sm" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="grid-rows">Rows</Label>
            <Input
              id="grid-rows"
              type="number"
              min="1"
              max="32"
              value={gridConfig.rows}
              onChange={(e) => handleRowsChange(parseInt(e.target.value) || 1)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="grid-cols">Columns</Label>
            <Input
              id="grid-cols"
              type="number"
              min="1"
              max="32"
              value={gridConfig.cols}
              onChange={(e) => handleColsChange(parseInt(e.target.value) || 1)}
            />
          </div>
        </div>
        <div className="text-xs text-muted-foreground">
          Total cells: {totalCells} (Frame 0 to {totalCells - 1})
        </div>
      </div>

      {/* Animation Viewer */}
      {localAnimation && activeObject && (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold">Animation Preview</h3>
          <AnimationViewer
            animation={localAnimation}
            activeObject={activeObject}
            gridConfig={gridConfig}
            maxSize={maxSize}
            halfSize={halfSize}
            onAnimationUpdate={handleAnimationChange}
          />
        </div>
      )}

      {/* Animation Sequence Editor */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Animation Sequence</h3>
          <div className="flex items-center gap-2">
            <Label htmlFor="loop-toggle" className="text-xs cursor-pointer">
              Loop
            </Label>
            <input
              id="loop-toggle"
              type="checkbox"
              checked={localAnimation?.loop ?? false}
              onChange={(e) => handleLoopChange(e.target.checked)}
              className="h-4 w-4 rounded border-input"
            />
          </div>
        </div>

        {localAnimation && localAnimation.frames.length > 0 ? (
          <div className="space-y-2">
            {localAnimation.frames.map((frame, index) => (
              <div
                key={index}
                className="flex items-center gap-2 p-2 border rounded-lg bg-background"
              >
                <GripVertical className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <div className="flex-1 grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label htmlFor={`frame-${index}-cell`} className="text-xs">
                      Cell Index
                    </Label>
                    <Input
                      id={`frame-${index}-cell`}
                      type="number"
                      min="0"
                      max={totalCells - 1}
                      value={frame.cellIndex ?? 0}
                      onChange={(e) => handleFrameCellIndexChange(index, parseInt(e.target.value) || 0)}
                      className="h-8 text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor={`frame-${index}-duration`} className="text-xs">
                      Duration (ms)
                    </Label>
                    <Input
                      id={`frame-${index}-duration`}
                      type="number"
                      min="1"
                      value={frame.duration}
                      onChange={(e) => handleFrameDurationChange(index, parseInt(e.target.value) || 100)}
                      className="h-8 text-sm"
                    />
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemoveFrame(index)}
                  className="h-8 w-8 flex-shrink-0"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-muted-foreground text-center py-4">
            No frames in animation. Click "Add Frame" to start.
          </div>
        )}

        <Button
          variant="outline"
          onClick={handleAddFrame}
          className="w-full"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Frame
        </Button>
      </div>
    </div>
  );
}

