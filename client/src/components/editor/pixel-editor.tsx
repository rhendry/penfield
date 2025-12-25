import { useCallback, useRef, useEffect } from "react";
import { PixelCanvas, PixelCanvasHandle } from "./pixel-canvas";
import { Tool } from "@/components/toolbelt/types";
import { getTool, ToolContext } from "@/tools";
import { useRenderContext } from "./render-context";
import type { PixelAssetContent } from "@shared/types/pixel-asset";
import { migrateLegacyContent, getActiveObject } from "@shared/utils/pixel-asset";
import type { UndoableAction } from "@/utils/undo-redo-actions";
import { createPixelChangeAction } from "@/utils/undo-redo-actions";
import { UndoButton } from "@/components/atoms/undo-button";
import { RedoButton } from "@/components/atoms/redo-button";
import { cn } from "@/lib/utils";

interface PixelEditorProps {
    initialContent: any;
    selectedTool: Tool | null;
    leftClickColor: string;
    rightClickColor: string;
    onPixelsChange?: (pixels: Record<string, string>) => void;
    onAction?: (action: UndoableAction) => void;
    onUndo?: () => void;
    onRedo?: () => void;
    canUndo?: boolean;
    canRedo?: boolean;
    className?: string;
}

export function PixelEditor({
    initialContent,
    selectedTool,
    leftClickColor,
    rightClickColor,
    onPixelsChange,
    onAction,
    onUndo,
    onRedo,
    canUndo = false,
    canRedo = false,
    className,
}: PixelEditorProps) {
    const { content, setContent, markDirty } = useRenderContext();
    const canvasRef = useRef<PixelCanvasHandle>(null);
    const maxSize = 256;
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

    // Store onAction in ref to avoid dependency issues
    const onActionRef = useRef(onAction);
    useEffect(() => {
        onActionRef.current = onAction;
    }, [onAction]);

    // Track action state for undo/redo
    const actionBeforeStateRef = useRef<Record<string, string> | null>(null);
    const actionObjectIdRef = useRef<string | null>(null);

    // Load initial content and migrate if needed
    useEffect(() => {
        if (initialContent) {
            // Check if it's legacy format
            if ("grid" in initialContent && !("objects" in initialContent)) {
                const migrated = migrateLegacyContent(initialContent);
                setContent(migrated);
            } else if ("objects" in initialContent) {
                // Already in new format
                setContent(initialContent as PixelAssetContent);
            }
        }
    }, [initialContent, setContent]);

    // Canvas rendering is now handled by renderAssetContent in PixelCanvas
    // No need to manually load pixels - the canvas renders from content automatically

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

            getPixelData: () => {
                return canvasRef.current?.getPixelData() ?? null;
            },

            requestRender: () => {
                canvasRef.current?.render();
            },

            requestFrame: (callback) => requestAnimationFrame(callback),
            cancelFrame: (id) => cancelAnimationFrame(id),

            getActiveObject: () => {
                return getActiveObject(content);
            },

            getSelectedObject: () => {
                // For now, selected object is same as active object
                // This can be extended later if we want separate selection
                return getActiveObject(content);
            },

            applyPixelsToObject: (delta, objectId) => {
                const targetId = objectId ?? content.activeObjectId;
                if (!targetId) return;

                // Capture before state on first call (pointer down)
                if (actionBeforeStateRef.current === null && actionObjectIdRef.current === null) {
                    const activeObject = getActiveObject(content);
                    if (activeObject && activeObject.id === targetId) {
                        actionBeforeStateRef.current = { ...activeObject.pixels };
                        actionObjectIdRef.current = targetId;
                    }
                }

                const updateObject = (obj: typeof content.objects[0]): typeof content.objects[0] => {
                    if (obj.id === targetId) {
                        const newPixels = { ...obj.pixels };
                        for (const [key, value] of Object.entries(delta)) {
                            if (value === null) {
                                delete newPixels[key];
                            } else {
                                newPixels[key] = value;
                            }
                        }
                        return { ...obj, pixels: newPixels };
                    }
                    return {
                        ...obj,
                        children: obj.children.map(updateObject),
                    };
                };

                const newContent = {
                    ...content,
                    objects: content.objects.map(updateObject),
                };
                setContent(newContent);
                markDirty();
            },
        };
    }, [leftClickColor, rightClickColor, halfSize, content, setContent, markDirty]);

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

        // Reset action tracking for new operation
        actionBeforeStateRef.current = null;
        actionObjectIdRef.current = null;

        // Capture before state
        const activeObject = getActiveObject(content);
        if (activeObject) {
            actionBeforeStateRef.current = { ...activeObject.pixels };
            actionObjectIdRef.current = activeObject.id;
        }

        currentButtonRef.current = button;
        tool.onPointerDown(x, y, button, createToolContext());
    }, [selectedTool, createToolContext, content]);

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

        // Update active object's pixels from canvas
        const activeObject = getActiveObject(content);
        if (activeObject && canvasRef.current) {
            const pixels = canvasRef.current.getAllPixels();
            const updateObject = (obj: typeof content.objects[0]): typeof content.objects[0] => {
                if (obj.id === activeObject.id) {
                    return { ...obj, pixels };
                }
                return {
                    ...obj,
                    children: obj.children.map(updateObject),
                };
            };

            const newContent = {
                ...content,
                objects: content.objects.map(updateObject),
            };
            setContent(newContent);
            markDirty();

            // Create undo action if we tracked changes
            if (
                actionBeforeStateRef.current !== null &&
                actionObjectIdRef.current !== null &&
                actionObjectIdRef.current === activeObject.id &&
                onActionRef.current
            ) {
                const beforePixels = actionBeforeStateRef.current;
                const afterPixels = pixels;

                // Only create action if pixels actually changed
                const beforeKeys = Object.keys(beforePixels).sort().join(",");
                const afterKeys = Object.keys(afterPixels).sort().join(",");
                if (beforeKeys !== afterKeys || JSON.stringify(beforePixels) !== JSON.stringify(afterPixels)) {
                    const action = createPixelChangeAction(
                        actionObjectIdRef.current,
                        beforePixels,
                        afterPixels
                    );
                    onActionRef.current(action);
                }
            }

            // Reset action tracking
            actionBeforeStateRef.current = null;
            actionObjectIdRef.current = null;

            // Notify parent of pixel changes (for saving)
            if (onPixelsChangeRef.current) {
                onPixelsChangeRef.current(pixels);
            }
        }
    }, [selectedTool, createToolContext, content, setContent, markDirty]);

    return (
        <div className={cn("relative w-full h-full", className)}>
            <PixelCanvas
                ref={canvasRef}
                content={content}
                onPixelClick={handlePixelClick}
                onPixelDrag={handlePixelDrag}
                onMouseUp={handleMouseUp}
                className="w-full h-full"
            />
            {/* Undo/Redo buttons in top-right */}
            <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
                <UndoButton onClick={onUndo ?? (() => {})} disabled={!canUndo} />
                <RedoButton onClick={onRedo ?? (() => {})} disabled={!canRedo} />
            </div>
        </div>
    );
}
