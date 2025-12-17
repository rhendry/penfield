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

export const Default: Story = {
    render: () => {
        const [selectedColor, setSelectedColor] = useState("#ff0000");
        return (
            <div className="p-8 bg-background w-80">
                <ColorPalette
                    colors={defaultColors}
                    selectedColor={selectedColor}
                    onSelectColor={setSelectedColor}
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
        const [colors, setColors] = useState(defaultColors);
        const [selectedColor, setSelectedColor] = useState("#ff0000");
        return (
            <div className="p-8 bg-background w-80">
                <ColorPalette
                    colors={colors}
                    selectedColor={selectedColor}
                    onSelectColor={setSelectedColor}
                    onAddColor={(color) => setColors([...colors, color])}
                    onRemoveColor={(color) => setColors(colors.filter((c) => c !== color))}
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
        const [selectedColor, setSelectedColor] = useState("#ff0000");
        return (
            <div className="p-8 bg-background w-80">
                <ColorPalette
                    colors={[]}
                    selectedColor={selectedColor}
                    onSelectColor={setSelectedColor}
                    onAddColor={(color) => console.log("Add:", color)}
                />
            </div>
        );
    },
};

