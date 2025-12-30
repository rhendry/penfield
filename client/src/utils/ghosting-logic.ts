/**
 * Ghosting logic utilities for sprite animations
 * 
 * Ghosts render the previous cell's content in the next cell with alpha transparency.
 * This is based on grid layout, NOT animation sequence.
 */

import type { GridConfig } from "./frame-extraction";

export interface GhostOverlay {
  /** The cell index where the ghost should be rendered */
  targetCellIndex: number;
  /** The cell index to extract pixels from (the previous cell) */
  sourceCellIndex: number;
}

/**
 * Calculates ghost overlays for ALL cells in the grid.
 * For each cell (except cell 0), creates a ghost overlay that renders
 * the previous cell's content. This is based on grid position, not animation sequence.
 * 
 * @param gridConfig Grid configuration (rows, cols)
 * @param loop Whether to show last cell as ghost in first cell when looping
 * @returns Array of ghost overlays
 */
export function calculateGhostOverlays(
  gridConfig: GridConfig,
  loop: boolean
): GhostOverlay[] {
  const { rows, cols } = gridConfig;
  const totalCells = rows * cols;
  
  if (totalCells === 0) {
    return [];
  }

  const overlays: GhostOverlay[] = [];

  // For each cell in the grid (except cell 0), draw the previous cell as a ghost
  for (let cellIndex = 0; cellIndex < totalCells; cellIndex++) {
    let sourceCellIndex: number | null = null;
    
    if (cellIndex === 0) {
      // First cell: show last cell as ghost if looping
      if (loop && totalCells > 1) {
        sourceCellIndex = totalCells - 1;
      } else {
        continue; // No previous cell to ghost
      }
    } else {
      // Cell N > 0: use cell N-1
      sourceCellIndex = cellIndex - 1;
    }

    overlays.push({
      targetCellIndex: cellIndex,
      sourceCellIndex: sourceCellIndex,
    });
  }

  return overlays;
}

