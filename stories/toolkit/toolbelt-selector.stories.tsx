import type { Meta, StoryObj } from "@storybook/react";
import { ToolbeltSelector } from "../../client/src/components/toolbelt/toolbelt-selector";
import { fn } from "storybook/test";

const meta = {
    title: "Toolkit/ToolbeltSelector",
    component: ToolbeltSelector,
    parameters: {
        layout: "fullscreen",
    },
    tags: ["autodocs"],
    args: {
        onSelectToolbelt: fn(),
    },
} satisfies Meta<typeof ToolbeltSelector>;

export default meta;
type Story = StoryObj<typeof meta>;

const toolbelts = [
    { id: "1", name: "Pixel Art", description: "Tools for pixel art creation", hotkey: "1" },
    { id: "2", name: "Voxel Art", description: "Tools for voxel art creation", hotkey: "2" },
    { id: "3", name: "Animation", description: "Tools for animation", hotkey: "3" },
    { id: "4", name: "Effects", description: "Visual effects tools", hotkey: "4" },
];

export const WithFourToolbelts: Story = {
    args: {
        toolbelts,
        config: { rows: 1, cols: 4 },
    },
};

export const WithTwoToolbelts: Story = {
    args: {
        toolbelts: toolbelts.slice(0, 2),
        config: { rows: 1, cols: 2 },
    },
};

export const Empty: Story = {
    args: {
        toolbelts: [],
        config: { rows: 1, cols: 4 },
    },
};

