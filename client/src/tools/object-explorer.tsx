import { PixelTool } from "./types";
import { ObjectExplorer } from "@/components/editor/object-explorer";
import { ObjectPropertiesPanel } from "@/components/editor/object-properties-panel";
import { useRenderContext } from "@/components/editor/render-context";
import { useState, Fragment, useMemo } from "react";
import { getObjectById } from "@shared/utils/pixel-asset";
import type { ColorAdjustments, PixelObject } from "@shared/types/pixel-asset";

/**
 * Object Explorer Tool
 * 
 * Provides a tree view of objects with drag-and-drop reordering/reparenting,
 * visibility toggles, and a properties panel for color adjustments.
 */
export const objectExplorerTool: PixelTool = {
  id: "object-explorer",
  name: "Object Explorer",
  description: "Manage objects and their properties",
  iconType: "lucide",
  iconName: "Layers",
  onPointerDown: () => {
    // No-op - this tool doesn't interact with the canvas
  },
  onPointerMove: () => {
    // No-op
  },
  onPointerUp: () => {
    // No-op
  },
  utilities: (
    <ObjectExplorerToolUtilities />
  ),
};

function ObjectExplorerToolUtilities() {
  const { content, setContent, markDirty } = useRenderContext();
  const [selectedObjectId, setSelectedObjectId] = useState<string | null>(content.activeObjectId);

  const selectedObject = useMemo(() => {
    return selectedObjectId ? getObjectById(content, selectedObjectId) : null;
  }, [content, selectedObjectId]);

  const handleContentChange = (newContent: typeof content) => {
    setContent(newContent);
    markDirty();
  };

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

    handleContentChange({
      ...content,
      objects: content.objects.map(updateObject),
    });
  };

  return (
    <Fragment>
      <ObjectExplorer
        content={content}
        selectedObjectId={selectedObjectId}
        onContentChange={handleContentChange}
        onObjectSelect={setSelectedObjectId}
      />
      <ObjectPropertiesPanel
        selectedObject={selectedObject}
        onColorAdjustmentsChange={handleColorAdjustmentsChange}
      />
    </Fragment>
  );
}

