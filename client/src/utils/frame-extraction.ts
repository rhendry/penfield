import type { PixelObject } from "@shared/types/pixel-asset";

export interface GridConfig {
  rows: number;
  cols: number;
}

export interface CellBounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

/**
 * Calculate the pixel bounds for a grid cell
 * @param gridConfig Grid configuration (rows, cols)
 * @param cellIndex Cell index (0 = top-left, increments left-to-right, top-to-bottom)
 * @param maxSize Canvas size in pixels
 * @param halfSize Half of canvas size (canvas center offset)
 * @returns Bounds of the cell in canvas coordinates
 */
export function getGridCellBounds(
  gridConfig: GridConfig,
  cellIndex: number,
  maxSize: number,
  halfSize: number
): CellBounds {
  const { rows, cols } = gridConfig;
  
  // Calculate cell dimensions
  const cellWidth = maxSize / cols;
  const cellHeight = maxSize / rows;
  
  // Convert cell index to row/col
  const row = Math.floor(cellIndex / cols);
  const col = cellIndex % cols;
  
  // Calculate bounds in canvas coordinates
  // Canvas coordinates: -halfSize to +halfSize
  // Frame 0 starts at top-left: (-halfSize, -halfSize)
  const minX = -halfSize + col * cellWidth;
  const minY = -halfSize + row * cellHeight;
  const maxX = minX + cellWidth;
  const maxY = minY + cellHeight;
  
  return { minX, minY, maxX, maxY };
}

/**
 * Extract pixels from a grid cell region
 * @param object Pixel object to extract from
 * @param gridConfig Grid configuration
 * @param cellIndex Cell index to extract
 * @param maxSize Canvas size in pixels
 * @param halfSize Half of canvas size
 * @returns Pixel grid containing only pixels within the cell bounds
 */
export function extractFrameFromGrid(
  object: PixelObject,
  gridConfig: GridConfig,
  cellIndex: number,
  maxSize: number,
  halfSize: number
): Record<string, string> {
  const bounds = getGridCellBounds(gridConfig, cellIndex, maxSize, halfSize);
  const framePixels: Record<string, string> = {};
  
  // Extract pixels within cell bounds
  for (const [key, color] of Object.entries(object.pixels)) {
    const commaIdx = key.indexOf(",");
    if (commaIdx === -1) continue;
    
    const x = parseInt(key.slice(0, commaIdx), 10);
    const y = parseInt(key.slice(commaIdx + 1), 10);
    
    // Check if pixel is within cell bounds
    // Note: bounds are exclusive on maxX/maxY (cell boundaries)
    if (x >= bounds.minX && x < bounds.maxX && y >= bounds.minY && y < bounds.maxY) {
      // Convert to relative coordinates within the cell (0,0 at cell top-left)
      const relX = x - bounds.minX;
      const relY = y - bounds.minY;
      framePixels[`${relX},${relY}`] = color;
    }
  }
  
  return framePixels;
}

/**
 * Get the cell index for a given canvas coordinate
 * @param x Canvas X coordinate
 * @param y Canvas Y coordinate
 * @param gridConfig Grid configuration
 * @param maxSize Canvas size in pixels
 * @param halfSize Half of canvas size
 * @returns Cell index, or -1 if outside grid bounds
 */
export function getCellIndexFromCoordinate(
  x: number,
  y: number,
  gridConfig: GridConfig,
  maxSize: number,
  halfSize: number
): number {
  const { rows, cols } = gridConfig;
  
  // Check if coordinate is within canvas bounds
  if (x < -halfSize || x >= halfSize || y < -halfSize || y >= halfSize) {
    return -1;
  }
  
  // Calculate cell dimensions
  const cellWidth = maxSize / cols;
  const cellHeight = maxSize / rows;
  
  // Convert canvas coordinate to grid position
  const col = Math.floor((x + halfSize) / cellWidth);
  const row = Math.floor((y + halfSize) / cellHeight);
  
  // Clamp to valid grid bounds
  if (col < 0 || col >= cols || row < 0 || row >= rows) {
    return -1;
  }
  
  return row * cols + col;
}

