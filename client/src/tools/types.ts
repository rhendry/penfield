import { ReactNode } from "react";

/**
 * Tool context passed to tool event handlers
 * Provides read access to state and write access via setPixels
 */
export interface ToolContext {
    // Read-only state
    readonly pixels: Record<string, string>;
    readonly maxSize: number;
    readonly leftClickColor: string;
    readonly rightClickColor: string;
    
    // Mutations - tools call these to update editor state
    setPixels: (pixels: Record<string, string>) => void;
    
    // Helper for batched rendering - tools can use this for RAF-based updates
    requestDraw: (callback: () => void) => number;
    cancelDraw: (id: number) => void;
}

/**
 * Base interface for pixel editor tools
 * 
 * Tools receive raw pointer events and have full control over:
 * - Input processing (buffering, smoothing, etc.)
 * - Interpolation (Bezier, linear, none, etc.)
 * - State management (tracking positions, selections, etc.)
 * - When and how to update pixels
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
     * Called when this tool becomes active
     * Use to initialize tool-specific state
     */
    onActivate?: (context: ToolContext) => void;
    
    /**
     * Called when this tool becomes inactive
     * Use to cleanup (cancel RAF, reset state, etc.)
     */
    onDeactivate?: (context: ToolContext) => void;
    
    /**
     * Called when pointer (mouse) is pressed down
     * @param x Canvas X coordinate
     * @param y Canvas Y coordinate  
     * @param button Which button was pressed
     * @param context Tool context for reading/writing state
     */
    onPointerDown: (x: number, y: number, button: "left" | "right", context: ToolContext) => void;
    
    /**
     * Called when pointer moves (whether pressed or not)
     * @param x Canvas X coordinate
     * @param y Canvas Y coordinate
     * @param button Which button is held (null if none)
     * @param context Tool context for reading/writing state
     */
    onPointerMove: (x: number, y: number, button: "left" | "right" | null, context: ToolContext) => void;
    
    /**
     * Called when pointer is released
     * @param context Tool context for reading/writing state
     */
    onPointerUp: (context: ToolContext) => void;
    
    /**
     * Utilities to render in the utilities panel when this tool is selected
     */
    utilities?: ReactNode | ReactNode[];
}

// Re-export old types for backwards compatibility during migration
// TODO: Remove these after all tools are migrated
export interface LegacyToolContext {
    pixels: Record<string, string>;
    maxSize: number;
    leftClickColor: string;
    rightClickColor: string;
    isShiftPressed: boolean;
    lastDrawnPixel: { x: number; y: number } | null;
    initialClickPosition: { x: number; y: number } | null;
}

export interface LegacyToolResult {
    pixels: Record<string, string>;
    lastDrawnPixel?: { x: number; y: number } | null;
}
