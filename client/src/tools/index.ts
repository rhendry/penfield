/**
 * Tools Library
 * 
 * Centralized location for all pixel editor tools.
 * Each tool implements the PixelTool interface and provides
 * drawing logic and optional utilities.
 */

export { penTool, createPenUtilities } from "./pen";
export { eraserTool } from "./eraser";
export type { PixelTool, ToolContext, ToolResult } from "./types";

// Tool registry - maps tool IDs to tool implementations
import { penTool } from "./pen";
import { eraserTool } from "./eraser";
import { PixelTool } from "./types";

export const toolRegistry: Record<string, PixelTool> = {
    [penTool.id]: penTool,
    [eraserTool.id]: eraserTool,
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

