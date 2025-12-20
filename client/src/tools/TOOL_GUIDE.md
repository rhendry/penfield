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

The `ToolContext` provides access to editor state and mutations:

```typescript
interface ToolContext {
    // Read-only state
    readonly pixels: Record<string, string>;  // Current pixels (may be stale in RAF)
    readonly maxSize: number;                 // Canvas size (e.g., 1000)
    readonly leftClickColor: string;          // Left click color
    readonly rightClickColor: string;         // Right click color
    
    // Get fresh pixels (safe in async callbacks)
    getPixels: () => Record<string, string>;
    
    // Update pixels - accepts object OR updater function
    setPixels: (pixels: Record<string, string> | PixelUpdater) => void;
    
    // RAF helpers
    requestDraw: (callback: () => void) => number;
    cancelDraw: (id: number) => void;
}

type PixelUpdater = (prev: Record<string, string>) => Record<string, string>;
```

## Tool Patterns

### Pattern 1: Synchronous Tools (Fill, Shapes)

For tools that complete their work immediately on click:

```typescript
export const fillTool: PixelTool = {
    id: "fill",
    // ...
    
    onPointerDown: (x, y, button, context) => {
        // Safe to use context.pixels directly - it's fresh
        const color = button === "left" ? context.leftClickColor : context.rightClickColor;
        const newPixels = floodFill(context.pixels, x, y, color);
        context.setPixels(newPixels);
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

function processBuffer(context: ToolContext) {
    const buffer = [...inputBuffer];
    inputBuffer = [];
    
    // ⚠️ CRITICAL: Use updater function for RAF callbacks!
    // context.pixels may be stale by the time RAF fires
    context.setPixels((prev) => {
        const newPixels = { ...prev };
        // ... modify newPixels ...
        return newPixels;
    });
    
    // Schedule next frame if more input
    if (inputBuffer.length > 0) {
        rafId = context.requestDraw(() => processBuffer(context));
    } else {
        rafId = null;
    }
}

export const penTool: PixelTool = {
    id: "pen",
    // ...
    
    onActivate: () => {
        // Reset state when tool becomes active
        isDrawing = false;
        inputBuffer = [];
        rafId = null;
    },
    
    onDeactivate: (context) => {
        // Cleanup when switching tools
        if (rafId !== null) {
            context.cancelDraw(rafId);
        }
        isDrawing = false;
        inputBuffer = [];
    },
    
    onPointerDown: (x, y, button, context) => {
        isDrawing = true;
        // Draw initial pixel synchronously (context.pixels is fresh here)
        const newPixels = { ...context.pixels };
        newPixels[`${x},${y}`] = context.leftClickColor;
        context.setPixels(newPixels);
    },
    
    onPointerMove: (x, y, button, context) => {
        if (!isDrawing || button === null) return;
        
        // Buffer input
        inputBuffer.push({ x, y });
        
        // Schedule processing
        if (rafId === null) {
            rafId = context.requestDraw(() => processBuffer(context));
        }
    },
    
    onPointerUp: (context) => {
        // Flush remaining buffer
        if (inputBuffer.length > 0) {
            processBuffer(context);
        }
        isDrawing = false;
        inputBuffer = [];
    },
};
```

## ⚠️ Critical: Stale Closure Warning

When using `requestAnimationFrame` (via `context.requestDraw`), the `context.pixels` value captured at schedule time may be **stale** by the time the callback runs.

### ❌ Wrong - Will lose pixels:

```typescript
function processBuffer(context: ToolContext) {
    // BAD: context.pixels was captured when RAF was scheduled
    // Other setPixels calls may have happened since then
    const newPixels = { ...context.pixels };
    newPixels[`${x},${y}`] = color;
    context.setPixels(newPixels);  // Overwrites recent changes!
}
```

### ✅ Correct - Use updater function:

```typescript
function processBuffer(context: ToolContext) {
    // GOOD: Updater receives the LATEST pixels
    context.setPixels((prev) => {
        const newPixels = { ...prev };
        newPixels[`${x},${y}`] = color;
        return newPixels;
    });
}
```

## Tool State Management

Tools can maintain module-level state that persists across pointer events:

```typescript
// Module-level state
let lastPoint: Point | null = null;
let isActive = false;

export const myTool: PixelTool = {
    onActivate: () => {
        // Initialize state
        lastPoint = null;
        isActive = false;
    },
    
    onDeactivate: () => {
        // Cleanup state
        lastPoint = null;
        isActive = false;
    },
    
    // ... use lastPoint and isActive in handlers
};
```

## Coordinate System

- Canvas center is `(0, 0)`
- X increases to the right
- Y increases downward
- Valid range: `-maxSize/2` to `maxSize/2 - 1` (e.g., -500 to 499)

```typescript
function isInBounds(x: number, y: number, maxSize: number): boolean {
    const halfSize = maxSize / 2;
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
| Fill | Sync | Single click, immediate result |
| Pen | Async + Bezier | Buffered input, curve smoothing |
| Eraser | Async + Bezier | Same as pen, deletes instead |
| Selection | Async | Tracks bounds, doesn't modify pixels |
| Shape | Async | Preview on move, commit on release |
| Spray Paint | Async | Random scatter, no smoothing |

## Utilities

Tools can provide custom UI via the `utilities` property. These render in the utilities panel when the tool is selected. For now, utilities are wired up in `pixel-editor-page.tsx` based on tool ID.

