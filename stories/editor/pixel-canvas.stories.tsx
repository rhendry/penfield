import type { Meta, StoryObj } from "@storybook/react";
import { PixelCanvas } from "../../client/src/components/editor/pixel-canvas";

const meta = {
    title: "Editor/PixelCanvas",
    component: PixelCanvas,
    parameters: {
        layout: "fullscreen",
    },
    tags: ["autodocs"],
} satisfies Meta<typeof PixelCanvas>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    render: () => (
        <div style={{ width: "100%", height: "100vh", position: "absolute", inset: 0 }}>
            <PixelCanvas />
        </div>
    ),
};

export const CustomColors: Story = {
    render: () => (
        <div style={{ width: "100%", height: "100vh", position: "absolute", inset: 0 }}>
            <PixelCanvas
                backgroundColor="#1a1a1a"
                gridLineColor="#333333"
                xAxisColor="#00ff00"
                yAxisColor="#ff0000"
            />
        </div>
    ),
};

export const LargeCanvas: Story = {
    render: () => (
        <div style={{ width: "100%", height: "100vh", position: "absolute", inset: 0 }}>
            <PixelCanvas maxSize={2000} defaultZoomPixels={100} />
        </div>
    ),
};

