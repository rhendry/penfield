import { PixelTool } from "./types";
import { ObjectExplorer } from "@/components/editor/object-explorer";
import { ObjectPropertiesPanel } from "@/components/editor/object-properties-panel";
import { useRenderContext } from "@/components/editor/render-context";
import { useState, Fragment, useMemo, useCallback } from "react";
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
  // Sync selectedObjectId with activeObjectId from content
  const selectedObjectId = content.activeObjectId;

  const selectedObject = useMemo(() => {
    return selectedObjectId ? getObjectById(content, selectedObjectId) : null;
  }, [content, selectedObjectId]);

  const handleContentChange = useCallback((newContent: typeof content | ((prev: typeof content) => typeof content)) => {
    if (typeof newContent === 'function') {
      setContent(newContent);
    } else {
    setContent(newContent);
    }
    markDirty();
  }, [setContent, markDirty]);

  // Handle object selection - also sets it as the active object for drawing
  const handleObjectSelect = useCallback((objectId: string | null) => {
    setContent((prevContent) => ({
      ...prevContent,
      activeObjectId: objectId,
    }));
    markDirty();
  }, [setContent, markDirty]);

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
        onObjectSelect={handleObjectSelect}
      />
      <ObjectPropertiesPanel
        selectedObject={selectedObject}
        onColorAdjustmentsChange={handleColorAdjustmentsChange}
      />
    </Fragment>
  );
}

