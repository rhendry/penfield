import type { Meta, StoryObj } from "@storybook/react";
import { ColorPalette } from "../../client/src/components/utilities/color-palette";
import { useState } from "react";

const meta = {
    title: "Utilities/ColorPalette",
    component: ColorPalette,
    parameters: {
        layout: "centered",
    },
    tags: ["autodocs"],
} satisfies Meta<typeof ColorPalette>;

export default meta;
type Story = StoryObj<typeof meta>;

const defaultColors = ["#ff0000", "#00ff00", "#0000ff", "#ffff00", "#ff00ff", "#00ffff"];

const palettes = [
    { id: "default-1", name: "Default Palette", isDefault: true },
    { id: "custom-1", name: "My Custom Palette", isDefault: false },
    { id: "custom-2", name: "Warm Colors", isDefault: false },
    { id: "custom-3", name: "Cool Colors", isDefault: false },
];

export const Default: Story = {
    render: () => {
        const [selectedPaletteId, setSelectedPaletteId] = useState("default-1");
        const [selectedColor, setSelectedColor] = useState("#ff0000");
        return (
            <div className="p-8 bg-background w-80">
                <ColorPalette
                    paletteId={selectedPaletteId}
                    palettes={palettes}
                    colors={defaultColors}
                    selectedColor={selectedColor}
                    onSelectPalette={setSelectedPaletteId}
                    onSelectColor={(color, paletteId) => {
                        setSelectedColor(color);
                        console.log("Selected color:", color, "from palette:", paletteId);
                    }}
                />
                <p className="mt-4 text-sm text-muted-foreground">
                    Selected: {selectedColor}
                </p>
            </div>
        );
    },
};

export const WithAddRemove: Story = {
    render: () => {
        const [selectedPaletteId, setSelectedPaletteId] = useState("default-1");
        const [colors, setColors] = useState(defaultColors);
        const [selectedColor, setSelectedColor] = useState("#ff0000");
        return (
            <div className="p-8 bg-background w-80">
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
                <p className="mt-4 text-sm text-muted-foreground">
                    Selected: {selectedColor}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                    Colors: {colors.length}
                </p>
            </div>
        );
    },
};

export const Empty: Story = {
    render: () => {
        const [selectedPaletteId, setSelectedPaletteId] = useState("default-1");
        const [selectedColor, setSelectedColor] = useState("#ff0000");
        return (
            <div className="p-8 bg-background w-80">
                <ColorPalette
                    paletteId={selectedPaletteId}
                    palettes={palettes}
                    colors={[]}
                    selectedColor={selectedColor}
                    onSelectPalette={setSelectedPaletteId}
                    onSelectColor={(color, paletteId) => {
                        setSelectedColor(color);
                        console.log("Selected color:", color, "from palette:", paletteId);
                    }}
                    onAddColor={(color, paletteId) => {
                        console.log("Add:", color, "to palette:", paletteId);
                    }}
                />
            </div>
        );
    },
};

