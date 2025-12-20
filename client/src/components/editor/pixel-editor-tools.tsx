import { Tool, ToolbeltSlot } from "@/components/toolbelt/types";

/**
 * Pixel Editor Tools
 * These are the default tools available in the pixel editor.
 * Utilities are added dynamically when tools are selected.
 */

export const PEN_TOOL: Tool = {
    id: "pen",
    name: "Pen",
    description: "Draw pixels with left and right click colors",
    iconType: "lucide",
    iconName: "Pencil",
    hotkey: "1",
};

export const ERASER_TOOL: Tool = {
    id: "eraser",
    name: "Eraser",
    description: "Erase pixels",
    iconType: "lucide",
    iconName: "Eraser",
    hotkey: "2",
};

export const FILL_TOOL: Tool = {
    id: "fill",
    name: "Fill",
    description: "Flood fill connected pixels",
    iconType: "lucide",
    iconName: "PaintBucket",
    hotkey: "3",
};

export const PIXEL_EDITOR_TOOLS = [PEN_TOOL, ERASER_TOOL, FILL_TOOL];

/**
 * Default toolbelt for pixel editor
 * Contains Pen, Eraser, and Fill tools
 */
export const DEFAULT_PIXEL_TOOLBELT: ToolbeltSlot[] = [
    {
        id: "slot-1",
        hotkey: "1",
        tool: PEN_TOOL,
    },
    {
        id: "slot-2",
        hotkey: "2",
        tool: ERASER_TOOL,
    },
    {
        id: "slot-3",
        hotkey: "3",
        tool: FILL_TOOL,
    },
];

