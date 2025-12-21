import type { Meta, StoryObj } from "@storybook/react";
import { TransformControls } from "../../client/src/components/editor/transform-controls";
import { useState } from "react";
import { fn } from "storybook/test";
import type { Transform } from "@shared/types/pixel-asset";
import { createDefaultTransform } from "@shared/utils/pixel-asset";

const meta = {
  title: "Editor/TransformControls",
  component: TransformControls,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  args: {
    onTransformChange: fn(),
  },
} satisfies Meta<typeof TransformControls>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => {
    const [transform] = useState<Transform>(createDefaultTransform());
    return (
      <div className="w-64">
        <TransformControls transform={transform} />
      </div>
    );
  },
};

export const PositionInputs: Story = {
  render: () => {
    const [transform, setTransform] = useState<Transform>({
      ...createDefaultTransform(),
      x: 10,
      y: 20,
    });
    return (
      <div className="w-64">
        <TransformControls
          transform={transform}
          onTransformChange={setTransform}
        />
      </div>
    );
  },
};

export const RotationInput: Story = {
  render: () => {
    const [transform, setTransform] = useState<Transform>({
      ...createDefaultTransform(),
      rotation: Math.PI / 4, // 45 degrees
    });
    return (
      <div className="w-64">
        <TransformControls
          transform={transform}
          onTransformChange={setTransform}
        />
      </div>
    );
  },
};

export const ScaleInputs: Story = {
  render: () => {
    const [transform, setTransform] = useState<Transform>({
      ...createDefaultTransform(),
      scaleX: 1.5,
      scaleY: 2.0,
    });
    return (
      <div className="w-64">
        <TransformControls
          transform={transform}
          onTransformChange={setTransform}
        />
      </div>
    );
  },
};

export const UniformScaleToggle: Story = {
  render: () => {
    const [transform, setTransform] = useState<Transform>({
      ...createDefaultTransform(),
      scaleX: 1.5,
      scaleY: 1.5,
    });
    return (
      <div className="w-64">
        <TransformControls
          transform={transform}
          onTransformChange={setTransform}
        />
      </div>
    );
  },
};

export const LivePreviewUpdates: Story = {
  render: () => {
    const [transform, setTransform] = useState<Transform>({
      ...createDefaultTransform(),
      x: 0,
      y: 0,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
    });
    return (
      <div className="w-64 space-y-4">
        <TransformControls
          transform={transform}
          onTransformChange={setTransform}
        />
        <div className="text-xs text-muted-foreground space-y-1 p-2 bg-muted rounded">
          <p>X: {transform.x.toFixed(2)}</p>
          <p>Y: {transform.y.toFixed(2)}</p>
          <p>Rotation: {Math.round((transform.rotation * 180) / Math.PI)}°</p>
          <p>Scale X: {transform.scaleX.toFixed(2)}</p>
          <p>Scale Y: {transform.scaleY.toFixed(2)}</p>
        </div>
      </div>
    );
  },
};

export const Interactive: Story = {
  render: () => {
    const [transform, setTransform] = useState<Transform>({
      ...createDefaultTransform(),
      x: 10,
      y: 20,
      rotation: Math.PI / 6, // 30 degrees
      scaleX: 1.2,
      scaleY: 1.2,
    });
    return (
      <div className="w-64 space-y-4">
        <TransformControls
          transform={transform}
          onTransformChange={setTransform}
        />
        <div className="text-xs text-muted-foreground space-y-1">
          <p>• Edit values to see live updates</p>
          <p>• Toggle uniform scale to link/unlink X and Y</p>
        </div>
      </div>
    );
  },
};

