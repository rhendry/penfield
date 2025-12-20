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
    
    // Track last drawn pixel for continuous line drawing
    const lastDrawnPixelRef = useRef<{ x: number; y: number } | null>(null);
    // Track initial click position for shift line drawing
    const initialClickPositionRef = useRef<{ x: number; y: number } | null>(null);
    const isShiftPressedRef = useRef(false);
    const maxSize = 1000;
    
    // Input buffering: collect mouse positions faster than we can render
    const inputBufferRef = useRef<Array<{ x: number; y: number; button: "left" | "right" }>>([]);
    const rafIdRef = useRef<number | null>(null);
    const pixelsRef = useRef<Record<string, string>>(pixels);
    
    // Keep pixelsRef in sync with pixels state
    useEffect(() => {
        pixelsRef.current = pixels;
    }, [pixels]);
    
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
                // Don't clear initialClickPosition here - it should persist until mouse up
            }
        };
        
        window.addEventListener("keydown", handleKeyDown);
        window.addEventListener("keyup", handleKeyUp);
        
        return () => {
            window.removeEventListener("keydown", handleKeyDown);
            window.removeEventListener("keyup", handleKeyUp);
        };
    }, []);
    
    // Create tool context (uses ref for pixels to avoid stale closures)
    const createToolContext = useCallback((): ToolContext => {
        return {
            pixels: pixelsRef.current,
            maxSize,
            leftClickColor,
            rightClickColor,
            isShiftPressed: isShiftPressedRef.current,
            lastDrawnPixel: lastDrawnPixelRef.current,
            initialClickPosition: initialClickPositionRef.current,
        };
    }, [leftClickColor, rightClickColor]);
    
    // Process buffered input positions using requestAnimationFrame
    const processInputBuffer = useCallback(() => {
        if (inputBufferRef.current.length === 0) {
            rafIdRef.current = null;
            return;
        }
        
        if (!selectedTool) {
            inputBufferRef.current = [];
            rafIdRef.current = null;
            return;
        }
        
        const toolId = selectedTool.id;
        const libraryTool = getTool(toolId);
        if (!libraryTool) {
            inputBufferRef.current = [];
            rafIdRef.current = null;
            return;
        }
        
        // Process all buffered positions
        let currentPixels = { ...pixelsRef.current };
        const buffer = [...inputBufferRef.current];
        inputBufferRef.current = [];
        
        // Process each position, chaining from the previous one
        for (let i = 0; i < buffer.length; i++) {
            const current = buffer[i];
            const context = createToolContext();
            context.pixels = currentPixels;
            
            // Set lastDrawnPixel appropriately
            if (i === 0 && lastDrawnPixelRef.current) {
                // First position: use the stored lastDrawnPixel
                context.lastDrawnPixel = lastDrawnPixelRef.current;
            } else if (i > 0) {
                // Subsequent positions: use the previous position in buffer
                const prev = buffer[i - 1];
                context.lastDrawnPixel = { x: prev.x, y: prev.y };
            } else {
                // No previous position
                context.lastDrawnPixel = null;
            }
            
            const result = libraryTool.onPixelDrag(current.x, current.y, current.button, context);
            
            // Update pixels for next iteration
            currentPixels = result.pixels;
            if (result.lastDrawnPixel !== undefined) {
                lastDrawnPixelRef.current = result.lastDrawnPixel;
            }
        }
        
        // Update state with all processed pixels
        pixelsRef.current = currentPixels;
        setPixels(currentPixels);
        
        // Schedule next frame if there's more input
        if (inputBufferRef.current.length > 0) {
            rafIdRef.current = requestAnimationFrame(processInputBuffer);
        } else {
            rafIdRef.current = null;
        }
    }, [selectedTool, createToolContext]);
    
    // Schedule processing if not already scheduled
    const scheduleProcessing = useCallback(() => {
        if (rafIdRef.current === null) {
            rafIdRef.current = requestAnimationFrame(processInputBuffer);
        }
    }, [processInputBuffer]);
    
    // Handle pixel click
    const handlePixelClick = useCallback((x: number, y: number, button: "left" | "right") => {
        if (!selectedTool) return;
        
        const toolId = selectedTool.id;
        
        // Store initial click position for shift line drawing
        initialClickPositionRef.current = { x, y };
        
        // Try to get tool from library first
        const libraryTool = getTool(toolId);
        if (libraryTool) {
            const context = createToolContext();
            const result = libraryTool.onPixelClick(x, y, button, context);
            pixelsRef.current = result.pixels;
            setPixels(result.pixels);
            if (result.lastDrawnPixel !== undefined) {
                lastDrawnPixelRef.current = result.lastDrawnPixel;
            }
            return;
        }
        
        // Fallback to legacy tools (Fill tool)
        if (toolId === "fill") {
            setPixels((prev) => {
                const color = button === "left" ? leftClickColor : rightClickColor;
                const newPixels = floodFill(prev, x, y, color, maxSize);
                pixelsRef.current = newPixels;
                return newPixels;
            });
        }
    }, [selectedTool, createToolContext, leftClickColor, rightClickColor, maxSize]);
    
    // Handle pixel drag - buffer input instead of processing immediately
    const handlePixelDrag = useCallback((x: number, y: number, button: "left" | "right") => {
        if (!selectedTool) return;
        
        // Add to input buffer
        inputBufferRef.current.push({ x, y, button });
        
        // Schedule processing if not already scheduled
        scheduleProcessing();
    }, [selectedTool, scheduleProcessing]);
    
    // Handle mouse up - clear drawing state and flush buffer
    const handleMouseUp = useCallback(() => {
        // Process any remaining buffered input
        if (inputBufferRef.current.length > 0) {
            processInputBuffer();
        }
        
        // Clear initial click position and last drawn pixel when mouse is released
        initialClickPositionRef.current = null;
        lastDrawnPixelRef.current = null;
    }, [processInputBuffer]);
    
    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (rafIdRef.current !== null) {
                cancelAnimationFrame(rafIdRef.current);
            }
        };
    }, []);
    
    return (
        <PixelCanvas
            pixels={pixels}
            onPixelClick={handlePixelClick}
            onPixelDrag={handlePixelDrag}
            onMouseUp={handleMouseUp}
            className={className}
        />
    );
}
