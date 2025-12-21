import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Play, Pause, SkipBack, SkipForward, Trash2, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SpriteAnimation, AnimationFrame } from "@shared/types/pixel-asset";

export interface AnimationTimelineProps {
  animation: SpriteAnimation;
  currentFrameIndex: number;
  onAnimationChange?: (animation: SpriteAnimation) => void;
  onFrameSelect?: (frameIndex: number) => void;
  onPlayPause?: () => void;
  onFrameAdd?: () => void;
  onFrameDelete?: (frameIndex: number) => void;
  onFrameDurationChange?: (frameIndex: number, duration: number) => void;
  className?: string;
}

export function AnimationTimeline({
  animation,
  currentFrameIndex,
  onAnimationChange,
  onFrameSelect,
  onPlayPause,
  onFrameAdd,
  onFrameDelete,
  onFrameDurationChange,
  className,
}: AnimationTimelineProps) {
  const totalDuration = animation.frames.reduce((sum, frame) => sum + frame.duration, 0);

  return (
    <div className={cn("flex flex-col border rounded-lg bg-card", className)}>
      <div className="p-3 border-b flex items-center justify-between">
        <h3 className="text-sm font-semibold">{animation.name}</h3>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => onFrameSelect?.(currentFrameIndex > 0 ? currentFrameIndex - 1 : animation.frames.length - 1)}
            disabled={animation.frames.length === 0}
          >
            <SkipBack className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={onPlayPause}
            disabled={animation.frames.length === 0}
          >
            {animation.playing ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => onFrameSelect?.(currentFrameIndex < animation.frames.length - 1 ? currentFrameIndex + 1 : 0)}
            disabled={animation.frames.length === 0}
          >
            <SkipForward className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="p-3 space-y-2">
        {animation.frames.length === 0 ? (
          <div className="text-sm text-muted-foreground text-center py-4">
            No frames. Click + to add a frame.
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onFrameAdd}
                className="flex items-center gap-1"
              >
                <Plus className="h-3 w-3" />
                Add Frame
              </Button>
              <div className="text-xs text-muted-foreground ml-auto">
                Total: {totalDuration}ms
              </div>
            </div>

            <div className="space-y-1">
              {animation.frames.map((frame, index) => (
                <FrameItem
                  key={index}
                  frame={frame}
                  index={index}
                  isCurrent={index === currentFrameIndex}
                  onClick={() => onFrameSelect?.(index)}
                  onDurationChange={(duration) => onFrameDurationChange?.(index, duration)}
                  onDelete={() => onFrameDelete?.(index)}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

interface FrameItemProps {
  frame: AnimationFrame;
  index: number;
  isCurrent: boolean;
  onClick?: () => void;
  onDurationChange?: (duration: number) => void;
  onDelete?: () => void;
}

function FrameItem({
  frame,
  index,
  isCurrent,
  onClick,
  onDurationChange,
  onDelete,
}: FrameItemProps) {
  const [duration, setDuration] = React.useState(frame.duration.toString());

  React.useEffect(() => {
    setDuration(frame.duration.toString());
  }, [frame.duration]);

  const handleBlur = () => {
    const numValue = parseInt(duration, 10);
    if (!isNaN(numValue) && numValue >= 0) {
      onDurationChange?.(numValue);
    } else {
      setDuration(frame.duration.toString());
    }
  };

  return (
    <div
      className={cn(
        "flex items-center gap-2 p-2 rounded border cursor-pointer transition-colors",
        isCurrent && "bg-accent border-primary"
      )}
      onClick={onClick}
    >
      <div className="text-xs font-mono w-8 text-muted-foreground">
        {index}
      </div>
      <div className="flex-1 text-sm truncate">Object: {frame.objectId.slice(0, 8)}...</div>
      <div className="flex items-center gap-1">
        <Label htmlFor={`frame-${index}-duration`} className="text-xs text-muted-foreground">
          Duration:
        </Label>
        <Input
          id={`frame-${index}-duration`}
          type="number"
          min="0"
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
          onBlur={handleBlur}
          onClick={(e) => e.stopPropagation()}
          className="h-7 w-16 text-xs"
        />
        <span className="text-xs text-muted-foreground">ms</span>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6"
        onClick={(e) => {
          e.stopPropagation();
          onDelete?.();
        }}
      >
        <Trash2 className="h-3 w-3" />
      </Button>
    </div>
  );
}

