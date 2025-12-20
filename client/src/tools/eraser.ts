import { PixelTool, ToolContext } from "./types";
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
    if (lastErasedPoint) {
        points.push(lastErasedPoint);
    }
    buffer.forEach(p => points.push(p));
    
    if (points.length >= 2) {
        // Generate smooth Bezier curve
        const curve = smoothCurveAdaptive(points, 0.5, 2);
        
        // Erase all curve points - use updater for latest state in RAF callback
        context.setPixels((prev) => {
            const newPixels = { ...prev };
            curve.forEach(p => {
                delete newPixels[`${p.x},${p.y}`];
            });
            return newPixels;
        });
        
        // Update last erased point for continuity
        if (curve.length > 0) {
            lastErasedPoint = curve[curve.length - 1];
        }
    } else if (points.length === 1) {
        // Single point - erase directly
        const p = points[0];
        context.setPixels((prev) => {
            const newPixels = { ...prev };
            delete newPixels[`${p.x},${p.y}`];
            return newPixels;
        });
        lastErasedPoint = p;
    }
    
    // Continue processing if more input arrived
    if (inputBuffer.length > 0) {
        rafId = context.requestDraw(() => processBuffer(context));
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
    },
    
    onDeactivate: (context) => {
        if (rafId !== null) {
            context.cancelDraw(rafId);
            rafId = null;
        }
        isErasing = false;
        lastErasedPoint = null;
        inputBuffer = [];
    },
    
    onPointerDown: (x, y, _button, context) => {
        isErasing = true;
        lastErasedPoint = { x, y };
        
        // Erase initial pixel
        const newPixels = { ...context.pixels };
        delete newPixels[`${x},${y}`];
        context.setPixels(newPixels);
    },
    
    onPointerMove: (x, y, button, context) => {
        if (!isErasing || button === null) return;
        
        inputBuffer.push({ x, y });
        
        if (rafId === null) {
            rafId = context.requestDraw(() => processBuffer(context));
        }
    },
    
    onPointerUp: (context) => {
        if (inputBuffer.length > 0) {
            processBuffer(context);
        }
        
        isErasing = false;
        lastErasedPoint = null;
        inputBuffer = [];
        
        if (rafId !== null) {
            context.cancelDraw(rafId);
            rafId = null;
        }
    },
    
    utilities: undefined,
};

