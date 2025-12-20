# Tool Implementation Guide

This guide explains how to implement pixel editor tools using the `PixelTool` interface.

## Tool Interface

Every tool implements the `PixelTool` interface:

```typescript
interface PixelTool {
    id: string;                    // Unique identifier (e.g., "pen", "fill")
    name: string;                  // Display name
    description?: string;          // Tooltip/help text
    iconType: "lucide" | "custom"; // Icon source
    iconName: string;              // Icon name
    hotkey?: string;               // Keyboard shortcut
    
    // Lifecycle
    onActivate?: (context: ToolContext) => void;
    onDeactivate?: (context: ToolContext) => void;
    
    // Pointer events
    onPointerDown: (x: number, y: number, button: "left" | "right", context: ToolContext) => void;
    onPointerMove: (x: number, y: number, button: "left" | "right" | null, context: ToolContext) => void;
    onPointerUp: (context: ToolContext) => void;
    
    utilities?: ReactNode | ReactNode[];
}
```

## Tool Context

The `ToolContext` provides access to the canvas via an efficient delta-based API:

```typescript
interface ToolContext {
    readonly maxSize: number;        // Canvas size (e.g., 1000)
    readonly halfSize: number;       // Half of maxSize (e.g., 500)
    readonly leftClickColor: string;
    readonly rightClickColor: string;
    
    // Read a single pixel (returns null if empty)
    getPixel: (x: number, y: number) => string | null;
    
    // Apply pixel changes - DELTA ONLY, not full state!
    // Pass color string to set, null to clear
    applyPixels: (delta: PixelDelta) => void;
    
    // Request immediate render
    requestRender: () => void;
    
    // RAF helpers
    requestFrame: (callback: () => void) => number;
    cancelFrame: (id: number) => void;
}

type PixelDelta = Record<string, string | null>;
```

## Key Concept: Delta-Based Updates

The canvas uses ImageData as the source of truth. Tools pass **deltas** (only changed pixels), not the full pixel state. This is critical for performance:

```typescript
// ✅ GOOD: Only pass the pixels you're changing
context.applyPixels({
    "5,10": "#ff0000",  // Set pixel to red
    "5,11": "#ff0000",
    "5,12": null,       // Clear this pixel
});

// ❌ BAD: Don't try to pass the entire pixel state
// (This pattern doesn't exist in the new API)
```

## Tool Patterns

### Pattern 1: Synchronous Tools (Fill, Shapes)

For tools that complete their work immediately on click:

```typescript
export const fillTool: PixelTool = {
    id: "fill",
    // ...
    
    onPointerDown: (x, y, button, context) => {
        const color = button === "left" ? context.leftClickColor : context.rightClickColor;
        
        // Build delta of all pixels to fill
        const delta: PixelDelta = {};
        // ... flood fill algorithm using context.getPixel() ...
        // ... populate delta with changed pixels ...
        
        context.applyPixels(delta);
    },
    
    onPointerMove: () => {
        // Fill doesn't respond to drag
    },
    
    onPointerUp: () => {
        // Nothing to do
    },
};
```

### Pattern 2: Async/RAF Tools (Pen, Eraser)

For tools that buffer input and process asynchronously:

```typescript
// Module-level state (persists across events)
let isDrawing = false;
let inputBuffer: Point[] = [];
let rafId: number | null = null;
let currentContext: ToolContext | null = null;

function processBuffer() {
    const context = currentContext;
    if (!context || inputBuffer.length === 0) {
        rafId = null;
        return;
    }
    
    const buffer = [...inputBuffer];
    inputBuffer = [];
    
    // Build delta from buffer
    const delta: PixelDelta = {};
    buffer.forEach(p => {
        delta[`${p.x},${p.y}`] = context.leftClickColor;
    });
    
    // Apply delta
    context.applyPixels(delta);
    
    // Continue processing if more input
    if (inputBuffer.length > 0) {
        rafId = context.requestFrame(processBuffer);
    } else {
        rafId = null;
    }
}

export const penTool: PixelTool = {
    id: "pen",
    // ...
    
    onActivate: () => {
        isDrawing = false;
        inputBuffer = [];
        rafId = null;
        currentContext = null;
    },
    
    onDeactivate: (context) => {
        if (rafId !== null) {
            context.cancelFrame(rafId);
        }
        isDrawing = false;
        inputBuffer = [];
        currentContext = null;
    },
    
    onPointerDown: (x, y, button, context) => {
        isDrawing = true;
        currentContext = context;
        
        // Draw initial pixel
        context.applyPixels({ [`${x},${y}`]: context.leftClickColor });
    },
    
    onPointerMove: (x, y, button, context) => {
        if (!isDrawing || button === null) return;
        
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
        
        isDrawing = false;
        inputBuffer = [];
        currentContext = null;
        
        if (rafId !== null) {
            context.cancelFrame(rafId);
            rafId = null;
        }
    },
};
```

## Important: Context Reference in RAF

When using `requestFrame`, the context passed to your callback may be stale. Store the latest context in a module-level variable:

```typescript
let currentContext: ToolContext | null = null;

function processBuffer() {
    const context = currentContext;  // Use stored context
    if (!context) return;
    // ...
}

onPointerMove: (x, y, button, context) => {
    currentContext = context;  // Always update
    // ...
}
```

## Coordinate System

- Canvas center is `(0, 0)`
- X increases to the right
- Y increases downward
- Valid range: `-halfSize` to `halfSize - 1` (e.g., -500 to 499)

```typescript
function isInBounds(x: number, y: number, halfSize: number): boolean {
    return x >= -halfSize && x < halfSize && y >= -halfSize && y < halfSize;
}
```

## Registering Tools

Add your tool to `client/src/tools/index.ts`:

```typescript
import { myTool } from "./my-tool";

export const toolRegistry: Record<string, PixelTool> = {
    // ... existing tools
    [myTool.id]: myTool,
};
```

And add it to the default toolbelt in `pixel-editor-tools.tsx` if desired.

## Example Tools by Pattern

| Tool | Pattern | Key Characteristic |
|------|---------|-------------------|
| Fill | Sync | Single click, builds delta via flood fill |
| Pen | Async + Bezier | Buffered input, curve smoothing, incremental delta |
| Eraser | Async + Bezier | Same as pen, but delta has null values |
| Selection | Async | Tracks bounds, doesn't modify pixels |
| Shape | Async | Preview on move, commit on release |

## Performance Notes

### Why Delta-Based?

The canvas uses `ImageData` (a typed array) as the source of truth:
- Applying a delta of 100 pixels = O(100) operations
- This is true even if the canvas has 1,000,000 pixels filled

### Reading Pixels

`getPixel(x, y)` reads directly from ImageData. It's fast for individual reads but avoid calling it in tight loops if possible. For flood fill, reading each visited pixel is acceptable.

### Large Fills

The fill tool may generate a delta with 1M entries for a full canvas fill. This is handled efficiently:
1. Building the delta: O(n) where n = filled pixels
2. Applying the delta: O(n) 
3. Rendering: O(1) - just `putImageData`

## Utilities

Tools can provide custom UI via the `utilities` property. These render in the utilities panel when the tool is selected. For now, utilities are wired up in `pixel-editor-page.tsx` based on tool ID.
