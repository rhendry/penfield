import { ReactNode } from "react";

/**
 * Pixel delta - keys are "x,y", values are color (string) or null to clear
 */
export type PixelDelta = Record<string, string | null>;

/**
 * Tool context passed to tool event handlers
 * Uses a canvas-based pixel buffer for efficient rendering
 */
export interface ToolContext {
    readonly maxSize: number;
    readonly halfSize: number;
    readonly leftClickColor: string;
    readonly rightClickColor: string;
    
    /**
     * Get pixel color at coordinates
     * Returns null if pixel is empty/transparent
     */
    getPixel: (x: number, y: number) => string | null;
    
    /**
     * Apply pixel changes (delta only - not full state)
     * Pass color string to set, null to clear
     */
    applyPixels: (delta: PixelDelta) => void;
    
    /**
     * Request a render on next animation frame
     * Use this when batching multiple applyPixels calls
     */
    requestRender: () => void;
    
    /**
     * Schedule a callback on next animation frame
     * Returns ID that can be passed to cancelFrame
     */
    requestFrame: (callback: () => void) => number;
    
    /**
     * Cancel a scheduled frame callback
     */
    cancelFrame: (id: number) => void;
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

