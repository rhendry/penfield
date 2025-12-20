import { PixelTool, ToolContext } from "./types";
import { smoothCurveAdaptive, type Point } from "@/lib/bezier";

/**
 * Pen Tool
 * 
 * Freehand drawing tool with Bezier curve smoothing.
 * Buffers input and processes with requestAnimationFrame for smooth drawing.
 */

// Tool-specific state (persists across events while tool is active)
let isDrawing = false;
let currentButton: "left" | "right" = "left";
let lastDrawnPoint: Point | null = null;
let inputBuffer: Point[] = [];
let rafId: number | null = null;

// Process buffered input with Bezier smoothing
function processBuffer(context: ToolContext) {
    if (inputBuffer.length === 0) {
        rafId = null;
        return;
    }

    const buffer = [...inputBuffer];
    inputBuffer = [];

    // Build control points for Bezier curve
    const points: Point[] = [];
    if (lastDrawnPoint) {
        points.push(lastDrawnPoint);
    }
    buffer.forEach(p => points.push(p));

    const color = currentButton === "left"
        ? context.leftClickColor
        : context.rightClickColor;
    const halfSize = context.maxSize / 2;

    if (points.length >= 2) {
        // Generate smooth Bezier curve
        const curve = smoothCurveAdaptive(points, 0.5, 2);

        // Draw all curve points - use getPixels() for latest state in RAF callback
        context.setPixels((prev) => {
            const newPixels = { ...prev };
            curve.forEach(p => {
                if (p.x >= -halfSize && p.x < halfSize && p.y >= -halfSize && p.y < halfSize) {
                    newPixels[`${p.x},${p.y}`] = color;
                }
            });
            return newPixels;
        });

        // Update last drawn point for continuity
        if (curve.length > 0) {
            lastDrawnPoint = curve[curve.length - 1];
        }
    } else if (points.length === 1) {
        // Single point - draw directly
        const p = points[0];
        if (p.x >= -halfSize && p.x < halfSize && p.y >= -halfSize && p.y < halfSize) {
            context.setPixels((prev) => {
                const newPixels = { ...prev };
                newPixels[`${p.x},${p.y}`] = color;
                return newPixels;
            });
        }
        lastDrawnPoint = p;
    }

    // Continue processing if more input arrived
    if (inputBuffer.length > 0) {
        rafId = context.requestDraw(() => processBuffer(context));
    } else {
        rafId = null;
    }
}

export const penTool: PixelTool = {
    id: "pen",
    name: "Pen",
    description: "Draw pixels with Bezier-smoothed freehand strokes",
    iconType: "lucide",
    iconName: "Pencil",
    hotkey: "1",

    onActivate: () => {
        // Reset state when tool is activated
        isDrawing = false;
        lastDrawnPoint = null;
        inputBuffer = [];
        rafId = null;
    },

    onDeactivate: (context) => {
        // Cleanup when switching away from this tool
        if (rafId !== null) {
            context.cancelDraw(rafId);
            rafId = null;
        }
        isDrawing = false;
        lastDrawnPoint = null;
        inputBuffer = [];
    },

    onPointerDown: (x, y, button, context) => {
        isDrawing = true;
        currentButton = button;
        lastDrawnPoint = { x, y };

        // Draw initial pixel
        const color = button === "left" ? context.leftClickColor : context.rightClickColor;
        const halfSize = context.maxSize / 2;
        if (x >= -halfSize && x < halfSize && y >= -halfSize && y < halfSize) {
            const newPixels = { ...context.pixels };
            newPixels[`${x},${y}`] = color;
            context.setPixels(newPixels);
        }
    },

    onPointerMove: (x, y, button, context) => {
        if (!isDrawing || button === null) return;

        // Buffer input for batch processing
        inputBuffer.push({ x, y });

        // Schedule processing if not already scheduled
        if (rafId === null) {
            rafId = context.requestDraw(() => processBuffer(context));
        }
    },

    onPointerUp: (context) => {
        // Flush any remaining buffered input
        if (inputBuffer.length > 0) {
            processBuffer(context);
        }

        // Reset drawing state
        isDrawing = false;
        lastDrawnPoint = null;
        inputBuffer = [];

        if (rafId !== null) {
            context.cancelDraw(rafId);
            rafId = null;
        }
    },

    // Utilities are set dynamically by the page
    utilities: undefined,
};

