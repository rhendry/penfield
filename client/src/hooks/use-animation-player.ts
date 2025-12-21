import { useState, useEffect, useRef, useCallback } from "react";
import type { SpriteAnimation, PixelObject } from "@shared/types/pixel-asset";
import { getObjectById } from "@shared/utils/pixel-asset";

export interface UseAnimationPlayerOptions {
  animation: SpriteAnimation;
  content: { objects: PixelObject[] };
  onFrameChange?: (frameIndex: number) => void;
  onObjectVisibilityChange?: (objectId: string, visible: boolean) => void;
}

export function useAnimationPlayer({
  animation,
  content,
  onFrameChange,
  onObjectVisibilityChange,
}: UseAnimationPlayerOptions) {
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(animation.playing);
  const frameTimeoutRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const accumulatedTimeRef = useRef<number>(0);

  // Update playing state when animation changes
  useEffect(() => {
    setIsPlaying(animation.playing);
  }, [animation.playing]);

  // Update object visibility based on current frame
  const updateObjectVisibility = useCallback(
    (frameIndex: number) => {
      if (animation.frames.length === 0) return;

      const currentFrame = animation.frames[frameIndex];
      if (!currentFrame) return;

      // Hide all frame objects
      for (const frame of animation.frames) {
        const obj = getObjectById(content as any, frame.objectId);
        if (obj) {
          onObjectVisibilityChange?.(frame.objectId, false);
        }
      }

      // Show current frame object
      const currentObj = getObjectById(content as any, currentFrame.objectId);
      if (currentObj) {
        onObjectVisibilityChange?.(currentFrame.objectId, true);
      }
    },
    [animation.frames, content, onObjectVisibilityChange]
  );

  // Advance to next frame
  const advanceFrame = useCallback(() => {
    if (animation.frames.length === 0) return;

    const nextIndex = currentFrameIndex + 1;
    if (nextIndex >= animation.frames.length) {
      if (animation.loop) {
        setCurrentFrameIndex(0);
        onFrameChange?.(0);
        updateObjectVisibility(0);
      } else {
        setIsPlaying(false);
      }
    } else {
      setCurrentFrameIndex(nextIndex);
      onFrameChange?.(nextIndex);
      updateObjectVisibility(nextIndex);
    }
  }, [animation.frames.length, animation.loop, currentFrameIndex, onFrameChange, updateObjectVisibility]);

  // Play animation
  const play = useCallback(() => {
    setIsPlaying(true);
    startTimeRef.current = Date.now();
    accumulatedTimeRef.current = 0;
  }, []);

  // Pause animation
  const pause = useCallback(() => {
    setIsPlaying(false);
    if (frameTimeoutRef.current !== null) {
      clearTimeout(frameTimeoutRef.current);
      frameTimeoutRef.current = null;
    }
    if (startTimeRef.current !== null) {
      accumulatedTimeRef.current += Date.now() - startTimeRef.current;
      startTimeRef.current = null;
    }
  }, []);

  // Reset animation
  const reset = useCallback(() => {
    setIsPlaying(false);
    setCurrentFrameIndex(0);
    accumulatedTimeRef.current = 0;
    startTimeRef.current = null;
    if (frameTimeoutRef.current !== null) {
      clearTimeout(frameTimeoutRef.current);
      frameTimeoutRef.current = null;
    }
    updateObjectVisibility(0);
    onFrameChange?.(0);
  }, [onFrameChange, updateObjectVisibility]);

  // Go to specific frame
  const goToFrame = useCallback(
    (frameIndex: number) => {
      if (frameIndex < 0 || frameIndex >= animation.frames.length) return;
      setCurrentFrameIndex(frameIndex);
      onFrameChange?.(frameIndex);
      updateObjectVisibility(frameIndex);
    },
    [animation.frames.length, onFrameChange, updateObjectVisibility]
  );

  // Animation loop
  useEffect(() => {
    if (!isPlaying || animation.frames.length === 0) {
      if (frameTimeoutRef.current !== null) {
        clearTimeout(frameTimeoutRef.current);
        frameTimeoutRef.current = null;
      }
      return;
    }

    const currentFrame = animation.frames[currentFrameIndex];
    if (!currentFrame) return;

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
  }, [isPlaying, currentFrameIndex, animation.frames, advanceFrame]);

  // Initialize visibility on mount
  useEffect(() => {
    updateObjectVisibility(currentFrameIndex);
  }, []); // Only run on mount

  return {
    currentFrameIndex,
    isPlaying,
    play,
    pause,
    reset,
    goToFrame,
  };
}

