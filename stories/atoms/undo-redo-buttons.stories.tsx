import type { Meta, StoryObj } from "@storybook/react";
import { UndoButton } from "../../client/src/components/atoms/undo-button";
import { RedoButton } from "../../client/src/components/atoms/redo-button";
import { fn } from "storybook/test";

const meta = {
    title: "Atoms/UndoRedoButtons",
    parameters: {
        layout: "centered",
    },
    tags: ["autodocs"],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const BothEnabled: Story = {
    render: () => (
        <div className="flex flex-col gap-2">
            <UndoButton onClick={fn()} disabled={false} />
            <RedoButton onClick={fn()} disabled={false} />
        </div>
    ),
};

export const BothDisabled: Story = {
    render: () => (
        <div className="flex flex-col gap-2">
            <UndoButton onClick={fn()} disabled={true} />
            <RedoButton onClick={fn()} disabled={true} />
        </div>
    ),
};

export const UndoEnabled: Story = {
    render: () => (
        <div className="flex flex-col gap-2">
            <UndoButton onClick={fn()} disabled={false} />
            <RedoButton onClick={fn()} disabled={true} />
        </div>
    ),
};

export const RedoEnabled: Story = {
    render: () => (
        <div className="flex flex-col gap-2">
            <UndoButton onClick={fn()} disabled={true} />
            <RedoButton onClick={fn()} disabled={false} />
        </div>
    ),
};

