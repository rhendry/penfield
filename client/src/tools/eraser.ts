import type { PixelTool, ToolContext, PixelDelta } from "./types";
import { smoothCurveAdaptive, type Point } from "@/lib/bezier";

/**
 * Eraser Tool
 * 
 * Removes pixels with Bezier-smoothed freehand strokes.
 * Uses same smoothing as pen tool for consistent feel.
 */

// Tool-specific state
let isErasing = false;
let lastErasedPoint: Point | null = null;
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
    if (lastErasedPoint) {
        points.push(lastErasedPoint);
    }
    buffer.forEach(p => points.push(p));
    
    const delta: PixelDelta = {};
    
    if (points.length >= 2) {
        // Generate smooth Bezier curve
        const curve = smoothCurveAdaptive(points, 0.5, 2);
        
        // Add all curve points to delta as null (clear)
        curve.forEach(p => {
            if (p.x >= -context.halfSize && p.x < context.halfSize && 
                p.y >= -context.halfSize && p.y < context.halfSize) {
                delta[`${p.x},${p.y}`] = null;
            }
        });
        
        // Update last erased point for continuity
        if (curve.length > 0) {
            lastErasedPoint = curve[curve.length - 1];
        }
    } else if (points.length === 1) {
        // Single point - erase directly
        const p = points[0];
        if (p.x >= -context.halfSize && p.x < context.halfSize && 
            p.y >= -context.halfSize && p.y < context.halfSize) {
            delta[`${p.x},${p.y}`] = null;
        }
        lastErasedPoint = p;
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

export const eraserTool: PixelTool = {
    id: "eraser",
    name: "Eraser",
    description: "Erase pixels with smooth freehand strokes",
    iconType: "lucide",
    iconName: "Eraser",
    hotkey: "2",
    
    onActivate: () => {
        isErasing = false;
        lastErasedPoint = null;
        inputBuffer = [];
        rafId = null;
        currentContext = null;
    },
    
    onDeactivate: (context) => {
        if (rafId !== null) {
            context.cancelFrame(rafId);
            rafId = null;
        }
        isErasing = false;
        lastErasedPoint = null;
        inputBuffer = [];
        currentContext = null;
    },
    
    onPointerDown: (x, y, _button, context) => {
        isErasing = true;
        currentContext = context;
        lastErasedPoint = { x, y };
        
        // Erase initial pixel
        if (x >= -context.halfSize && x < context.halfSize && 
            y >= -context.halfSize && y < context.halfSize) {
            context.applyPixels({ [`${x},${y}`]: null });
        }
    },
    
    onPointerMove: (x, y, button, context) => {
        if (!isErasing || button === null) return;
        
        currentContext = context;
        inputBuffer.push({ x, y });
        
        if (rafId === null) {
            rafId = context.requestFrame(processBuffer);
        }
    },
    
    onPointerUp: (context) => {
        currentContext = context;
        
        if (inputBuffer.length > 0) {
            processBuffer();
        }
        
        isErasing = false;
        lastErasedPoint = null;
        inputBuffer = [];
        currentContext = null;
        
        if (rafId !== null) {
            context.cancelFrame(rafId);
            rafId = null;
        }
    },
    
    utilities: undefined,
};
