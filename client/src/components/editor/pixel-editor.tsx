import { useState, useCallback, useRef, useEffect } from "react";
import { PixelCanvas } from "./pixel-canvas";
import { Tool } from "@/components/toolbelt/types";
import { getTool, ToolContext } from "@/tools";
import { smoothCurveAdaptive, type Point } from "@/lib/bezier";

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

    // Debug state for Bezier curve visualization
    const [controlPoints, setControlPoints] = useState<Point[]>([]);
    const [curvePoints, setCurvePoints] = useState<Point[]>([]);

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

    // Process buffered input positions using requestAnimationFrame with Bezier curve smoothing
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

        // Get buffered positions
        const buffer = [...inputBufferRef.current];
        inputBufferRef.current = [];

        // Check if shift is pressed - if so, use tool's straight line logic
        if (isShiftPressedRef.current && initialClickPositionRef.current && buffer.length > 0) {
            // Shift mode: draw straight line from initial click to last buffered position
            const lastPos = buffer[buffer.length - 1];
            const context = createToolContext();
            const result = libraryTool.onPixelDrag(
                lastPos.x,
                lastPos.y,
                lastPos.button,
                context
            );
            pixelsRef.current = result.pixels;
            setPixels(result.pixels);
            if (result.lastDrawnPixel !== undefined) {
                lastDrawnPixelRef.current = result.lastDrawnPixel;
            }
        } else if (buffer.length > 0) {
            // Freehand mode: use Bezier curves for smooth drawing
            // Build control points array for Bezier curve
            const controlPoints: Point[] = [];

            // Add last drawn pixel as first control point if available
            if (lastDrawnPixelRef.current) {
                controlPoints.push(lastDrawnPixelRef.current);
            }

            // Add all buffered positions as control points
            buffer.forEach(pos => {
                controlPoints.push({ x: pos.x, y: pos.y });
            });

            // Update debug state
            setControlPoints([...controlPoints]);

            // If we have at least 2 points, generate smooth curve
            if (controlPoints.length >= 2) {
                // Generate smooth curve points (exactly like BezierCurveTest story)
                const generatedCurvePoints = smoothCurveAdaptive(
                    controlPoints,
                    0.5, // tension
                    2    // points per pixel
                );

                // Update debug state
                setCurvePoints([...generatedCurvePoints]);

                const color = buffer[0].button === "left" ? leftClickColor : rightClickColor;
                const halfSize = maxSize / 2;

                // Draw pixels along curve (exactly like BezierCurveTest story)
                setPixels((prev) => {
                    const newPixels = { ...prev };
                    generatedCurvePoints.forEach(p => {
                        // Only draw if within bounds
                        if (p.x >= -halfSize && p.x < halfSize && p.y >= -halfSize && p.y < halfSize) {
                            newPixels[`${p.x},${p.y}`] = color;
                        }
                    });
                    // Update ref to match state
                    pixelsRef.current = newPixels;
                    return newPixels;
                });

                // Update last drawn pixel to last curve point
                if (generatedCurvePoints.length > 0) {
                    const lastPoint = generatedCurvePoints[generatedCurvePoints.length - 1];
                    lastDrawnPixelRef.current = lastPoint;
                }
            } else if (controlPoints.length === 1) {
                // Single point - just draw it directly (exactly like BezierCurveTest story)
                const point = controlPoints[0];
                const color = buffer[0].button === "left" ? leftClickColor : rightClickColor;
                const halfSize = maxSize / 2;

                setCurvePoints([]);

                setPixels((prev) => {
                    const newPixels = { ...prev };
                    if (point.x >= -halfSize && point.x < halfSize && point.y >= -halfSize && point.y < halfSize) {
                        newPixels[`${point.x},${point.y}`] = color;
                    }
                    // Update ref to match state
                    pixelsRef.current = newPixels;
                    return newPixels;
                });

                lastDrawnPixelRef.current = point;
            }
        }

        // Schedule next frame if there's more input
        if (inputBufferRef.current.length > 0) {
            rafIdRef.current = requestAnimationFrame(processInputBuffer);
        } else {
            rafIdRef.current = null;
        }
    }, [selectedTool, createToolContext, leftClickColor, rightClickColor, maxSize]);

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
        setControlPoints([]);
        setCurvePoints([]);
    }, [processInputBuffer]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (rafIdRef.current !== null) {
                cancelAnimationFrame(rafIdRef.current);
            }
        };
    }, []);

    // Debug UI (exactly like BezierCurveTest story)
    const debugInfo = (
        <div style={{
            position: "absolute",
            top: 10,
            left: 10,
            background: "rgba(0,0,0,0.7)",
            color: "white",
            padding: "10px",
            borderRadius: "4px",
            fontSize: "12px",
            zIndex: 1000,
            fontFamily: "monospace",
            pointerEvents: "none"
        }}>
            <div>Control Points: {controlPoints.length}</div>
            <div>Curve Points: {curvePoints.length}</div>
            <div>Buffer Size: {inputBufferRef.current.length}</div>
            {controlPoints.length > 0 && (
                <div style={{ marginTop: "5px" }}>
                    <div>Last Control: ({controlPoints[controlPoints.length - 1]?.x}, {controlPoints[controlPoints.length - 1]?.y})</div>
                </div>
            )}
        </div>
    );

    return (
        <div style={{ position: "relative", width: "100%", height: "100%" }}>
            {debugInfo}
            <PixelCanvas
                pixels={pixels}
                onPixelClick={handlePixelClick}
                onPixelDrag={handlePixelDrag}
                onMouseUp={handleMouseUp}
                className={className}
            />
        </div>
    );
}
