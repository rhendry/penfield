import type { Meta, StoryObj } from "@storybook/react";
import { HotkeyTip } from "../../client/src/components/ui/hotkey-tip";

const meta = {
    title: "UI/HotkeyTip",
    component: HotkeyTip,
    parameters: {
        layout: "centered",
    },
    tags: ["autodocs"],
} satisfies Meta<typeof HotkeyTip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SingleKey: Story = {
    render: () => (
        <div className="space-y-4">
            <HotkeyTip keys={["Z"]} />
            <HotkeyTip label="Undo" keys={["Z"]} />
        </div>
    ),
};

export const MultipleKeys: Story = {
    render: () => (
        <div className="space-y-4">
            <HotkeyTip keys={["Z", "X"]} />
            <HotkeyTip label="Cycle colors" keys={["Z", "X"]} />
        </div>
    ),
};

export const KeyCombinations: Story = {
    render: () => (
        <div className="space-y-4">
            <HotkeyTip keys={[["Ctrl", "S"]]} />
            <HotkeyTip label="Save" keys={[["Ctrl", "S"]]} />
            <HotkeyTip keys={[["Ctrl", "Space"]]} />
            <HotkeyTip label="Toggle utilities" keys={[["Ctrl", "Space"]]} />
        </div>
    ),
};

export const Mixed: Story = {
    render: () => (
        <div className="space-y-4">
            <HotkeyTip keys={["Z", "X", ["Ctrl", "C"]]} />
            <HotkeyTip label="Actions" keys={["Z", "X", ["Ctrl", "C"]]} />
        </div>
    ),
};

export const Sizes: Story = {
    render: () => (
        <div className="space-y-4">
            <HotkeyTip label="Small" keys={["Z", "X"]} size="sm" />
            <HotkeyTip label="Medium" keys={["Z", "X"]} size="md" />
            <HotkeyTip label="Large" keys={["Z", "X"]} size="lg" />
        </div>
    ),
};

export const Variants: Story = {
    render: () => (
        <div className="space-y-4">
            <HotkeyTip label="Default" keys={["Z", "X"]} variant="default" />
            <HotkeyTip label="Ghost" keys={["Z", "X"]} variant="ghost" />
        </div>
    ),
};

export const RealWorldExamples: Story = {
    render: () => (
        <div className="space-y-3 p-4 bg-background rounded-lg border border-white/10">
            <HotkeyTip label="Cycle colors" keys={["Z", "X"]} />
            <HotkeyTip label="Toggle utilities panel" keys={[["Ctrl", "Space"]]} />
            <HotkeyTip label="Save project" keys={[["Ctrl", "S"]]} />
            <HotkeyTip label="Open toolkit explorer" keys={["Space"]} />
            <HotkeyTip label="Cycle quick select" keys={["Tab"]} />
        </div>
    ),
};

