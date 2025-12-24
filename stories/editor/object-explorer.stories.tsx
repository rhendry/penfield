import type { Meta, StoryObj } from "@storybook/react";
import { ObjectExplorer } from "../../client/src/components/editor/object-explorer";
import { ObjectPropertiesPanel } from "../../client/src/components/editor/object-properties-panel";
import { useState } from "react";
import { fn } from "storybook/test";
import type { PixelAssetContent, PixelObject, ColorAdjustments } from "@shared/types/pixel-asset";
import { createDefaultObject, getObjectById } from "@shared/utils/pixel-asset";
import { RenderContextProvider } from "../../client/src/components/editor/render-context";

const meta = {
  title: "Editor/ObjectExplorer",
  component: ObjectExplorer,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  args: {
    onObjectSelect: fn(),
  },
} satisfies Meta<typeof ObjectExplorer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => {
    const [content] = useState<PixelAssetContent>({
      version: 1,
      objects: [],
      animations: [],
      activeObjectId: null,
    });
    const [selectedObjectId, setSelectedObjectId] = useState<string | null>(null);

    return (
      <RenderContextProvider initialContent={content}>
        <div className="w-96 h-[500px]">
          <ObjectExplorer
            content={content}
            selectedObjectId={selectedObjectId}
            onContentChange={() => {}}
            onObjectSelect={setSelectedObjectId}
          />
        </div>
      </RenderContextProvider>
    );
  },
};

export const FlatObjectList: Story = {
  render: () => {
    const [content, setContent] = useState<PixelAssetContent>({
      version: 1,
      objects: [
        createDefaultObject("Character", 2),
        createDefaultObject("Background", 0),
        createDefaultObject("Foreground", 1),
      ],
      animations: [],
      activeObjectId: null,
    });
    const [selectedObjectId, setSelectedObjectId] = useState<string | null>(content.objects[0].id);

    return (
      <RenderContextProvider initialContent={content}>
        <div className="w-96 h-[500px]">
          <ObjectExplorer
            content={content}
            selectedObjectId={selectedObjectId}
            onContentChange={setContent}
            onObjectSelect={setSelectedObjectId}
          />
        </div>
      </RenderContextProvider>
    );
  },
};

export const NestedObjects: Story = {
  render: () => {
    const [content, setContent] = useState<PixelAssetContent>({
      version: 1,
      objects: [
        {
          ...createDefaultObject("Character", 1),
          children: [
            createDefaultObject("Head", 0),
            {
              ...createDefaultObject("Body", 1),
              children: [createDefaultObject("Torso", 0), createDefaultObject("Arms", 1)],
            },
            createDefaultObject("Legs", 2),
          ],
        },
        createDefaultObject("Background", 0),
      ],
      animations: [],
      activeObjectId: null,
    });
    const [selectedObjectId, setSelectedObjectId] = useState<string | null>(
      content.objects[0].children[1].id
    );

    return (
      <RenderContextProvider initialContent={content}>
        <div className="w-96 h-[500px]">
          <ObjectExplorer
            content={content}
            selectedObjectId={selectedObjectId}
            onContentChange={setContent}
            onObjectSelect={setSelectedObjectId}
          />
        </div>
      </RenderContextProvider>
    );
  },
};

export const WithPropertiesPanel: Story = {
  render: () => {
    const [content, setContent] = useState<PixelAssetContent>({
      version: 1,
      objects: [
        createDefaultObject("Object 1", 0),
        createDefaultObject("Object 2", 1),
        createDefaultObject("Object 3", 2),
      ],
      animations: [],
      activeObjectId: null,
    });
    const [selectedObjectId, setSelectedObjectId] = useState<string | null>(content.objects[1].id);

    const selectedObject = selectedObjectId ? getObjectById(content, selectedObjectId) : null;

    const handleColorAdjustmentsChange = (adjustments: ColorAdjustments) => {
      if (!selectedObject) return;

      const updateObject = (obj: PixelObject): PixelObject => {
        if (obj.id === selectedObject.id) {
          return { ...obj, colorAdjustments: adjustments };
        }
        return {
          ...obj,
          children: obj.children.map(updateObject),
        };
      };

      setContent({
        ...content,
        objects: content.objects.map(updateObject),
      });
    };

    return (
      <RenderContextProvider initialContent={content}>
        <div className="w-96 space-y-4">
          <div className="h-[400px]">
            <ObjectExplorer
              content={content}
              selectedObjectId={selectedObjectId}
              onContentChange={setContent}
              onObjectSelect={setSelectedObjectId}
            />
          </div>
          <ObjectPropertiesPanel
            selectedObject={selectedObject}
            onColorAdjustmentsChange={handleColorAdjustmentsChange}
          />
        </div>
      </RenderContextProvider>
    );
  },
};

export const VisibilityToggle: Story = {
  render: () => {
    const [content, setContent] = useState<PixelAssetContent>({
      version: 1,
      objects: [
        { ...createDefaultObject("Visible Object", 0), visible: true },
        { ...createDefaultObject("Hidden Object", 1), visible: false },
        { ...createDefaultObject("Another Visible", 2), visible: true },
      ],
      animations: [],
      activeObjectId: null,
    });
    const [selectedObjectId, setSelectedObjectId] = useState<string | null>(content.objects[0].id);

    return (
      <RenderContextProvider initialContent={content}>
        <div className="w-96 h-[500px]">
          <ObjectExplorer
            content={content}
            selectedObjectId={selectedObjectId}
            onContentChange={setContent}
            onObjectSelect={setSelectedObjectId}
          />
        </div>
      </RenderContextProvider>
    );
  },
};

export const Interactive: Story = {
  render: () => {
    const [content, setContent] = useState<PixelAssetContent>({
      version: 1,
      objects: [
        {
          ...createDefaultObject("Character", 1),
          children: [
            createDefaultObject("Head", 0),
            {
              ...createDefaultObject("Body", 1),
              children: [createDefaultObject("Torso", 0), createDefaultObject("Arms", 1)],
            },
          ],
        },
        createDefaultObject("Background", 0),
      ],
      animations: [],
      activeObjectId: null,
    });
    const [selectedObjectId, setSelectedObjectId] = useState<string | null>(content.objects[0].id);

    const selectedObject = selectedObjectId ? getObjectById(content, selectedObjectId) : null;

    const handleColorAdjustmentsChange = (adjustments: ColorAdjustments) => {
      if (!selectedObject) return;

      const updateObject = (obj: PixelObject): PixelObject => {
        if (obj.id === selectedObject.id) {
          return { ...obj, colorAdjustments: adjustments };
        }
        return {
          ...obj,
          children: obj.children.map(updateObject),
        };
      };

      setContent({
        ...content,
        objects: content.objects.map(updateObject),
      });
    };

    return (
      <RenderContextProvider initialContent={content}>
        <div className="w-80 space-y-4">
          <ObjectExplorer
            content={content}
            selectedObjectId={selectedObjectId}
            onContentChange={setContent}
            onObjectSelect={setSelectedObjectId}
          />
          <ObjectPropertiesPanel
            selectedObject={selectedObject}
            onColorAdjustmentsChange={handleColorAdjustmentsChange}
          />
          <div className="text-xs text-muted-foreground space-y-1 p-2 bg-muted rounded">
            <p>• Click object to select</p>
            <p>• Double-click name to rename</p>
            <p>• Click eye icon to toggle visibility</p>
            <p>• Click + to add object</p>
            <p>• Click trash to delete</p>
            <p>• Drag to reorder or reparent</p>
            <p>• Adjust color properties below</p>
          </div>
        </div>
      </RenderContextProvider>
    );
  },
};

