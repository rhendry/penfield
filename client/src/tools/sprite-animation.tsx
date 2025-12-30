import { useState, useCallback, useEffect } from "react";
import type { PixelTool } from "./types";
import { SpriteAnimationControls } from "@/components/utilities/sprite-animation-controls";
import { useRenderContext } from "@/components/editor/render-context";
import { getActiveObject } from "@shared/utils/pixel-asset";
import type { GridConfig } from "@/utils/frame-extraction";
import type { SpriteAnimation } from "@shared/types/pixel-asset";

// Tool-specific state (persists across events while tool is active)
// Grid config is stored here so PixelCanvas can access it
// This is synced from the current animation's gridConfig
let gridConfig: GridConfig = { rows: 2, cols: 2 };
let stickyGrid: boolean = false;

export const spriteAnimationTool: PixelTool = {
  id: "sprite-animation",
  name: "Sprite Animation",
  description: "Create sprite animations using a grid overlay",
  iconType: "lucide",
  iconName: "Film",

  onActivate: () => {
    // Tool activation - ensure default grid config is set immediately
    // This ensures grid shows up right away before utilities component initializes
    gridConfig = { rows: 2, cols: 2 };
  },

  onDeactivate: () => {
    // Tool deactivation - cleanup if needed
  },

  onPointerDown: () => {
    // Animation tool doesn't handle drawing - purely for configuration
  },

  onPointerMove: () => {
    // Animation tool doesn't handle drawing - purely for configuration
  },

  onPointerUp: () => {
    // Animation tool doesn't handle drawing - purely for configuration
  },

  utilities: <SpriteAnimationToolUtilities />,
};

function SpriteAnimationToolUtilities() {
  const { content, setContent, markDirty } = useRenderContext();
  const [localAnimation, setLocalAnimation] = useState<SpriteAnimation | null>(null);

  // Initialize from content - ensure grid config is set immediately
  useEffect(() => {
    const animation = content.animations.length > 0 ? content.animations[0] : null;
    if (animation && !localAnimation) {
      setLocalAnimation(animation);
      // Initialize grid config immediately
      if (animation.gridConfig) {
        gridConfig = animation.gridConfig;
      } else {
        // If no grid config, set default
        gridConfig = { rows: 2, cols: 2 };
      }
      stickyGrid = animation.stickyGrid || false;
    } else if (!animation) {
      // No animation exists yet - ensure default grid config is set
      // This ensures grid shows immediately when tool is activated
      gridConfig = { rows: 2, cols: 2 };
      stickyGrid = false;
    }
  }, [content.animations, localAnimation]);

  // Get active object
  const activeObject = getActiveObject(content);
  const maxSize = 256;
  const halfSize = maxSize / 2;

  // Use local animation or first animation from content
  const currentAnimation = localAnimation || (content.animations.length > 0 ? content.animations[0] : null);

  // Get grid config from animation, or use default
  const gridConfigFromAnimation: GridConfig = currentAnimation?.gridConfig || { rows: 2, cols: 2 };

  // Sync module-level grid config and sticky state when animation changes
  useEffect(() => {
    gridConfig = gridConfigFromAnimation;
    stickyGrid = currentAnimation?.stickyGrid || false;
  }, [gridConfigFromAnimation, currentAnimation?.stickyGrid]);

  const handleAnimationChange = useCallback((animation: SpriteAnimation) => {
    setLocalAnimation(animation);

    // Update module-level grid config and sticky state
    gridConfig = animation.gridConfig || { rows: 2, cols: 2 };
    stickyGrid = animation.stickyGrid || false;

    // Update content with animation
    const existingIndex = content.animations.findIndex(a => a.id === animation.id);
    const newAnimations = [...content.animations];

    if (existingIndex >= 0) {
      newAnimations[existingIndex] = animation;
    } else {
      newAnimations.push(animation);
    }

    setContent({
      ...content,
      animations: newAnimations,
    });
    markDirty();
  }, [content, setContent, markDirty]);

  // Handle grid config changes - update the animation
  const handleGridConfigChange = useCallback((config: GridConfig) => {
    // Update module-level grid config immediately for canvas
    gridConfig = config;

    if (!currentAnimation) {
      // Create a new animation with the grid config if none exists
      const newAnimation: SpriteAnimation = {
        id: crypto.randomUUID(),
        name: "Animation",
        frames: [],
        loop: true,
        playing: false,
        gridConfig: config,
        stickyGrid: false,
      };
      handleAnimationChange(newAnimation);
      return;
    }

    const updatedAnimation: SpriteAnimation = {
      ...currentAnimation,
      gridConfig: config,
    };

    handleAnimationChange(updatedAnimation);
  }, [currentAnimation, handleAnimationChange]);

  return (
    <SpriteAnimationControls
      gridConfig={gridConfigFromAnimation}
      onGridConfigChange={handleGridConfigChange}
      animation={currentAnimation}
      activeObject={activeObject}
      maxSize={maxSize}
      halfSize={halfSize}
      onAnimationChange={handleAnimationChange}
    />
  );
}

// Export function to get current grid config (for PixelCanvas)
export function getSpriteAnimationGridConfig(): GridConfig | null {
  return gridConfig;
}

// Export function to check if grid should be sticky
export function isSpriteAnimationGridSticky(): boolean {
  return stickyGrid;
}

