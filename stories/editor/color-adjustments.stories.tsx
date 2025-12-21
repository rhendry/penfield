import type { Meta, StoryObj } from "@storybook/react";
import { ColorAdjustmentsControls } from "../../client/src/components/editor/color-adjustments";
import { useState } from "react";
import { fn } from "storybook/test";
import type { ColorAdjustments } from "@shared/types/pixel-asset";
import { createDefaultColorAdjustments } from "@shared/utils/pixel-asset";

const meta = {
  title: "Editor/ColorAdjustments",
  component: ColorAdjustmentsControls,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  args: {
    onColorAdjustmentsChange: fn(),
  },
} satisfies Meta<typeof ColorAdjustmentsControls>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => {
    const [adjustments] = useState<ColorAdjustments>(createDefaultColorAdjustments());
    return (
      <div className="w-80">
        <ColorAdjustmentsControls colorAdjustments={adjustments} />
      </div>
    );
  },
};

export const BrightnessSlider: Story = {
  render: () => {
    const [adjustments, setAdjustments] = useState<ColorAdjustments>({
      ...createDefaultColorAdjustments(),
      brightness: 0.5,
    });
    return (
      <div className="w-80">
        <ColorAdjustmentsControls
          colorAdjustments={adjustments}
          onColorAdjustmentsChange={setAdjustments}
        />
      </div>
    );
  },
};

export const ContrastSlider: Story = {
  render: () => {
    const [adjustments, setAdjustments] = useState<ColorAdjustments>({
      ...createDefaultColorAdjustments(),
      contrast: -0.3,
    });
    return (
      <div className="w-80">
        <ColorAdjustmentsControls
          colorAdjustments={adjustments}
          onColorAdjustmentsChange={setAdjustments}
        />
      </div>
    );
  },
};

export const SaturationSlider: Story = {
  render: () => {
    const [adjustments, setAdjustments] = useState<ColorAdjustments>({
      ...createDefaultColorAdjustments(),
      saturation: 0.7,
    });
    return (
      <div className="w-80">
        <ColorAdjustmentsControls
          colorAdjustments={adjustments}
          onColorAdjustmentsChange={setAdjustments}
        />
      </div>
    );
  },
};

export const ResetToDefaults: Story = {
  render: () => {
    const [adjustments, setAdjustments] = useState<ColorAdjustments>({
      brightness: 0.5,
      contrast: -0.3,
      saturation: 0.7,
    });
    return (
      <div className="w-80">
        <ColorAdjustmentsControls
          colorAdjustments={adjustments}
          onColorAdjustmentsChange={setAdjustments}
        />
      </div>
    );
  },
};

export const Interactive: Story = {
  render: () => {
    const [adjustments, setAdjustments] = useState<ColorAdjustments>(
      createDefaultColorAdjustments()
    );
    return (
      <div className="w-80 space-y-4">
        <ColorAdjustmentsControls
          colorAdjustments={adjustments}
          onColorAdjustmentsChange={setAdjustments}
        />
        <div className="text-xs text-muted-foreground space-y-1 p-2 bg-muted rounded">
          <p>Brightness: {adjustments.brightness.toFixed(2)}</p>
          <p>Contrast: {adjustments.contrast.toFixed(2)}</p>
          <p>Saturation: {adjustments.saturation.toFixed(2)}</p>
        </div>
      </div>
    );
  },
};

