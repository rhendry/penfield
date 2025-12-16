import type { Meta, StoryObj } from "@storybook/react";
import { QuickSelect } from "../../client/src/components/toolbelt/quick-select";
import { Pencil, Eraser, MousePointer2, PaintBucket, Move } from "lucide-react";
import { fn } from "storybook/test";
import { useState } from "react";

const meta = {
    title: "Toolkit/QuickSelect",
    component: QuickSelect,
    parameters: {
        layout: "fullscreen",
    },
    tags: ["autodocs"],
    args: {
        onSelect: fn(),
    },
} satisfies Meta<typeof QuickSelect>;

export default meta;
type Story = StoryObj<typeof meta>;

const tools = [
    {
        id: "select",
        name: "Select",
        icon: MousePointer2,
        iconType: "lucide" as const,
        iconName: "MousePointer2",
    },
    {
        id: "pencil",
        name: "Pencil",
        icon: Pencil,
        iconType: "lucide" as const,
        iconName: "Pencil",
    },
    {
        id: "eraser",
        name: "Eraser",
        icon: Eraser,
        iconType: "lucide" as const,
        iconName: "Eraser",
    },
    {
        id: "fill",
        name: "Fill",
        icon: PaintBucket,
        iconType: "lucide" as const,
        iconName: "PaintBucket",
    },
    {
        id: "move",
        name: "Move",
        icon: Move,
        iconType: "lucide" as const,
        iconName: "Move",
    },
];

export const Empty: Story = {
    args: {
        slots: [],
        activeSlotId: undefined,
    },
};

export const WithOneSlot: Story = {
    args: {
        slots: [
            {
                id: "1",
                tool: tools[0],
                position: 0,
                lastUsedAt: new Date(),
            },
        ],
        activeSlotId: undefined,
    },
};

export const WithFiveSlots: Story = {
    args: {
        slots: tools.map((tool, index) => ({
            id: String(index + 1),
            tool,
            position: index,
            lastUsedAt: new Date(),
        })),
        activeSlotId: "3",
    },
};

export const Interactive: Story = {
    render: () => {
        const [activeSlotId, setActiveSlotId] = useState<string | undefined>("3");
        return (
            <div className="relative w-full h-screen bg-background">
                <QuickSelect
                    slots={tools.map((tool, index) => ({
                        id: String(index + 1),
                        tool,
                        position: index,
                        lastUsedAt: new Date(),
                    }))}
                    activeSlotId={activeSlotId}
                    onSelect={(slotId) => {
                        setActiveSlotId(slotId);
                        console.log("Selected slot:", slotId);
                    }}
                />
                <div className="fixed top-4 left-4 p-4 bg-background border rounded-lg">
                    <p className="text-sm text-muted-foreground">
                        Press Tab to cycle through slots
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                        Active: {activeSlotId || "None"}
                    </p>
                </div>
            </div>
        );
    },
};

