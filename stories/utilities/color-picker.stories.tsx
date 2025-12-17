import type { Meta, StoryObj } from "@storybook/react";
import { ColorPicker } from "../../client/src/components/utilities/color-picker";
import { useState } from "react";

const meta = {
    title: "Utilities/ColorPicker",
    component: ColorPicker,
    parameters: {
        layout: "centered",
    },
    tags: ["autodocs"],
} satisfies Meta<typeof ColorPicker>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    render: () => {
        const [color, setColor] = useState("#ff0000");
        return (
            <div className="p-8 bg-background">
                <ColorPicker value={color} onChange={setColor} />
                <p className="mt-4 text-sm text-muted-foreground">
                    Selected: {color}
                </p>
            </div>
        );
    },
};

export const WithLabel: Story = {
    render: () => {
        const [color, setColor] = useState("#00ff00");
        return (
            <div className="p-8 bg-background">
                <ColorPicker value={color} onChange={setColor} label="Foreground Color" />
                <p className="mt-4 text-sm text-muted-foreground">
                    Selected: {color}
                </p>
            </div>
        );
    },
};

