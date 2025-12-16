import type { Meta, StoryObj } from "@storybook/react";
import { ToolkitExplorer } from "../../client/src/components/toolkit/toolkit-explorer";
import { fn } from "storybook/test";
import { useState } from "react";

const meta = {
    title: "Toolkit/ToolkitExplorer",
    component: ToolkitExplorer,
    parameters: {
        layout: "fullscreen",
    },
    tags: ["autodocs"],
    args: {
        onSelectTool: fn(),
        onSelectToolbelt: fn(),
        onAction: fn(),
        onClose: fn(),
    },
} satisfies Meta<typeof ToolkitExplorer>;

export default meta;
type Story = StoryObj<typeof meta>;

const tools = [
    {
        id: "1",
        name: "Pencil",
        description: "Draw freehand strokes",
        iconType: "lucide" as const,
        iconName: "Pencil",
    },
    {
        id: "2",
        name: "Eraser",
        description: "Erase pixels",
        iconType: "lucide" as const,
        iconName: "Eraser",
    },
    {
        id: "3",
        name: "Fill",
        description: "Fill connected areas",
        iconType: "lucide" as const,
        iconName: "PaintBucket",
    },
];

const toolbelts = [
    { id: "1", name: "Pixel Art", description: "Tools for pixel art", hotkey: "1" },
    { id: "2", name: "Voxel Art", description: "Tools for voxel art", hotkey: "2" },
];

const actions = [
    { id: "1", name: "Create New Toolbelt", description: "Create a new toolbelt", action: "create-toolbelt" },
    { id: "2", name: "Delete Toolbelt", description: "Delete selected toolbelt", action: "delete-toolbelt" },
];

export const Default: Story = {
    args: {
        isOpen: true,
        tools,
        toolbelts,
        actions,
    },
};

export const Interactive: Story = {
    render: () => {
        const [isOpen, setIsOpen] = useState(false);
        return (
            <div className="relative w-full h-screen bg-background p-8">
                <button
                    onClick={() => setIsOpen(true)}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg"
                >
                    Open Toolkit Explorer (or press Space)
                </button>
                <ToolkitExplorer
                    isOpen={isOpen}
                    onClose={() => setIsOpen(false)}
                    onSelectTool={(id) => {
                        console.log("Selected tool:", id);
                        setIsOpen(false);
                    }}
                    onSelectToolbelt={(id) => {
                        console.log("Selected toolbelt:", id);
                        setIsOpen(false);
                    }}
                    onAction={(action) => {
                        console.log("Action:", action);
                        setIsOpen(false);
                    }}
                    tools={tools}
                    toolbelts={toolbelts}
                    actions={actions}
                />
                <div className="mt-4 p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">
                        Press Space to open/close, Arrow keys to navigate, Enter to select
                    </p>
                </div>
            </div>
        );
    },
};

