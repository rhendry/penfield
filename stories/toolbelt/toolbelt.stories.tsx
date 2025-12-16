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
function InteractiveToolbelt({ initialSlots }: { initialSlots: typeof slots }) {
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
