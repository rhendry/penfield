import type { Meta, StoryObj } from "@storybook/react";
import { Toolbelt } from "../../client/src/components/toolbelt/toolbelt";
import { Pencil, Eraser, MousePointer2, PaintBucket, Move } from "lucide-react";
import { fn, expect, userEvent, within } from "storybook/test";
import { useState } from "react";

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
    // Row 1: Number keys (1, 2, 3, 4)
    { id: "1", hotkey: "1", tool: tools[0], isActive: false },
    { id: "2", hotkey: "2", tool: tools[1], isActive: false },
    { id: "3", hotkey: "3", tool: tools[2], isActive: true },
    { id: "4", hotkey: "4", tool: tools[3], isActive: false },
    // Row 2: Q, W, E, R
    { id: "5", hotkey: "Q", tool: tools[4], isActive: false },
    { id: "6", hotkey: "W", isActive: false }, // Empty slot
    { id: "7", hotkey: "E", isActive: false }, // Empty slot
    { id: "8", hotkey: "R", isActive: false }, // Empty slot
    // Row 3: A, S, D, F
    { id: "9", hotkey: "A", isActive: false }, // Empty slot
    { id: "10", hotkey: "S", isActive: false }, // Empty slot
    { id: "11", hotkey: "D", isActive: false }, // Empty slot
    { id: "12", hotkey: "F", isActive: false }, // Empty slot
];

// Wrapper component that manages active state for interactive stories
function InteractiveToolbelt({
    initialSlots,
    config,
}: {
    initialSlots: typeof slots;
    config?: { rows?: number; cols?: number };
}) {
    const [slotsState, setSlotsState] = useState(initialSlots);

    const handleSlotClick = (slotId: string) => {
        setSlotsState((prev) =>
            prev.map((slot) => ({
                ...slot,
                isActive: slot.id === slotId,
            }))
        );
    };

    return (
        <Toolbelt
            slots={slotsState}
            onSlotClick={handleSlotClick}
            keyboardEnabled={true}
            config={config}
        />
    );
}

export const Default: Story = {
    args: {
        slots: slots,
    },
};

export const Interactive: Story = {
    render: () => <InteractiveToolbelt initialSlots={slots} />,
};

export const WithKeyboardCapture: Story = {
    args: {
        slots: slots,
        keyboardEnabled: true,
    },
    play: async ({ canvasElement, args }) => {
        const canvas = within(canvasElement);
        const onSlotClick = args.onSlotClick as ReturnType<typeof fn>;

        // Wait a moment for the component to mount
        await new Promise((resolve) => setTimeout(resolve, 100));

        // Test pressing 'Q' key - should trigger slot 5
        await userEvent.keyboard("q");
        await expect(onSlotClick).toHaveBeenCalledWith("5");

        // Test pressing '1' key - should trigger slot 1
        await userEvent.keyboard("1");
        await expect(onSlotClick).toHaveBeenCalledWith("1");

        // Test pressing 'E' key - should trigger slot 7
        await userEvent.keyboard("e");
        await expect(onSlotClick).toHaveBeenCalledWith("7");
    },
};

export const KeyboardDisabled: Story = {
    args: {
        slots: slots,
        keyboardEnabled: false,
    },
    play: async ({ canvasElement, args }) => {
        const canvas = within(canvasElement);
        const onSlotClick = args.onSlotClick as ReturnType<typeof fn>;

        // Wait a moment for the component to mount
        await new Promise((resolve) => setTimeout(resolve, 100));

        // Test pressing 'Q' key - should NOT trigger anything
        await userEvent.keyboard("q");
        await expect(onSlotClick).not.toHaveBeenCalled();
    },
};

// Configuration: 2 rows, 4 cols (1-4 and Q-R)
const slots2x4 = [
    { id: "1", hotkey: "1", tool: tools[0], isActive: false },
    { id: "2", hotkey: "2", tool: tools[1], isActive: false },
    { id: "3", hotkey: "3", tool: tools[2], isActive: true },
    { id: "4", hotkey: "4", tool: tools[3], isActive: false },
    { id: "5", hotkey: "Q", tool: tools[4], isActive: false },
    { id: "6", hotkey: "W", isActive: false },
    { id: "7", hotkey: "E", isActive: false },
    { id: "8", hotkey: "R", isActive: false },
];

export const TwoRowsFourCols: Story = {
    args: {
        slots: slots2x4,
        config: { rows: 2, cols: 4 },
    },
};

export const TwoRowsFourColsInteractive: Story = {
    render: () => (
        <InteractiveToolbelt
            initialSlots={slots2x4}
            config={{ rows: 2, cols: 4 }}
        />
    ),
};

// Configuration: 2 rows, 6 cols (1-6 and Q-Y)
const slots2x6 = [
    { id: "1", hotkey: "1", tool: tools[0], isActive: false },
    { id: "2", hotkey: "2", tool: tools[1], isActive: false },
    { id: "3", hotkey: "3", tool: tools[2], isActive: true },
    { id: "4", hotkey: "4", tool: tools[3], isActive: false },
    { id: "5", hotkey: "5", tool: tools[4], isActive: false },
    { id: "6", hotkey: "6", isActive: false },
    { id: "7", hotkey: "Q", isActive: false },
    { id: "8", hotkey: "W", isActive: false },
    { id: "9", hotkey: "E", isActive: false },
    { id: "10", hotkey: "R", isActive: false },
    { id: "11", hotkey: "T", isActive: false },
    { id: "12", hotkey: "Y", isActive: false },
];

export const TwoRowsSixCols: Story = {
    args: {
        slots: slots2x6,
        config: { rows: 2, cols: 6 },
    },
};

export const TwoRowsSixColsInteractive: Story = {
    render: () => (
        <InteractiveToolbelt
            initialSlots={slots2x6}
            config={{ rows: 2, cols: 6 }}
        />
    ),
};

// Configuration: 1 row, 7 cols (1-7)
const slots1x7 = [
    { id: "1", hotkey: "1", tool: tools[0], isActive: false },
    { id: "2", hotkey: "2", tool: tools[1], isActive: false },
    { id: "3", hotkey: "3", tool: tools[2], isActive: true },
    { id: "4", hotkey: "4", tool: tools[3], isActive: false },
    { id: "5", hotkey: "5", tool: tools[4], isActive: false },
    { id: "6", hotkey: "6", isActive: false },
    { id: "7", hotkey: "7", isActive: false },
];

export const OneRowSevenCols: Story = {
    args: {
        slots: slots1x7,
        config: { rows: 1, cols: 7 },
    },
};

// Configuration: 4 rows, 4 cols
const slots4x4 = [
    { id: "1", hotkey: "1", tool: tools[0], isActive: false },
    { id: "2", hotkey: "2", tool: tools[1], isActive: false },
    { id: "3", hotkey: "3", tool: tools[2], isActive: true },
    { id: "4", hotkey: "4", tool: tools[3], isActive: false },
    { id: "5", hotkey: "Q", tool: tools[4], isActive: false },
    { id: "6", hotkey: "W", isActive: false },
    { id: "7", hotkey: "E", isActive: false },
    { id: "8", hotkey: "R", isActive: false },
    { id: "9", hotkey: "A", isActive: false },
    { id: "10", hotkey: "S", isActive: false },
    { id: "11", hotkey: "D", isActive: false },
    { id: "12", hotkey: "F", isActive: false },
    { id: "13", hotkey: "Z", isActive: false },
    { id: "14", hotkey: "X", isActive: false },
    { id: "15", hotkey: "C", isActive: false },
    { id: "16", hotkey: "V", isActive: false },
];

export const FourRowsFourCols: Story = {
    args: {
        slots: slots4x4,
        config: { rows: 4, cols: 4 },
    },
};
