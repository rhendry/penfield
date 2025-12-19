import type { Meta, StoryObj } from "@storybook/react";
import { KeyboardKey } from "../../client/src/components/ui/keyboard-key";
import { HotkeyTip } from "../../client/src/components/ui/hotkey-tip";

const meta = {
    title: "UI/KeyboardKey",
    component: KeyboardKey,
    parameters: {
        layout: "centered",
    },
    tags: ["autodocs"],
} satisfies Meta<typeof KeyboardKey>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    render: () => (
        <div className="flex items-center gap-2">
            <KeyboardKey>A</KeyboardKey>
            <KeyboardKey>B</KeyboardKey>
            <KeyboardKey>Ctrl</KeyboardKey>
            <KeyboardKey>Space</KeyboardKey>
        </div>
    ),
};

export const Sizes: Story = {
    render: () => (
        <div className="flex flex-col items-start gap-4">
            <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground w-20">Small:</span>
                <KeyboardKey size="sm">Z</KeyboardKey>
                <KeyboardKey size="sm">X</KeyboardKey>
            </div>
            <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground w-20">Medium:</span>
                <KeyboardKey size="md">Z</KeyboardKey>
                <KeyboardKey size="md">X</KeyboardKey>
            </div>
            <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground w-20">Large:</span>
                <KeyboardKey size="lg">Z</KeyboardKey>
                <KeyboardKey size="lg">X</KeyboardKey>
            </div>
        </div>
    ),
};

export const Variants: Story = {
    render: () => (
        <div className="flex flex-col items-start gap-4">
            <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground w-24">Default:</span>
                <KeyboardKey variant="default">Z</KeyboardKey>
                <KeyboardKey variant="default">X</KeyboardKey>
            </div>
            <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground w-24">Ghost:</span>
                <KeyboardKey variant="ghost">Z</KeyboardKey>
                <KeyboardKey variant="ghost">X</KeyboardKey>
            </div>
        </div>
    ),
};

export const CommonKeys: Story = {
    render: () => (
        <div className="flex flex-wrap items-center gap-2">
            <KeyboardKey>Esc</KeyboardKey>
            <KeyboardKey>Tab</KeyboardKey>
            <KeyboardKey>Ctrl</KeyboardKey>
            <KeyboardKey>Alt</KeyboardKey>
            <KeyboardKey>Shift</KeyboardKey>
            <KeyboardKey>Space</KeyboardKey>
            <KeyboardKey>Enter</KeyboardKey>
            <KeyboardKey>Backspace</KeyboardKey>
            <KeyboardKey>Delete</KeyboardKey>
            <KeyboardKey>↑</KeyboardKey>
            <KeyboardKey>↓</KeyboardKey>
            <KeyboardKey>←</KeyboardKey>
            <KeyboardKey>→</KeyboardKey>
        </div>
    ),
};

