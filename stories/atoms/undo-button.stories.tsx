import type { Meta, StoryObj } from "@storybook/react";
import { UndoButton } from "../../client/src/components/atoms/undo-button";
import { fn } from "storybook/test";

const meta = {
    title: "Atoms/UndoButton",
    component: UndoButton,
    parameters: {
        layout: "centered",
    },
    tags: ["autodocs"],
    args: {
        onClick: fn(),
    },
} satisfies Meta<typeof UndoButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        disabled: false,
    },
};

export const Disabled: Story = {
    args: {
        disabled: true,
    },
};

export const WithClickHandler: Story = {
    args: {
        disabled: false,
        onClick: fn(),
    },
};

