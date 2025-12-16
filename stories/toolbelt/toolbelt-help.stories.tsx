import type { Meta, StoryObj } from "@storybook/react";
import { ToolbeltHelp } from "../../client/src/components/toolbelt/toolbelt-help";
import { Pencil, Eraser, MousePointer2, PaintBucket, Move } from "lucide-react";

const meta = {
    title: "Toolbelt/ToolbeltHelp",
    component: ToolbeltHelp,
    parameters: {
        layout: "fullscreen",
    },
    tags: ["autodocs"],
} satisfies Meta<typeof ToolbeltHelp>;

export default meta;
type Story = StoryObj<typeof meta>;

const tools = [
    {
        id: "select",
        name: "Select",
        icon: MousePointer2,
        description: "Select and move objects on the canvas. Click and drag to create selection boxes.",
    },
    {
        id: "move",
        name: "Move",
        icon: Move,
        description: "Move selected objects around the canvas. Use arrow keys for precise positioning.",
    },
    {
        id: "pencil",
        name: "Pencil",
        icon: Pencil,
        description: "Draw freehand strokes on the canvas. Hold Shift for straight lines. Right-click to erase.",
    },
    {
        id: "eraser",
        name: "Eraser",
        icon: Eraser,
        description: "Erase pixels from the canvas. Adjust brush size with bracket keys [ and ].",
    },
    {
        id: "fill",
        name: "Fill",
        icon: PaintBucket,
        description: "Fill connected areas with the selected color. Right-click to fill with background color.",
    },
];

const slots = [
    { id: "1", hotkey: "1", tool: tools[0], isActive: false },
    { id: "2", hotkey: "2", tool: tools[1], isActive: false },
    { id: "3", hotkey: "3", tool: tools[2], isActive: true },
    { id: "4", hotkey: "4", tool: tools[3], isActive: false },
    { id: "5", hotkey: "Q", tool: tools[4], isActive: false },
    { id: "6", hotkey: "W", isActive: false },
    { id: "7", hotkey: "E", isActive: false },
    { id: "8", hotkey: "R", isActive: false },
];

export const Default: Story = {
    args: {
        slots: slots,
    },
};

export const NoActiveTool: Story = {
    args: {
        slots: slots.map((slot) => ({ ...slot, isActive: false })),
    },
};

export const EmptyToolbelt: Story = {
    args: {
        slots: slots.map((slot) => ({ ...slot, tool: undefined })),
    },
};

