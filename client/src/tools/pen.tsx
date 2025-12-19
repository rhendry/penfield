import { PixelTool, ToolContext, ToolResult } from "./types";
import { ColorPicker } from "@/components/utilities/color-picker";
import { ColorPalette } from "@/components/utilities/color-palette";
import { Palette } from "@/components/utilities/palette-selector";
import { ReactNode } from "react";

/**
 * Draw a straight line between two points using Bresenham's algorithm
 */
function drawLine(
    pixels: Record<string, string>,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    color: string
): Record<string, string> {
    const newPixels = { ...pixels };
    const dx = Math.abs(x2 - x1);
    const dy = Math.abs(y2 - y1);
    const sx = x1 < x2 ? 1 : -1;
    const sy = y1 < y2 ? 1 : -1;
    let err = dx - dy;
    
    let x = x1;
    let y = y1;
    
    while (true) {
        newPixels[`${x},${y}`] = color;
        
        if (x === x2 && y === y2) break;
        
        const e2 = 2 * err;
        if (e2 > -dy) {
            err -= dy;
            x += sx;
        }
        if (e2 < dx) {
            err += dx;
            y += sy;
        }
    }
    
    return newPixels;
}

/**
 * Check if coordinates are within canvas bounds
 */
function isInBounds(x: number, y: number, maxSize: number): boolean {
    const halfSize = maxSize / 2;
    return x >= -halfSize && x < halfSize && y >= -halfSize && y < halfSize;
}

/**
 * Pen tool - draws pixels with left and right click colors
 */
export const penTool: PixelTool = {
    id: "pen",
    name: "Pen",
    description: "Draw pixels with left and right click colors",
    iconType: "lucide",
    iconName: "Pen",
    hotkey: "1",
    
    onPixelClick: (x: number, y: number, button: "left" | "right", context: ToolContext): ToolResult => {
        if (!isInBounds(x, y, context.maxSize)) {
            return { pixels: context.pixels };
        }
        
        const color = button === "left" ? context.leftClickColor : context.rightClickColor;
        const newPixels = { ...context.pixels };
        newPixels[`${x},${y}`] = color;
        
        return {
            pixels: newPixels,
            lastDrawnPixel: { x, y },
        };
    },
    
    onPixelDrag: (x: number, y: number, button: "left" | "right", context: ToolContext): ToolResult => {
        if (!isInBounds(x, y, context.maxSize)) {
            return { pixels: context.pixels };
        }
        
        const color = button === "left" ? context.leftClickColor : context.rightClickColor;
        
        // Draw straight line if Shift is pressed and we have a last drawn pixel
        if (context.isShiftPressed && context.lastDrawnPixel) {
            const newPixels = drawLine(
                context.pixels,
                context.lastDrawnPixel.x,
                context.lastDrawnPixel.y,
                x,
                y,
                color
            );
            return {
                pixels: newPixels,
                lastDrawnPixel: { x, y },
            };
        }
        
        // Otherwise draw single pixel
        const newPixels = { ...context.pixels };
        newPixels[`${x},${y}`] = color;
        
        return {
            pixels: newPixels,
            lastDrawnPixel: { x, y },
        };
    },
    
    // Utilities will be set dynamically based on props
    utilities: undefined,
};

/**
 * Create Pen tool utilities component
 */
export function createPenUtilities(
    leftClickColor: string,
    rightClickColor: string,
    currentPaletteId: string,
    palettes: Palette[],
    currentPaletteColors: string[],
    onLeftColorChange: (color: string) => void,
    onRightColorChange: (color: string) => void,
    onSelectPalette: (paletteId: string) => void,
    onSelectColor: (color: string) => void,
    onAddColor: (color: string) => void | Promise<void>,
    onRemoveColor: (colorIndex: number) => void | Promise<void>,
    onCreatePalette: () => void | Promise<void>
): ReactNode {
    return (
        <>
            <ColorPicker
                value={leftClickColor}
                onChange={onLeftColorChange}
                label="Left Click"
            />
            <ColorPicker
                value={rightClickColor}
                onChange={onRightColorChange}
                label="Right Click"
            />
            <ColorPalette
                paletteId={currentPaletteId}
                palettes={palettes}
                colors={currentPaletteColors}
                selectedColor={leftClickColor}
                onSelectPalette={onSelectPalette}
                onSelectColor={onSelectColor}
                onAddColor={onAddColor}
                onRemoveColor={onRemoveColor}
                onCreatePalette={onCreatePalette}
                currentPickerColor={leftClickColor}
            />
        </>
    );
}

