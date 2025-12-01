import type { Meta, StoryObj } from "@storybook/react";
import { ToolSlot } from "../../client/src/components/toolbelt/tool-slot";
import { Pencil } from "lucide-react";
import { fn } from "storybook/test";

const meta = {
    title: "Toolbelt/ToolSlot",
    component: ToolSlot,
    parameters: {
        layout: "centered",
    },
    tags: ["autodocs"],
    args: {
        onClick: fn(),
    },
} satisfies Meta<typeof ToolSlot>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        id: "1",
        hotkey: "Q",
        tool: {
            id: "pencil",
            name: "Pencil",
            icon: Pencil,
        },
        isActive: false,
    },
};

export const Active: Story = {
    args: {
        ...Default.args,
        isActive: true,
    },
};

export const Empty: Story = {
    args: {
        id: "2",
        hotkey: "W",
        isActive: false,
    },
};
