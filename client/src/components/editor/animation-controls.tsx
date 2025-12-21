import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Play, Pause, SkipBack, SkipForward, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SpriteAnimation } from "@shared/types/pixel-asset";

export interface AnimationControlsProps {
  animation: SpriteAnimation;
  currentFrameIndex: number;
  isPlaying: boolean;
  onPlay?: () => void;
  onPause?: () => void;
  onReset?: () => void;
  onFrameNext?: () => void;
  onFramePrev?: () => void;
  onFrameGoTo?: (frameIndex: number) => void;
  onSpeedChange?: (speed: number) => void;
  speed?: number;
  className?: string;
}

export function AnimationControls({
  animation,
  currentFrameIndex,
  isPlaying,
  onPlay,
  onPause,
  onReset,
  onFrameNext,
  onFramePrev,
  onFrameGoTo,
  onSpeedChange,
  speed = 1.0,
  className,
}: AnimationControlsProps) {
  const totalDuration = animation.frames.reduce((sum, frame) => sum + frame.duration, 0);
  const currentTime = animation.frames
    .slice(0, currentFrameIndex)
    .reduce((sum, frame) => sum + frame.duration, 0);
  const progress = totalDuration > 0 ? currentTime / totalDuration : 0;

  const handleScrub = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if (isNaN(value)) return;

    // Find frame index based on progress
    let accumulated = 0;
    for (let i = 0; i < animation.frames.length; i++) {
      const frameDuration = animation.frames[i].duration;
      if (accumulated + frameDuration > value * totalDuration) {
        onFrameGoTo?.(i);
        return;
      }
      accumulated += frameDuration;
    }
    onFrameGoTo?.(animation.frames.length - 1);
  };

  return (
    <div className={cn("flex flex-col border rounded-lg bg-card p-3 space-y-3", className)}>
      <div className="flex items-center justify-between">
        <Label className="text-sm font-semibold">{animation.name}</Label>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={onReset}
            disabled={animation.frames.length === 0}
            title="Reset"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={onFramePrev}
          disabled={animation.frames.length === 0}
          title="Previous frame"
        >
          <SkipBack className="h-4 w-4" />
        </Button>
        <Button
          variant="default"
          size="icon"
          className="h-8 w-8"
          onClick={isPlaying ? onPause : onPlay}
          disabled={animation.frames.length === 0}
          title={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? (
            <Pause className="h-4 w-4" />
          ) : (
            <Play className="h-4 w-4" />
          )}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={onFrameNext}
          disabled={animation.frames.length === 0}
          title="Next frame"
        >
          <SkipForward className="h-4 w-4" />
        </Button>
      </div>

      {animation.frames.length > 0 && (
        <>
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Timeline</span>
              <span>
                {Math.round(currentTime)}ms / {totalDuration}ms
              </span>
            </div>
            <Input
              type="range"
              min="0"
              max="1"
              step="0.001"
              value={progress}
              onChange={handleScrub}
              className="h-2 cursor-pointer"
            />
          </div>

          <div className="flex items-center gap-2">
            <Label htmlFor="animation-speed" className="text-xs text-muted-foreground">
              Speed:
            </Label>
            <Input
              id="animation-speed"
              type="number"
              min="0.1"
              max="5"
              step="0.1"
              value={speed.toFixed(1)}
              onChange={(e) => {
                const newSpeed = parseFloat(e.target.value);
                if (!isNaN(newSpeed) && newSpeed > 0) {
                  onSpeedChange?.(newSpeed);
                }
              }}
              className="h-7 w-16 text-xs"
            />
            <span className="text-xs text-muted-foreground">x</span>
          </div>

          <div className="text-xs text-muted-foreground text-center">
            Frame {currentFrameIndex + 1} / {animation.frames.length}
          </div>
        </>
      )}
    </div>
  );
}

