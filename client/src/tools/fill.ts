import type { PixelTool, ToolContext, PixelDelta } from "./types";

/**
 * Fill Tool
 * 
 * Flood fills connected pixels of the same color.
 * Only responds to clicks, not drags.
 */

/**
 * Flood fill algorithm - fills connected pixels of the same color
 * Uses getPixel for reading and returns a delta for efficient updates
 */
function floodFill(
    context: ToolContext,
    startX: number,
    startY: number,
    fillColor: string
): PixelDelta {
    const { halfSize, getPixel } = context;

    // Check bounds
    if (startX < -halfSize || startX >= halfSize || startY < -halfSize || startY >= halfSize) {
        return {};
    }

    const targetColor = getPixel(startX, startY);

    // If target color is same as fill color, no need to fill
    if (targetColor === fillColor) {
        return {};
    }

    const delta: PixelDelta = {};
    const visited = new Set<string>();

    // Use typed array for queue with index tracking (avoids shift() which is O(n))
    const maxSize = halfSize * 2;
    const maxQueueSize = maxSize * maxSize;
    const queueX = new Int16Array(maxQueueSize);
    const queueY = new Int16Array(maxQueueSize);
    let queueHead = 0;
    let queueTail = 0;

    // Enqueue start position
    queueX[queueTail] = startX;
    queueY[queueTail] = startY;
    queueTail++;

    while (queueHead < queueTail) {
        const x = queueX[queueHead];
        const y = queueY[queueHead];
        queueHead++;

        const key = `${x},${y}`;

        // Skip if already visited
        if (visited.has(key)) {
            continue;
        }

        // Check bounds
        if (x < -halfSize || x >= halfSize || y < -halfSize || y >= halfSize) {
            continue;
        }

        // Check if this pixel matches the target color
        // Use delta first (in case we already filled it), then getPixel
        const currentColor = delta[key] !== undefined
            ? delta[key]
            : getPixel(x, y);

        if (currentColor !== targetColor) {
            continue;
        }

        // Mark as visited and fill
        visited.add(key);
        delta[key] = fillColor;

        // Add neighbors to queue (4-directional)
        queueX[queueTail] = x + 1;
        queueY[queueTail++] = y;
        queueX[queueTail] = x - 1;
        queueY[queueTail++] = y;
        queueX[queueTail] = x;
        queueY[queueTail++] = y + 1;
        queueX[queueTail] = x;
        queueY[queueTail++] = y - 1;
    }

    return delta;
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
        const delta = floodFill(context, x, y, color);

        if (Object.keys(delta).length > 0) {
            context.applyPixels(delta);
        }
    },

    onPointerMove: () => {
        // Fill doesn't respond to drag
    },

    onPointerUp: () => {
        // Nothing to do
    },

    utilities: undefined,
};
