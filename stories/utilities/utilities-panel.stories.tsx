import type { Meta, StoryObj } from "@storybook/react";
import { UtilitiesPanel } from "../../client/src/components/utilities/utilities-panel";
import { ColorPicker } from "../../client/src/components/utilities/color-picker";
import { ColorPalette } from "../../client/src/components/utilities/color-palette";
import { useState } from "react";
import { Pencil } from "lucide-react";

const meta = {
    title: "Utilities/UtilitiesPanel",
    component: UtilitiesPanel,
    parameters: {
        layout: "fullscreen",
    },
    tags: ["autodocs"],
} satisfies Meta<typeof UtilitiesPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Collapsed: Story = {
    render: () => {
        const [isExpanded, setIsExpanded] = useState(false);
        return (
            <div className="relative w-full h-screen bg-background">
                <UtilitiesPanel
                    isExpanded={isExpanded}
                    onToggle={() => setIsExpanded(!isExpanded)}
                />
            </div>
        );
    },
};

export const ExpandedEmpty: Story = {
    render: () => {
        const [isExpanded, setIsExpanded] = useState(true);
        return (
            <div className="relative w-full h-screen bg-background">
                <UtilitiesPanel
                    isExpanded={isExpanded}
                    onToggle={() => setIsExpanded(!isExpanded)}
                />
            </div>
        );
    },
};

export const WithColorPicker: Story = {
    render: () => {
        const [isExpanded, setIsExpanded] = useState(true);
        const [color, setColor] = useState("#ff0000ff");
        const tool = {
            id: "pencil",
            name: "Pencil",
            icon: Pencil,
            utilities: <ColorPicker value={color} onChange={setColor} />,
        };
        return (
            <div className="relative w-full h-screen bg-background">
                <UtilitiesPanel
                    isExpanded={isExpanded}
                    onToggle={() => setIsExpanded(!isExpanded)}
                    selectedTool={tool}
                />
            </div>
        );
    },
};

export const WithColorPalette: Story = {
    render: () => {
        const [isExpanded, setIsExpanded] = useState(true);
        const [selectedPaletteId, setSelectedPaletteId] = useState("default-1");
        const [colors, setColors] = useState(["#ff0000", "#00ff00", "#0000ff", "#ffff00", "#ff00ff"]);
        const [selectedColor, setSelectedColor] = useState("#ff0000");
        const palettes = [
            { id: "default-1", name: "Default Palette", isDefault: true },
            { id: "custom-1", name: "My Custom Palette", isDefault: false },
        ];
        
        const tool = {
            id: "pencil",
            name: "Pencil",
            icon: Pencil,
            utilities: (
                <>
                    <ColorPicker value={selectedColor + "ff"} onChange={(c) => setSelectedColor(c.replace(/ff$/, ""))} />
                    <ColorPalette
                        paletteId={selectedPaletteId}
                        palettes={palettes}
                        colors={colors}
                        selectedColor={selectedColor}
                        onSelectPalette={setSelectedPaletteId}
                        onSelectColor={(color, paletteId) => {
                            setSelectedColor(color);
                            console.log("Selected color:", color, "from palette:", paletteId);
                        }}
                        onAddColor={(color, paletteId) => {
                            setColors([...colors, color]);
                            console.log("Added color:", color, "to palette:", paletteId);
                        }}
                        onRemoveColor={(color, paletteId) => {
                            setColors(colors.filter((c) => c !== color));
                            console.log("Removed color:", color, "from palette:", paletteId);
                        }}
                    />
                </>
            ),
        };
        
        return (
            <div className="relative w-full h-screen bg-background">
                <UtilitiesPanel
                    isExpanded={isExpanded}
                    onToggle={() => setIsExpanded(!isExpanded)}
                    selectedTool={tool}
                />
            </div>
        );
    },
};

export const Interactive: Story = {
    render: () => {
        const [isExpanded, setIsExpanded] = useState(false);
        const [selectedToolId, setSelectedToolId] = useState<string | undefined>("pencil");
        const [color, setColor] = useState("#ff0000ff");
        const [selectedPaletteId, setSelectedPaletteId] = useState("default-1");
        const [paletteColors, setPaletteColors] = useState(["#ff0000", "#00ff00", "#0000ff"]);
        const palettes = [
            { id: "default-1", name: "Default Palette", isDefault: true },
            { id: "custom-1", name: "My Custom Palette", isDefault: false },
        ];
        
        const tools = {
            pencil: {
                id: "pencil",
                name: "Pencil",
                icon: Pencil,
                utilities: (
                    <>
                        <ColorPicker value={color} onChange={setColor} />
                        <ColorPalette
                            paletteId={selectedPaletteId}
                            palettes={palettes}
                            colors={paletteColors}
                            selectedColor={color.replace(/ff$/, "")}
                            onSelectPalette={setSelectedPaletteId}
                            onSelectColor={(c, pid) => {
                                setColor(c + "ff");
                                console.log("Selected color:", c, "from palette:", pid);
                            }}
                            onAddColor={(c, pid) => {
                                setPaletteColors([...paletteColors, c]);
                                console.log("Added color:", c, "to palette:", pid);
                            }}
                            onRemoveColor={(c, pid) => {
                                setPaletteColors(paletteColors.filter((col) => col !== c));
                                console.log("Removed color:", c, "from palette:", pid);
                            }}
                        />
                    </>
                ),
            },
        };
        
        const selectedTool = selectedToolId ? tools[selectedToolId as keyof typeof tools] : undefined;
        
        return (
            <div className="relative w-full h-screen bg-background p-8">
                <div className="space-y-4">
                    <h2 className="text-xl font-bold">Utilities Panel Demo</h2>
                    <p className="text-sm text-muted-foreground">
                        Press Ctrl+Space to toggle the panel, or click the toggle button
                    </p>
                    <p className="text-xs text-muted-foreground">
                        Drag the left edge of the panel to resize
                    </p>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setSelectedToolId("pencil")}
                            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground"
                        >
                            Select Pencil Tool
                        </button>
                        <button
                            onClick={() => setSelectedToolId(undefined)}
                            className="px-4 py-2 rounded-lg bg-muted text-muted-foreground"
                        >
                            Deselect Tool
                        </button>
                    </div>
                </div>
                <UtilitiesPanel
                    isExpanded={isExpanded}
                    onToggle={() => setIsExpanded(!isExpanded)}
                    selectedTool={selectedTool}
                />
            </div>
        );
    },
};

