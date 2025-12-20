import { useState, useCallback, useRef, useEffect } from "react";
import { PixelCanvas } from "./pixel-canvas";
import { Tool } from "@/components/toolbelt/types";
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

    // Track last drawn pixel for continuous line drawing (exactly like storybook)
    const lastDrawnRef = useRef<Point | null>(null);
    const maxSize = 1000;

    // Input buffering: collect mouse positions faster than we can render (exactly like storybook)
    const inputBufferRef = useRef<Point[]>([]);
    const rafIdRef = useRef<number | null>(null);

    // Update parent when pixels change (use ref to avoid infinite loop)
    const onPixelsChangeRef = useRef(onPixelsChange);
    useEffect(() => {
        onPixelsChangeRef.current = onPixelsChange;
    }, [onPixelsChange]);

    useEffect(() => {
        onPixelsChangeRef.current(pixels);
    }, [pixels]);

    // Get color based on tool and button (pen draws, eraser removes)
    const getColorForDraw = useCallback((button: "left" | "right"): string | null => {
        if (!selectedTool) return null;
        if (selectedTool.id === "eraser") return ""; // Empty string means erase
        // For pen and other tools, use the click color
        return button === "left" ? leftClickColor : rightClickColor;
    }, [selectedTool, leftClickColor, rightClickColor]);

    // Process buffered input - generates Bezier curve and draws pixels
    const processBuffer = useCallback(() => {
        if (inputBufferRef.current.length === 0) {
            rafIdRef.current = null;
            return;
        }

        const buffer = [...inputBufferRef.current];
        inputBufferRef.current = [];

        // Build control points for Bezier curve
        const points: Point[] = [];
        if (lastDrawnRef.current) {
            points.push(lastDrawnRef.current);
        }
        buffer.forEach(p => points.push(p));

        if (points.length >= 2) {
            // Generate curve and draw pixels
            const curve = smoothCurveAdaptive(points, 0.5, 2);

            setPixels((prev) => {
                const newPixels = { ...prev };
                const color = getColorForDraw("left");
                curve.forEach(p => {
                    if (color === "") {
                        delete newPixels[`${p.x},${p.y}`];
                    } else if (color) {
                        newPixels[`${p.x},${p.y}`] = color;
                    }
                });
                return newPixels;
            });

            if (curve.length > 0) {
                lastDrawnRef.current = curve[curve.length - 1];
            }
        } else if (points.length === 1) {
            const p = points[0];
            setPixels((prev) => {
                const newPixels = { ...prev };
                const color = getColorForDraw("left");
                if (color === "") {
                    delete newPixels[`${p.x},${p.y}`];
                } else if (color) {
                    newPixels[`${p.x},${p.y}`] = color;
                }
                return newPixels;
            });
            lastDrawnRef.current = p;
        }

        if (inputBufferRef.current.length > 0) {
            rafIdRef.current = requestAnimationFrame(processBuffer);
        } else {
            rafIdRef.current = null;
        }
    }, [getColorForDraw]);

    // Handle pixel click - EXACTLY like BezierCurveTest storybook
    const handlePixelClick = useCallback((x: number, y: number, button: "left" | "right") => {
        if (!selectedTool) return;

        // Fill tool has special handling
        if (selectedTool.id === "fill") {
            setPixels((prev) => {
                const color = button === "left" ? leftClickColor : rightClickColor;
                return floodFill(prev, x, y, color, maxSize);
            });
            return;
        }

        // For pen/eraser: set last drawn and draw pixel
        lastDrawnRef.current = { x, y };
        setPixels((prev) => {
            const newPixels = { ...prev };
            const color = getColorForDraw(button);
            if (color === "") {
                delete newPixels[`${x},${y}`];
            } else if (color) {
                newPixels[`${x},${y}`] = color;
            }
            return newPixels;
        });
    }, [selectedTool, leftClickColor, rightClickColor, maxSize, getColorForDraw]);

    // Handle pixel drag - EXACTLY like BezierCurveTest storybook
    const handlePixelDrag = useCallback((x: number, y: number, _button: "left" | "right") => {
        if (!selectedTool) return;
        if (selectedTool.id === "fill") return; // Fill doesn't support drag

        inputBufferRef.current.push({ x, y });
        if (rafIdRef.current === null) {
            rafIdRef.current = requestAnimationFrame(processBuffer);
        }
    }, [selectedTool, processBuffer]);

    // Handle mouse up - flush buffer and reset drawing state
    const handleMouseUp = useCallback(() => {
        if (inputBufferRef.current.length > 0) {
            processBuffer();
        }
        lastDrawnRef.current = null;
        inputBufferRef.current = [];
    }, [processBuffer]);

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
