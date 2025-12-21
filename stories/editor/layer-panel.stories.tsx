import type { Meta, StoryObj } from "@storybook/react";
import { LayerPanel } from "../../client/src/components/editor/layer-panel";
import { useState } from "react";
import { fn } from "storybook/test";
import type { Layer } from "@shared/types/pixel-asset";
import { createDefaultLayer } from "@shared/utils/pixel-asset";

const meta = {
  title: "Editor/LayerPanel",
  component: LayerPanel,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  args: {
    onLayerClick: fn(),
    onLayerVisibilityToggle: fn(),
    onLayerNameChange: fn(),
  },
} satisfies Meta<typeof LayerPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => {
    const [layers] = useState<Layer[]>([]);
    return (
      <div className="w-64">
        <LayerPanel layers={layers} activeLayerId={null} />
      </div>
    );
  },
};

export const WithMultipleLayers: Story = {
  render: () => {
    const [layers] = useState<Layer[]>([
      createDefaultLayer("Background", 0),
      createDefaultLayer("Character", 1),
      createDefaultLayer("Foreground", 2),
    ]);
    const [activeLayerId, setActiveLayerId] = useState<string | null>(layers[1].id);

    return (
      <div className="w-64">
        <LayerPanel
          layers={layers}
          activeLayerId={activeLayerId}
          onLayerClick={(id) => setActiveLayerId(id)}
        />
      </div>
    );
  },
};

export const ActiveLayerHighlighting: Story = {
  render: () => {
    const [layers] = useState<Layer[]>([
      createDefaultLayer("Layer 1", 0),
      createDefaultLayer("Layer 2", 1),
      createDefaultLayer("Layer 3", 2),
    ]);
    const [activeLayerId, setActiveLayerId] = useState<string | null>(layers[1].id);

    return (
      <div className="w-64">
        <LayerPanel
          layers={layers}
          activeLayerId={activeLayerId}
          onLayerClick={(id) => setActiveLayerId(id)}
        />
      </div>
    );
  },
};

export const VisibilityToggle: Story = {
  render: () => {
    const [layers, setLayers] = useState<Layer[]>([
      { ...createDefaultLayer("Visible Layer", 0), visible: true },
      { ...createDefaultLayer("Hidden Layer", 1), visible: false },
      { ...createDefaultLayer("Another Visible", 2), visible: true },
    ]);
    const [activeLayerId, setActiveLayerId] = useState<string | null>(layers[0].id);

    const handleVisibilityToggle = (layerId: string) => {
      setLayers(
        layers.map((layer) =>
          layer.id === layerId ? { ...layer, visible: !layer.visible } : layer
        )
      );
    };

    return (
      <div className="w-64">
        <LayerPanel
          layers={layers}
          activeLayerId={activeLayerId}
          onLayerClick={(id) => setActiveLayerId(id)}
          onLayerVisibilityToggle={handleVisibilityToggle}
        />
      </div>
    );
  },
};

export const Interactive: Story = {
  render: () => {
    const [layers, setLayers] = useState<Layer[]>([
      createDefaultLayer("Background", 0),
      createDefaultLayer("Character", 1),
      createDefaultLayer("Foreground", 2),
    ]);
    const [activeLayerId, setActiveLayerId] = useState<string | null>(layers[1].id);

    const handleVisibilityToggle = (layerId: string) => {
      setLayers(
        layers.map((layer) =>
          layer.id === layerId ? { ...layer, visible: !layer.visible } : layer
        )
      );
    };

    const handleNameChange = (layerId: string, name: string) => {
      setLayers(
        layers.map((layer) =>
          layer.id === layerId ? { ...layer, name } : layer
        )
      );
    };

    return (
      <div className="w-64 space-y-4">
        <LayerPanel
          layers={layers}
          activeLayerId={activeLayerId}
          onLayerClick={(id) => setActiveLayerId(id)}
          onLayerVisibilityToggle={handleVisibilityToggle}
          onLayerNameChange={handleNameChange}
        />
        <div className="text-xs text-muted-foreground space-y-1">
          <p>• Click layer to select</p>
          <p>• Click eye icon to toggle visibility</p>
          <p>• Double-click name to edit</p>
        </div>
      </div>
    );
  },
};

