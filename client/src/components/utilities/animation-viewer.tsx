import { useEffect, useRef, useState, useCallback } from "react";
import { Play, Pause, SkipBack, SkipForward, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { SpriteAnimation, PixelObject } from "@shared/types/pixel-asset";
import { extractFrameFromGrid, type GridConfig } from "@/utils/frame-extraction";

export interface AnimationViewerProps {
  animation: SpriteAnimation;
  activeObject: PixelObject | null;
  gridConfig: GridConfig;
  maxSize: number;
  halfSize: number;
  onAnimationUpdate?: (animation: SpriteAnimation) => void;
  className?: string;
}

/**
 * Parse color string to RGBA (0-255)
 */
function parseColor(color: string): [number, number, number, number] {
  const rgbaMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
  if (rgbaMatch) {
    return [
      parseInt(rgbaMatch[1], 10),
      parseInt(rgbaMatch[2], 10),
      parseInt(rgbaMatch[3], 10),
      rgbaMatch[4] ? Math.round(parseFloat(rgbaMatch[4]) * 255) : 255
    ];
  }

  let hex = color;
  if (hex.startsWith('#')) hex = hex.slice(1);
  if (hex.length === 3) {
    hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  }
  if (hex.length === 6) {
    return [
      parseInt(hex.slice(0, 2), 16),
      parseInt(hex.slice(2, 4), 16),
      parseInt(hex.slice(4, 6), 16),
      255
    ];
  }
  if (hex.length === 8) {
    return [
      parseInt(hex.slice(0, 2), 16),
      parseInt(hex.slice(2, 4), 16),
      parseInt(hex.slice(4, 6), 16),
      parseInt(hex.slice(6, 8), 16)
    ];
  }
  return [0, 0, 0, 255];
}

/**
 * Render frame pixels to canvas
 */
function renderFrameToCanvas(
  canvas: HTMLCanvasElement,
  framePixels: Record<string, string>,
  cellWidth: number,
  cellHeight: number
) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  // Clear canvas with white background
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Create a temporary canvas at exact cell dimensions for 1:1 pixel rendering
  const tempCanvas = document.createElement("canvas");
  tempCanvas.width = Math.ceil(cellWidth);
  tempCanvas.height = Math.ceil(cellHeight);
  const tempCtx = tempCanvas.getContext("2d");
  if (!tempCtx) return;

  // Fill temp canvas with white background
  tempCtx.fillStyle = "#ffffff";
  tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

  // Render pixels at 1:1 scale (no gaps possible)
  for (const [key, color] of Object.entries(framePixels)) {
    const commaIdx = key.indexOf(",");
    if (commaIdx === -1) continue;

    const x = parseInt(key.slice(0, commaIdx), 10);
    const y = parseInt(key.slice(commaIdx + 1), 10);

    // Skip pixels outside cell bounds
    if (x < 0 || x >= cellWidth || y < 0 || y >= cellHeight) continue;

    const [r, g, b, a] = parseColor(color);
    tempCtx.fillStyle = `rgba(${r}, ${g}, ${b}, ${a / 255})`;
    tempCtx.fillRect(x, y, 1, 1);
  }

  // Calculate scale to fit frame in canvas
  const scaleX = canvas.width / cellWidth;
  const scaleY = canvas.height / cellHeight;
  const scale = Math.min(scaleX, scaleY);

  // Center the frame
  const scaledWidth = cellWidth * scale;
  const scaledHeight = cellHeight * scale;
  const offsetX = (canvas.width - scaledWidth) / 2;
  const offsetY = (canvas.height - scaledHeight) / 2;

  // Disable image smoothing for pixel-perfect scaling
  ctx.imageSmoothingEnabled = false;
  
  // Draw the scaled temp canvas to the display canvas
  ctx.drawImage(
    tempCanvas,
    0, 0, tempCanvas.width, tempCanvas.height,
    offsetX, offsetY, scaledWidth, scaledHeight
  );
}

export function AnimationViewer({
  animation,
  activeObject,
  gridConfig,
  maxSize,
  halfSize,
  onAnimationUpdate,
  className,
}: AnimationViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(animation.playing);
  const frameTimeoutRef = useRef<number | null>(null);

  // Calculate cell dimensions
  const cellWidth = maxSize / gridConfig.cols;
  const cellHeight = maxSize / gridConfig.rows;

  // Get current frame
  const currentFrame = animation.frames[currentFrameIndex];
  const currentCellIndex = currentFrame?.cellIndex ?? -1;

  // Extract and render current frame
  useEffect(() => {
    if (!canvasRef.current || !activeObject || currentCellIndex < 0) return;

    const framePixels = extractFrameFromGrid(
      activeObject,
      gridConfig,
      currentCellIndex,
      maxSize,
      halfSize
    );

    renderFrameToCanvas(canvasRef.current, framePixels, cellWidth, cellHeight);
  }, [activeObject, gridConfig, currentCellIndex, maxSize, halfSize, cellWidth, cellHeight]);

  // Update playing state when animation changes
  useEffect(() => {
    setIsPlaying(animation.playing);
  }, [animation.playing]);

  // Advance to next frame
  const advanceFrame = useCallback(() => {
    if (animation.frames.length === 0) return;

    const nextIndex = currentFrameIndex + 1;
    if (nextIndex >= animation.frames.length) {
      if (animation.loop) {
        setCurrentFrameIndex(0);
      } else {
        setIsPlaying(false);
        if (onAnimationUpdate) {
          onAnimationUpdate({ ...animation, playing: false });
        }
      }
    } else {
      setCurrentFrameIndex(nextIndex);
    }
  }, [animation, currentFrameIndex, onAnimationUpdate]);

  // Play animation
  const play = useCallback(() => {
    setIsPlaying(true);
    if (onAnimationUpdate) {
      onAnimationUpdate({ ...animation, playing: true });
    }
  }, [animation, onAnimationUpdate]);

  // Pause animation
  const pause = useCallback(() => {
    setIsPlaying(false);
    if (frameTimeoutRef.current !== null) {
      clearTimeout(frameTimeoutRef.current);
      frameTimeoutRef.current = null;
    }
    if (onAnimationUpdate) {
      onAnimationUpdate({ ...animation, playing: false });
    }
  }, [animation, onAnimationUpdate]);

  // Reset animation
  const reset = useCallback(() => {
    setIsPlaying(false);
    setCurrentFrameIndex(0);
    if (frameTimeoutRef.current !== null) {
      clearTimeout(frameTimeoutRef.current);
      frameTimeoutRef.current = null;
    }
    if (onAnimationUpdate) {
      onAnimationUpdate({ ...animation, playing: false });
    }
  }, [animation, onAnimationUpdate]);

  // Go to previous frame
  const goToPreviousFrame = useCallback(() => {
    if (animation.frames.length === 0) return;
    const prevIndex = currentFrameIndex > 0 ? currentFrameIndex - 1 : animation.frames.length - 1;
    setCurrentFrameIndex(prevIndex);
  }, [animation.frames.length, currentFrameIndex]);

  // Go to next frame
  const goToNextFrame = useCallback(() => {
    if (animation.frames.length === 0) return;
    const nextIndex = currentFrameIndex < animation.frames.length - 1 ? currentFrameIndex + 1 : 0;
    setCurrentFrameIndex(nextIndex);
  }, [animation.frames.length, currentFrameIndex]);

  // Animation loop
  useEffect(() => {
    if (!isPlaying || animation.frames.length === 0 || !currentFrame) {
      if (frameTimeoutRef.current !== null) {
        clearTimeout(frameTimeoutRef.current);
        frameTimeoutRef.current = null;
      }
      return;
    }

    const scheduleNextFrame = () => {
      if (frameTimeoutRef.current !== null) {
        clearTimeout(frameTimeoutRef.current);
      }

      frameTimeoutRef.current = window.setTimeout(() => {
        advanceFrame();
      }, currentFrame.duration);
    };

    scheduleNextFrame();

    return () => {
      if (frameTimeoutRef.current !== null) {
        clearTimeout(frameTimeoutRef.current);
        frameTimeoutRef.current = null;
      }
    };
  }, [isPlaying, currentFrameIndex, animation.frames, currentFrame, advanceFrame]);

  if (!activeObject || animation.frames.length === 0) {
    return (
      <div className={cn("flex items-center justify-center p-8 text-muted-foreground", className)}>
        No animation frames configured
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      {/* Preview Canvas */}
      <div className="relative bg-background border rounded-lg overflow-hidden">
        <canvas
          ref={canvasRef}
          width={200}
          height={200}
          className="w-full h-auto"
          style={{ imageRendering: "pixelated" }}
        />
      </div>

      {/* Frame Info */}
      <div className="text-sm text-center text-muted-foreground">
        Frame {currentFrameIndex + 1} of {animation.frames.length}
        {currentCellIndex >= 0 && ` (Cell ${currentCellIndex})`}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={reset}
          title="Reset"
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={goToPreviousFrame}
          title="Previous Frame"
        >
          <SkipBack className="h-4 w-4" />
        </Button>
        <Button
          variant="default"
          size="icon"
          onClick={isPlaying ? pause : play}
          title={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? (
            <Pause className="h-4 w-4" />
          ) : (
            <Play className="h-4 w-4" />
          )}
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={goToNextFrame}
          title="Next Frame"
        >
          <SkipForward className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

