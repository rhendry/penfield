import { useCallback, useRef, useEffect } from "react";
import { PixelCanvas, PixelCanvasHandle } from "./pixel-canvas";
import { Tool } from "@/components/toolbelt/types";
import { getTool, ToolContext } from "@/tools";

interface PixelEditorProps {
    initialContent: any;
    selectedTool: Tool | null;
    leftClickColor: string;
    rightClickColor: string;
    onPixelsChange?: (pixels: Record<string, string>) => void;
    className?: string;
}

export function PixelEditor({
    initialContent,
    selectedTool,
    leftClickColor,
    rightClickColor,
    onPixelsChange,
    className,
}: PixelEditorProps) {
    const canvasRef = useRef<PixelCanvasHandle>(null);
    const maxSize = 1000;
    const halfSize = maxSize / 2;

    // Track current button being held
    const currentButtonRef = useRef<"left" | "right" | null>(null);

    // Track previous tool for activation/deactivation
    const previousToolIdRef = useRef<string | null>(null);

    // Store onPixelsChange in ref to avoid dependency issues
    const onPixelsChangeRef = useRef(onPixelsChange);
    useEffect(() => {
        onPixelsChangeRef.current = onPixelsChange;
    }, [onPixelsChange]);

    // Load initial content
    useEffect(() => {
        if (canvasRef.current && initialContent?.grid) {
            canvasRef.current.loadPixels(initialContent.grid);
        }
    }, [initialContent]);

    // Create tool context - provides canvas access methods
    const createToolContext = useCallback((): ToolContext => {
        return {
            maxSize,
            halfSize,
            leftClickColor,
            rightClickColor,

            getPixel: (x: number, y: number) => {
                return canvasRef.current?.getPixel(x, y) ?? null;
            },

            applyPixels: (delta) => {
                canvasRef.current?.applyPixels(delta);
            },

            requestRender: () => {
                canvasRef.current?.render();
            },

            requestFrame: (callback) => requestAnimationFrame(callback),
            cancelFrame: (id) => cancelAnimationFrame(id),
        };
    }, [leftClickColor, rightClickColor, halfSize]);

    // Handle tool activation/deactivation when selected tool changes
    useEffect(() => {
        const currentToolId = selectedTool?.id ?? null;
        const previousToolId = previousToolIdRef.current;

        // Deactivate previous tool
        if (previousToolId && previousToolId !== currentToolId) {
            const prevTool = getTool(previousToolId);
            if (prevTool?.onDeactivate) {
                prevTool.onDeactivate(createToolContext());
            }
        }

        // Activate new tool
        if (currentToolId && currentToolId !== previousToolId) {
            const newTool = getTool(currentToolId);
            if (newTool?.onActivate) {
                newTool.onActivate(createToolContext());
            }
        }

        previousToolIdRef.current = currentToolId;
    }, [selectedTool, createToolContext]);

    // Handle pixel click - delegate to tool
    const handlePixelClick = useCallback((x: number, y: number, button: "left" | "right") => {
        if (!selectedTool) return;

        const tool = getTool(selectedTool.id);
        if (!tool) return;

        currentButtonRef.current = button;
        tool.onPointerDown(x, y, button, createToolContext());
    }, [selectedTool, createToolContext]);

    // Handle pixel drag - delegate to tool
    const handlePixelDrag = useCallback((x: number, y: number, _button: "left" | "right") => {
        if (!selectedTool) return;

        const tool = getTool(selectedTool.id);
        if (!tool) return;

        tool.onPointerMove(x, y, currentButtonRef.current, createToolContext());
    }, [selectedTool, createToolContext]);

    // Handle mouse up - delegate to tool and notify parent
    const handleMouseUp = useCallback(() => {
        if (!selectedTool) return;

        const tool = getTool(selectedTool.id);
        if (tool) {
            tool.onPointerUp(createToolContext());
        }

        currentButtonRef.current = null;

        // Notify parent of pixel changes (for saving)
        if (onPixelsChangeRef.current && canvasRef.current) {
            onPixelsChangeRef.current(canvasRef.current.getAllPixels());
        }
    }, [selectedTool, createToolContext]);

    return (
        <PixelCanvas
            ref={canvasRef}
            onPixelClick={handlePixelClick}
            onPixelDrag={handlePixelDrag}
            onMouseUp={handleMouseUp}
            className={className}
        />
    );
}
