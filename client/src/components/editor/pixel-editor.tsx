import { useState, useCallback, useRef, useEffect } from "react";
import { PixelCanvas } from "./pixel-canvas";
import { Tool } from "@/components/toolbelt/types";
import { getTool, ToolContext } from "@/tools";

interface PixelEditorProps {
    initialContent: any;
    selectedTool: Tool | null;
    leftClickColor: string;
    rightClickColor: string;
    onPixelsChange: (pixels: Record<string, string>) => void;
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
    // Pixel data: key is "x,y", value is color string
    const [pixels, setPixels] = useState<Record<string, string>>(
        initialContent?.grid || {}
    );

    const maxSize = 1000;

    // Track current button being held
    const currentButtonRef = useRef<"left" | "right" | null>(null);

    // Track previous tool for activation/deactivation
    const previousToolIdRef = useRef<string | null>(null);

    // Update parent when pixels change (use ref to avoid infinite loop)
    const onPixelsChangeRef = useRef(onPixelsChange);
    useEffect(() => {
        onPixelsChangeRef.current = onPixelsChange;
    }, [onPixelsChange]);

    useEffect(() => {
        onPixelsChangeRef.current(pixels);
    }, [pixels]);

    // Create tool context - provides read access and mutations
    const createToolContext = useCallback((): ToolContext => {
        return {
            pixels,
            maxSize,
            leftClickColor,
            rightClickColor,
            setPixels,
            requestDraw: (callback: () => void) => requestAnimationFrame(callback),
            cancelDraw: (id: number) => cancelAnimationFrame(id),
        };
    }, [pixels, leftClickColor, rightClickColor]);

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

    // Handle mouse up - delegate to tool
    const handleMouseUp = useCallback(() => {
        if (!selectedTool) return;

        const tool = getTool(selectedTool.id);
        if (tool) {
            tool.onPointerUp(createToolContext());
        }

        currentButtonRef.current = null;
    }, [selectedTool, createToolContext]);

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
