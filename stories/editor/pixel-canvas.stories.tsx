import type { Meta, StoryObj } from "@storybook/react";
import { useState, useCallback } from "react";
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

// Helper function to create pixel data
function createPixelData(positions: Array<[number, number, string]>): Record<string, string> {
    const data: Record<string, string> = {};
    positions.forEach(([x, y, color]) => {
        data[`${x},${y}`] = color;
    });
    return data;
}

// Smiley face pixel art
const smileyFacePixels = createPixelData([
    // Face outline
    [-2, -2, "#ffd700"], [-1, -2, "#ffd700"], [0, -2, "#ffd700"], [1, -2, "#ffd700"], [2, -2, "#ffd700"],
    [-2, -1, "#ffd700"], [2, -1, "#ffd700"],
    [-2, 0, "#ffd700"], [2, 0, "#ffd700"],
    [-2, 1, "#ffd700"], [-1, 1, "#ffd700"], [0, 1, "#ffd700"], [1, 1, "#ffd700"], [2, 1, "#ffd700"],
    [-2, 2, "#ffd700"], [-1, 2, "#ffd700"], [0, 2, "#ffd700"], [1, 2, "#ffd700"], [2, 2, "#ffd700"],
    // Eyes
    [-1, -1, "#000000"], [1, -1, "#000000"],
    // Mouth
    [-1, 0, "#000000"], [0, 0, "#000000"], [1, 0, "#000000"],
]);

export const WithSmileyFace: Story = {
    render: () => (
        <div style={{ width: "100%", height: "100vh", position: "absolute", inset: 0 }}>
            <PixelCanvas pixels={smileyFacePixels} />
        </div>
    ),
};

// Simple house pixel art
const housePixels = createPixelData([
    // Roof
    [-3, -3, "#8b4513"], [-2, -3, "#8b4513"], [-1, -3, "#8b4513"], [0, -3, "#8b4513"], [1, -3, "#8b4513"], [2, -3, "#8b4513"], [3, -3, "#8b4513"],
    [-2, -2, "#8b4513"], [-1, -2, "#8b4513"], [0, -2, "#8b4513"], [1, -2, "#8b4513"], [2, -2, "#8b4513"],
    [-1, -1, "#8b4513"], [0, -1, "#8b4513"], [1, -1, "#8b4513"],
    // Walls
    [-2, 0, "#ff6347"], [-1, 0, "#ff6347"], [0, 0, "#ff6347"], [1, 0, "#ff6347"], [2, 0, "#ff6347"],
    [-2, 1, "#ff6347"], [-1, 1, "#ff6347"], [0, 1, "#ff6347"], [1, 1, "#ff6347"], [2, 1, "#ff6347"],
    [-2, 2, "#ff6347"], [-1, 2, "#ff6347"], [0, 2, "#ff6347"], [1, 2, "#ff6347"], [2, 2, "#ff6347"],
    // Door
    [0, 1, "#654321"], [0, 2, "#654321"],
    // Window
    [-1, 0, "#87ceeb"], [1, 0, "#87ceeb"],
]);

export const WithHouse: Story = {
    render: () => (
        <div style={{ width: "100%", height: "100vh", position: "absolute", inset: 0 }}>
            <PixelCanvas pixels={housePixels} />
        </div>
    ),
};

// Simple character sprite
const characterPixels = createPixelData([
    // Head
    [-1, -3, "#ffdbac"], [0, -3, "#ffdbac"], [1, -3, "#ffdbac"],
    [-1, -2, "#ffdbac"], [0, -2, "#ffdbac"], [1, -2, "#ffdbac"],
    [-1, -1, "#ffdbac"], [0, -1, "#ffdbac"], [1, -1, "#ffdbac"],
    // Eyes
    [-1, -2, "#000000"], [1, -2, "#000000"],
    // Body
    [-1, 0, "#4169e1"], [0, 0, "#4169e1"], [1, 0, "#4169e1"],
    [-1, 1, "#4169e1"], [0, 1, "#4169e1"], [1, 1, "#4169e1"],
    [-1, 2, "#4169e1"], [0, 2, "#4169e1"], [1, 2, "#4169e1"],
    // Arms
    [-2, 0, "#ffdbac"], [-2, 1, "#ffdbac"], [2, 0, "#ffdbac"], [2, 1, "#ffdbac"],
    // Legs
    [-1, 3, "#000080"], [0, 3, "#000080"], [1, 3, "#000080"],
    [-1, 4, "#000080"], [1, 4, "#000080"],
]);

export const WithCharacter: Story = {
    render: () => (
        <div style={{ width: "100%", height: "100vh", position: "absolute", inset: 0 }}>
            <PixelCanvas pixels={characterPixels} />
        </div>
    ),
};

// Pattern/abstract art
const patternPixels = createPixelData([
    // Diagonal pattern
    [-5, -5, "#ff0000"], [-4, -4, "#ff0000"], [-3, -3, "#ff0000"], [-2, -2, "#ff0000"], [-1, -1, "#ff0000"], [0, 0, "#ff0000"], [1, 1, "#ff0000"], [2, 2, "#ff0000"], [3, 3, "#ff0000"], [4, 4, "#ff0000"], [5, 5, "#ff0000"],
    [-5, 5, "#00ff00"], [-4, 4, "#00ff00"], [-3, 3, "#00ff00"], [-2, 2, "#00ff00"], [-1, 1, "#00ff00"], [0, 0, "#00ff00"], [1, -1, "#00ff00"], [2, -2, "#00ff00"], [3, -3, "#00ff00"], [4, -4, "#00ff00"], [5, -5, "#00ff00"],
    // Cross pattern
    [-3, 0, "#0000ff"], [-2, 0, "#0000ff"], [-1, 0, "#0000ff"], [0, 0, "#0000ff"], [1, 0, "#0000ff"], [2, 0, "#0000ff"], [3, 0, "#0000ff"],
    [0, -3, "#0000ff"], [0, -2, "#0000ff"], [0, -1, "#0000ff"], [0, 1, "#0000ff"], [0, 2, "#0000ff"], [0, 3, "#0000ff"],
]);

export const WithPattern: Story = {
    render: () => (
        <div style={{ width: "100%", height: "100vh", position: "absolute", inset: 0 }}>
            <PixelCanvas pixels={patternPixels} />
        </div>
    ),
};

// Interactive drawing story
export const Interactive: Story = {
    render: () => {
        const [pixels, setPixels] = useState<Record<string, string>>({});
        
        const handlePixelClick = useCallback((x: number, y: number, button: "left" | "right") => {
            setPixels((prev) => {
                const newPixels = { ...prev };
                newPixels[`${x},${y}`] = "#000000";
                return newPixels;
            });
        }, []);
        
        const handlePixelDrag = useCallback((x: number, y: number, button: "left" | "right") => {
            setPixels((prev) => {
                const newPixels = { ...prev };
                newPixels[`${x},${y}`] = "#000000";
                return newPixels;
            });
        }, []);
        
        return (
            <div style={{ width: "100%", height: "100vh", position: "absolute", inset: 0 }}>
                <PixelCanvas
                    pixels={pixels}
                    onPixelClick={handlePixelClick}
                    onPixelDrag={handlePixelDrag}
                />
            </div>
        );
    },
};

