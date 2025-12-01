import type { Meta, StoryObj } from "@storybook/react";
import { Toolbelt } from "../../client/src/components/toolbelt/toolbelt";
import { Pencil, Eraser, MousePointer2, PaintBucket, Move } from "lucide-react";
import { fn } from "storybook/test";

const meta = {
    title: "Toolbelt/Toolbelt",
    component: Toolbelt,
    parameters: {
        layout: "fullscreen",
    },
    tags: ["autodocs"],
    args: {
        onSlotClick: fn(),
    },
} satisfies Meta<typeof Toolbelt>;

export default meta;
type Story = StoryObj<typeof meta>;

const tools = [
    { id: "select", name: "Select", icon: MousePointer2 },
    { id: "move", name: "Move", icon: Move },
    { id: "pencil", name: "Pencil", icon: Pencil },
    { id: "eraser", name: "Eraser", icon: Eraser },
    { id: "fill", name: "Fill", icon: PaintBucket },
];

const slots = [
    { id: "1", hotkey: "Q", tool: tools[0], isActive: false },
    { id: "2", hotkey: "W", tool: tools[1], isActive: false },
    { id: "3", hotkey: "E", tool: tools[2], isActive: true },
    { id: "4", hotkey: "R", tool: tools[3], isActive: false },
    { id: "5", hotkey: "A", tool: tools[4], isActive: false },
    { id: "6", hotkey: "S", isActive: false }, // Empty slot
];

export const Default: Story = {
    args: {
        slots: slots,
    },
};
