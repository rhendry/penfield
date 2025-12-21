import type { Meta, StoryObj } from "@storybook/react";
import { ObjectPropertiesPanel } from "../../client/src/components/editor/object-properties-panel";
import { useState } from "react";
import { fn } from "storybook/test";
import type { PixelObject } from "@shared/types/pixel-asset";
import { createDefaultObject } from "@shared/utils/pixel-asset";

const meta = {
  title: "Editor/ObjectPropertiesPanel",
  component: ObjectPropertiesPanel,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  args: {
    onObjectChange: fn(),
  },
} satisfies Meta<typeof ObjectPropertiesPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => {
    return (
      <div className="w-80">
        <ObjectPropertiesPanel object={null} />
      </div>
    );
  },
};

export const NoSelection: Story = {
  render: () => {
    return (
      <div className="w-80">
        <ObjectPropertiesPanel object={null} />
      </div>
    );
  },
};

export const SelectedObject: Story = {
  render: () => {
    const [object, setObject] = useState<PixelObject>(createDefaultObject("My Object"));
    return (
      <div className="w-80 max-h-[600px]">
        <ObjectPropertiesPanel object={object} onObjectChange={setObject} />
      </div>
    );
  },
};

export const NestedObjectSelection: Story = {
  render: () => {
    const parent = createDefaultObject("Parent");
    const child = createDefaultObject("Child");
    parent.children = [child];
    
    const [selectedObject, setSelectedObject] = useState<PixelObject>(child);
    return (
      <div className="w-80 max-h-[600px]">
        <ObjectPropertiesPanel
          object={selectedObject}
          onObjectChange={setSelectedObject}
        />
      </div>
    );
  },
};

export const WithModifiedProperties: Story = {
  render: () => {
    const [object, setObject] = useState<PixelObject>({
      ...createDefaultObject("Modified Object"),
      transform: {
        x: 10,
        y: 20,
        rotation: Math.PI / 4,
        scaleX: 1.5,
        scaleY: 1.5,
      },
      colorTint: {
        r: 0.8,
        g: 0.6,
        b: 1.0,
        a: 0.9,
      },
      colorAdjustments: {
        brightness: 0.2,
        contrast: -0.1,
        saturation: 0.3,
      },
    });
    return (
      <div className="w-80 max-h-[600px]">
        <ObjectPropertiesPanel object={object} onObjectChange={setObject} />
      </div>
    );
  },
};

export const Interactive: Story = {
  render: () => {
    const [object, setObject] = useState<PixelObject>(createDefaultObject("Interactive Object"));
    return (
      <div className="w-80 max-h-[600px] space-y-4">
        <ObjectPropertiesPanel object={object} onObjectChange={setObject} />
        <div className="text-xs text-muted-foreground space-y-1 p-2 bg-muted rounded">
          <p>Object: {object.name}</p>
          <p>Position: ({object.transform.x.toFixed(1)}, {object.transform.y.toFixed(1)})</p>
          <p>Rotation: {Math.round((object.transform.rotation * 180) / Math.PI)}°</p>
          <p>Scale: ({object.transform.scaleX.toFixed(2)}, {object.transform.scaleY.toFixed(2)})</p>
        </div>
      </div>
    );
  },
};

