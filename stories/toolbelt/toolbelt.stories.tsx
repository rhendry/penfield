import type { Meta, StoryObj } from "@storybook/react";
import { Toolbelt } from "../../client/src/components/toolbelt/toolbelt";
import { ToolbeltHelp } from "../../client/src/components/toolbelt/toolbelt-help";
import { UtilitiesPanel } from "../../client/src/components/utilities/utilities-panel";
import { ColorPicker } from "../../client/src/components/utilities/color-picker";
import { ColorPalette } from "../../client/src/components/utilities/color-palette";
import { useUtilitiesPanel } from "../../client/src/hooks/use-utilities-panel";
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
    {
        id: "select",
        name: "Select",
        icon: MousePointer2,
        description: "Select and move objects on the canvas. Click and drag to create selection boxes.",
    },
    {
        id: "move",
        name: "Move",
        icon: Move,
        description: "Move selected objects around the canvas. Use arrow keys for precise positioning.",
    },
    {
        id: "pencil",
        name: "Pencil",
        icon: Pencil,
        description: "Draw freehand strokes on the canvas. Hold Shift for straight lines. Right-click to erase.",
    },
    {
        id: "eraser",
        name: "Eraser",
        icon: Eraser,
        description: "Erase pixels from the canvas. Adjust brush size with bracket keys [ and ].",
    },
    {
        id: "fill",
        name: "Fill",
        icon: PaintBucket,
        description: "Fill connected areas with the selected color. Right-click to fill with background color.",
    },
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
    const [helpVisible, setHelpVisible] = useState(true);
    const [utilitiesExpanded, setUtilitiesExpanded] = useState(false);
    const [utilitiesWidth, setUtilitiesWidth] = useState(320);
    const [pencilColor, setPencilColor] = useState("#ff0000ff");
    const [selectedPaletteId, setSelectedPaletteId] = useState("default-1");
    const [paletteColors, setPaletteColors] = useState([
        "#ff0000",
        "#00ff00",
        "#0000ff",
        "#ffff00",
        "#ff00ff",
        "#00ffff",
    ]);
    const palettes = [
        { id: "default-1", name: "Default Palette", isDefault: true },
        { id: "custom-1", name: "My Custom Palette", isDefault: false },
    ];

    // Use utilities panel hook for Ctrl+Space toggle
    useUtilitiesPanel({
        enabled: true,
        onToggle: () => setUtilitiesExpanded((prev) => !prev),
    });

    const handleSlotClick = (slotId: string) => {
        setSlotsState((prev) =>
            prev.map((slot) => ({
                ...slot,
                isActive: slot.id === slotId,
            }))
        );
    };

    // Find the selected tool
    const activeSlot = slotsState.find((slot) => slot.isActive && slot.tool);
    const selectedTool = activeSlot?.tool
        ? {
              ...activeSlot.tool,
              // Add utilities for pencil and fill tools
              utilities:
                  activeSlot.tool.id === "pencil"
                      ? (
                            <>
                                <ColorPicker value={pencilColor} onChange={setPencilColor} label="Pen Color" />
                                <ColorPalette
                                    paletteId={selectedPaletteId}
                                    palettes={palettes}
                                    colors={paletteColors}
                                    selectedColor={pencilColor.replace(/ff$/, "")}
                                    onSelectPalette={setSelectedPaletteId}
                                    onSelectColor={(color, paletteId) => {
                                        setPencilColor(color + "ff");
                                        console.log("Selected color:", color, "from palette:", paletteId);
                                    }}
                                    onAddColor={(color, paletteId) => {
                                        setPaletteColors([...paletteColors, color]);
                                        console.log("Added color:", color, "to palette:", paletteId);
                                    }}
                                    onRemoveColor={(color, paletteId) => {
                                        setPaletteColors(paletteColors.filter((c) => c !== color));
                                        console.log("Removed color:", color, "from palette:", paletteId);
                                    }}
                                />
                            </>
                        )
                      : activeSlot.tool.id === "fill"
                        ? <ColorPicker value="#00ff00ff" onChange={() => {}} label="Fill Color" />
                        : undefined,
          }
        : undefined;

    return (
        <div className="relative w-full h-screen">
            <ToolbeltHelp
                slots={slotsState}
                isVisible={helpVisible}
                onVisibilityChange={setHelpVisible}
            />
            <Toolbelt
                slots={slotsState}
                onSlotClick={handleSlotClick}
                keyboardEnabled={true}
                config={config}
            />
            <UtilitiesPanel
                isExpanded={utilitiesExpanded}
                onToggle={() => setUtilitiesExpanded((prev) => !prev)}
                selectedTool={selectedTool}
                width={utilitiesWidth}
                onWidthChange={setUtilitiesWidth}
            />
        </div>
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

// Story showing toolbelt with help docs
export const WithHelpDocs: Story = {
    render: () => {
        const [slotsState, setSlotsState] = useState(slots);
        const [helpVisible, setHelpVisible] = useState(true);

        const handleSlotClick = (slotId: string) => {
            setSlotsState((prev) =>
                prev.map((slot) => ({
                    ...slot,
                    isActive: slot.id === slotId,
                }))
            );
        };

        return (
            <div className="relative w-full h-screen">
                <ToolbeltHelp
                    slots={slotsState}
                    isVisible={helpVisible}
                    onVisibilityChange={setHelpVisible}
                />
                <Toolbelt
                    slots={slotsState}
                    onSlotClick={handleSlotClick}
                    keyboardEnabled={true}
                />
            </div>
        );
    },
};
