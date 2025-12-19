import { useState, useCallback, useRef, useEffect } from "react";
import { PixelCanvas } from "./pixel-canvas";
import { Tool } from "@/components/toolbelt/types";
import { getTool, ToolContext } from "@/tools";
import { PEN_TOOL, ERASER_TOOL, FILL_TOOL } from "./pixel-editor-tools";

interface PixelEditorProps {
    initialContent: any;
    selectedTool: Tool | null;
    leftClickColor: string;
    rightClickColor: string;
    onPixelsChange: (pixels: Record<string, string>) => void;
    className?: string;
}

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

export function PixelEditor({
    initialContent,
    selectedTool,
    leftClickColor,
    rightClickColor,
    onPixelsChange,
    className,
}: PixelEditorProps) {
    // Pixel data: key is "x,y", value is color string
    const [pixels, setPixels] = useState<Record<string, string>>(
        initialContent?.grid || {}
    );
    
    // Track last drawn pixel for straight line drawing
    const lastDrawnPixelRef = useRef<{ x: number; y: number } | null>(null);
    const isShiftPressedRef = useRef(false);
    const maxSize = 1000;
    
    // Update parent when pixels change (use ref to avoid infinite loop)
    const onPixelsChangeRef = useRef(onPixelsChange);
    useEffect(() => {
        onPixelsChangeRef.current = onPixelsChange;
    }, [onPixelsChange]);
    
    useEffect(() => {
        onPixelsChangeRef.current(pixels);
    }, [pixels]);
    
    // Handle keyboard for Shift key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Shift") {
                isShiftPressedRef.current = true;
            }
        };
        
        const handleKeyUp = (e: KeyboardEvent) => {
            if (e.key === "Shift") {
                isShiftPressedRef.current = false;
                lastDrawnPixelRef.current = null;
            }
        };
        
        window.addEventListener("keydown", handleKeyDown);
        window.addEventListener("keyup", handleKeyUp);
        
        return () => {
            window.removeEventListener("keydown", handleKeyDown);
            window.removeEventListener("keyup", handleKeyUp);
        };
    }, []);
    
    // Create tool context
    const createToolContext = useCallback((): ToolContext => {
        return {
            pixels,
            maxSize,
            leftClickColor,
            rightClickColor,
            isShiftPressed: isShiftPressedRef.current,
            lastDrawnPixel: lastDrawnPixelRef.current,
        };
    }, [pixels, leftClickColor, rightClickColor]);
    
    // Handle pixel click
    const handlePixelClick = useCallback((x: number, y: number, button: "left" | "right") => {
        if (!selectedTool) return;
        
        const toolId = selectedTool.id;
        
        // Try to get tool from library first
        const libraryTool = getTool(toolId);
        if (libraryTool) {
            const context = createToolContext();
            const result = libraryTool.onPixelClick(x, y, button, context);
            setPixels(result.pixels);
            if (result.lastDrawnPixel !== undefined) {
                lastDrawnPixelRef.current = result.lastDrawnPixel;
            }
            return;
        }
        
        // Fallback to legacy tools (Fill tool)
        if (toolId === "fill") {
            const color = button === "left" ? leftClickColor : rightClickColor;
            setPixels((prev) => floodFill(prev, x, y, color, maxSize));
        }
    }, [selectedTool, createToolContext, leftClickColor, rightClickColor]);
    
    // Handle pixel drag
    const handlePixelDrag = useCallback((x: number, y: number, button: "left" | "right") => {
        if (!selectedTool) return;
        
        const toolId = selectedTool.id;
        
        // Try to get tool from library first
        const libraryTool = getTool(toolId);
        if (libraryTool) {
            const context = createToolContext();
            const result = libraryTool.onPixelDrag(x, y, button, context);
            setPixels(result.pixels);
            if (result.lastDrawnPixel !== undefined) {
                lastDrawnPixelRef.current = result.lastDrawnPixel;
            }
            return;
        }
        
        // Fallback to legacy tools (Fill tool doesn't support drag)
    }, [selectedTool, createToolContext]);
    
    return (
        <PixelCanvas
            pixels={pixels}
            onPixelClick={handlePixelClick}
            onPixelDrag={handlePixelDrag}
            className={className}
        />
    );
}
