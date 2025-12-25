import type { Meta, StoryObj } from "@storybook/react";
import { RedoButton } from "../../client/src/components/atoms/redo-button";
import { fn } from "storybook/test";

const meta = {
    title: "Atoms/RedoButton",
    component: RedoButton,
    parameters: {
        layout: "centered",
    },
    tags: ["autodocs"],
    args: {
        onClick: fn(),
    },
} satisfies Meta<typeof RedoButton>;

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

