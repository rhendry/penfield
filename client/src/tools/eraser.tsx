import { PixelTool, ToolContext, ToolResult } from "./types";

/**
 * Check if coordinates are within canvas bounds
 */
function isInBounds(x: number, y: number, maxSize: number): boolean {
    const halfSize = maxSize / 2;
    return x >= -halfSize && x < halfSize && y >= -halfSize && y < halfSize;
}

/**
 * Eraser tool - removes pixels
 */
export const eraserTool: PixelTool = {
    id: "eraser",
    name: "Eraser",
    description: "Erase pixels",
    iconType: "lucide",
    iconName: "Eraser",
    hotkey: "2",
    
    onPixelClick: (x: number, y: number, _button: "left" | "right", context: ToolContext): ToolResult => {
        if (!isInBounds(x, y, context.maxSize)) {
            return { pixels: context.pixels };
        }
        
        const newPixels = { ...context.pixels };
        delete newPixels[`${x},${y}`];
        
        return {
            pixels: newPixels,
        };
    },
    
    onPixelDrag: (x: number, y: number, _button: "left" | "right", context: ToolContext): ToolResult => {
        if (!isInBounds(x, y, context.maxSize)) {
            return { pixels: context.pixels };
        }
        
        const newPixels = { ...context.pixels };
        delete newPixels[`${x},${y}`];
        
        return {
            pixels: newPixels,
        };
    },
    
    // Eraser doesn't need utilities
    utilities: undefined,
};

