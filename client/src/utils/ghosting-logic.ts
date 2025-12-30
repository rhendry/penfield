/**
 * Ghosting logic utilities for sprite animations
 * 
 * Determines which frames should show ghosts. Ghosts render the previous frame's
 * content in the next frame's cell with alpha transparency.
 */

export interface GhostOverlay {
  /** The cell index where the ghost should be rendered (the current frame's cell) */
  targetCellIndex: number;
  /** The cell index to extract pixels from (the previous frame's cell) */
  sourceCellIndex: number;
}

/**
 * Calculates ghost overlays for all frames in an animation sequence.
 * For each frame (except the first), creates a ghost overlay that renders
 * the previous frame's content in the current frame's cell.
 * 
 * @param frames Array of animation frames with cellIndex properties
 * @param loop Whether the animation loops
 * @returns Array of ghost overlays
 */
export function calculateGhostOverlays(
  frames: Array<{ cellIndex?: number }>,
  loop: boolean
): GhostOverlay[] {
  if (frames.length === 0) {
    return [];
  }

  const overlays: GhostOverlay[] = [];

  for (let i = 0; i < frames.length; i++) {
    const currentFrame = frames[i];
    if (currentFrame.cellIndex === undefined) {
      continue;
    }

    // Get the previous frame by index
    let prevFrameIndex: number | null = null;
    
    if (i === 0) {
      // First frame: show last frame as ghost if looping
      if (loop && frames.length > 1) {
        prevFrameIndex = frames.length - 1;
      } else {
        continue; // No previous frame to ghost
      }
    } else {
      // Frame N > 0: use frame N-1
      prevFrameIndex = i - 1;
    }

    const prevFrame = frames[prevFrameIndex];
    if (!prevFrame || prevFrame.cellIndex === undefined) {
      continue;
    }

    // Render previous frame's content as ghost in current frame's cell
    overlays.push({
      targetCellIndex: currentFrame.cellIndex, // Where to render the ghost
      sourceCellIndex: prevFrame.cellIndex,    // Where to extract pixels from
    });
  }

  return overlays;
}

