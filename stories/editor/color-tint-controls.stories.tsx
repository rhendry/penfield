import type { Meta, StoryObj } from "@storybook/react";
import { ColorTintControls } from "../../client/src/components/editor/color-tint-controls";
import { useState } from "react";
import { fn } from "storybook/test";
import type { ColorTint } from "@shared/types/pixel-asset";
import { createDefaultColorTint } from "@shared/utils/pixel-asset";

const meta = {
  title: "Editor/ColorTintControls",
  component: ColorTintControls,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  args: {
    onColorTintChange: fn(),
  },
} satisfies Meta<typeof ColorTintControls>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => {
    const [colorTint] = useState<ColorTint>(createDefaultColorTint());
    return (
      <div className="w-80">
        <ColorTintControls colorTint={colorTint} />
      </div>
    );
  },
};

export const RGBAInputs: Story = {
  render: () => {
    const [colorTint, setColorTint] = useState<ColorTint>({
      r: 0.8,
      g: 0.6,
      b: 1.0,
      a: 0.9,
    });
    return (
      <div className="w-80">
        <ColorTintControls colorTint={colorTint} onColorTintChange={setColorTint} />
      </div>
    );
  },
};

export const ColorPickerIntegration: Story = {
  render: () => {
    const [colorTint, setColorTint] = useState<ColorTint>({
      r: 1.0,
      g: 0.5,
      b: 0.0,
      a: 1.0,
    });
    return (
      <div className="w-80">
        <ColorTintControls colorTint={colorTint} onColorTintChange={setColorTint} />
      </div>
    );
  },
};

export const PreviewWithSamplePixels: Story = {
  render: () => {
    const [colorTint, setColorTint] = useState<ColorTint>({
      r: 0.5,
      g: 1.0,
      b: 0.5,
      a: 0.8,
    });
    return (
      <div className="w-80">
        <ColorTintControls colorTint={colorTint} onColorTintChange={setColorTint} />
      </div>
    );
  },
};

export const Interactive: Story = {
  render: () => {
    const [colorTint, setColorTint] = useState<ColorTint>(createDefaultColorTint());
    return (
      <div className="w-80 space-y-4">
        <ColorTintControls colorTint={colorTint} onColorTintChange={setColorTint} />
        <div className="text-xs text-muted-foreground space-y-1 p-2 bg-muted rounded">
          <p>R: {colorTint.r.toFixed(2)}</p>
          <p>G: {colorTint.g.toFixed(2)}</p>
          <p>B: {colorTint.b.toFixed(2)}</p>
          <p>A: {colorTint.a.toFixed(2)}</p>
        </div>
      </div>
    );
  },
};

