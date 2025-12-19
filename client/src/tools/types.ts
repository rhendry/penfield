import { ReactNode } from "react";

/**
 * Tool context passed to tool handlers
 */
export interface ToolContext {
    /** Current pixel data (read-only) */
    pixels: Record<string, string>;
    /** Maximum canvas size */
    maxSize: number;
    /** Left click color (for tools that use it) */
    leftClickColor: string;
    /** Right click color (for tools that use it) */
    rightClickColor: string;
    /** Whether Shift key is currently pressed */
    isShiftPressed: boolean;
    /** Last drawn pixel position (for line drawing) */
    lastDrawnPixel: { x: number; y: number } | null;
}

/**
 * Result of a tool operation
 */
export interface ToolResult {
    /** Updated pixel data */
    pixels: Record<string, string>;
    /** Updated last drawn pixel position */
    lastDrawnPixel?: { x: number; y: number } | null;
}

/**
 * Base interface for pixel editor tools
 */
export interface PixelTool {
    /** Unique tool identifier */
    id: string;
    /** Tool display name */
    name: string;
    /** Tool description */
    description?: string;
    /** Icon type */
    iconType: "lucide" | "custom";
    /** Icon name */
    iconName: string;
    /** Badge type (optional) */
    badgeType?: "lucide" | "custom";
    /** Badge name (optional) */
    badgeName?: string;
    /** Badge alignment (optional) */
    badgeAlignment?: "top-right" | "top-left" | "bottom-right" | "bottom-left" | "center";
    /** Keyboard hotkey */
    hotkey?: string;
    
    /**
     * Handle pixel click
     * @param x Canvas X coordinate
     * @param y Canvas Y coordinate
     * @param button Mouse button ("left" or "right")
     * @param context Tool context
     * @returns Updated pixel data and optional last drawn pixel
     */
    onPixelClick: (x: number, y: number, button: "left" | "right", context: ToolContext) => ToolResult;
    
    /**
     * Handle pixel drag
     * @param x Canvas X coordinate
     * @param y Canvas Y coordinate
     * @param button Mouse button ("left" or "right")
     * @param context Tool context
     * @returns Updated pixel data and optional last drawn pixel
     */
    onPixelDrag: (x: number, y: number, button: "left" | "right", context: ToolContext) => ToolResult;
    
    /**
     * Utilities to render in the utilities panel when this tool is selected
     */
    utilities?: ReactNode | ReactNode[];
}

