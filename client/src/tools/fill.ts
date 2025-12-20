import { PixelTool, ToolContext } from "./types";

/**
 * Fill Tool
 * 
 * Flood fills connected pixels of the same color.
 * Only responds to clicks, not drags.
 */

/**
 * Flood fill algorithm - fills connected pixels of the same color
 */
function floodFill(
    pixels: Record<string, string>,
    startX: number,
    startY: number,
    fillColor: string,
    maxSize: number
): Record<string, string> {
    const halfSize = maxSize / 2;
    const startKey = `${startX},${startY}`;
    const targetColor = pixels[startKey] || null;

    // If target color is same as fill color, no need to fill
    if (targetColor === fillColor) {
        return pixels;
    }

    const newPixels = { ...pixels };
    const visited = new Set<string>();
    const queue: Array<[number, number]> = [[startX, startY]];

    while (queue.length > 0) {
        const [x, y] = queue.shift()!;
        const key = `${x},${y}`;

        // Check bounds
        if (x < -halfSize || x >= halfSize || y < -halfSize || y >= halfSize) {
            continue;
        }

        // Skip if already visited
        if (visited.has(key)) {
            continue;
        }

        // Check if this pixel matches the target color
        const currentColor = newPixels[key] || null;
        if (currentColor !== targetColor) {
            continue;
        }

        // Mark as visited and fill
        visited.add(key);
        newPixels[key] = fillColor;

        // Add neighbors to queue (4-directional)
        queue.push([x + 1, y]);
        queue.push([x - 1, y]);
        queue.push([x, y + 1]);
        queue.push([x, y - 1]);
    }

    return newPixels;
}

export const fillTool: PixelTool = {
    id: "fill",
    name: "Fill",
    description: "Flood fill connected pixels of the same color",
    iconType: "lucide",
    iconName: "PaintBucket",
    hotkey: "3",
    
    onActivate: () => {
        // No state to initialize
    },
    
    onDeactivate: () => {
        // No cleanup needed
    },
    
    onPointerDown: (x, y, button, context) => {
        const color = button === "left" ? context.leftClickColor : context.rightClickColor;
        const newPixels = floodFill(context.pixels, x, y, color, context.maxSize);
        context.setPixels(newPixels);
    },
    
    onPointerMove: () => {
        // Fill doesn't respond to drag
    },
    
    onPointerUp: () => {
        // Nothing to do
    },
    
    utilities: undefined,
};

