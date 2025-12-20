/**
 * Tools Library
 * 
 * Centralized location for all pixel editor tools.
 * Each tool implements the PixelTool interface and handles
 * its own input processing, interpolation, and state management.
 */

export { penTool } from "./pen";
export { eraserTool } from "./eraser";
export { fillTool } from "./fill";
export type { PixelTool, ToolContext, PixelDelta } from "./types";

// Tool registry - maps tool IDs to tool implementations
import { penTool } from "./pen";
import { eraserTool } from "./eraser";
import { fillTool } from "./fill";
import { PixelTool } from "./types";

export const toolRegistry: Record<string, PixelTool> = {
    [penTool.id]: penTool,
    [eraserTool.id]: eraserTool,
    [fillTool.id]: fillTool,
};

/**
 * Get a tool by ID
 */
export function getTool(toolId: string): PixelTool | undefined {
    return toolRegistry[toolId];
}

/**
 * Get all registered tools
 */
export function getAllTools(): PixelTool[] {
    return Object.values(toolRegistry);
}
