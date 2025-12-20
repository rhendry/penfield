import type { PixelTool, ToolContext, PixelDelta } from "./types";
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
let currentContext: ToolContext | null = null;

// Process buffered input with Bezier smoothing
function processBuffer() {
    const context = currentContext;
    if (!context || inputBuffer.length === 0) {
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

    const delta: PixelDelta = {};

    if (points.length >= 2) {
        // Generate smooth Bezier curve
        const curve = smoothCurveAdaptive(points, 0.5, 2);

        // Add all curve points to delta
        curve.forEach(p => {
            if (p.x >= -context.halfSize && p.x < context.halfSize &&
                p.y >= -context.halfSize && p.y < context.halfSize) {
                delta[`${p.x},${p.y}`] = color;
            }
        });

        // Update last drawn point for continuity
        if (curve.length > 0) {
            lastDrawnPoint = curve[curve.length - 1];
        }
    } else if (points.length === 1) {
        // Single point - draw directly
        const p = points[0];
        if (p.x >= -context.halfSize && p.x < context.halfSize &&
            p.y >= -context.halfSize && p.y < context.halfSize) {
            delta[`${p.x},${p.y}`] = color;
        }
        lastDrawnPoint = p;
    }

    // Apply delta to canvas
    if (Object.keys(delta).length > 0) {
        context.applyPixels(delta);
    }

    // Continue processing if more input arrived
    if (inputBuffer.length > 0) {
        rafId = context.requestFrame(processBuffer);
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
        currentContext = null;
    },

    onDeactivate: (context) => {
        // Cleanup when switching away from this tool
        if (rafId !== null) {
            context.cancelFrame(rafId);
            rafId = null;
        }
        isDrawing = false;
        lastDrawnPoint = null;
        inputBuffer = [];
        currentContext = null;
    },

    onPointerDown: (x, y, button, context) => {
        isDrawing = true;
        currentButton = button;
        currentContext = context;
        lastDrawnPoint = { x, y };

        // Draw initial pixel
        const color = button === "left" ? context.leftClickColor : context.rightClickColor;
        if (x >= -context.halfSize && x < context.halfSize &&
            y >= -context.halfSize && y < context.halfSize) {
            context.applyPixels({ [`${x},${y}`]: color });
        }
    },

    onPointerMove: (x, y, button, context) => {
        if (!isDrawing || button === null) return;

        // Update context reference for RAF callback
        currentContext = context;

        // Buffer input for batch processing
        inputBuffer.push({ x, y });

        // Schedule processing if not already scheduled
        if (rafId === null) {
            rafId = context.requestFrame(processBuffer);
        }
    },

    onPointerUp: (context) => {
        // Update context for final processing
        currentContext = context;

        // Flush any remaining buffered input
        if (inputBuffer.length > 0) {
            processBuffer();
        }

        // Reset drawing state
        isDrawing = false;
        lastDrawnPoint = null;
        inputBuffer = [];
        currentContext = null;

        if (rafId !== null) {
            context.cancelFrame(rafId);
            rafId = null;
        }
    },

    // Utilities are set dynamically by the page
    utilities: undefined,
};
