import React, { createContext, useContext, useState, useCallback } from "react";
import type { PixelAssetContent, PixelObject } from "@shared/types/pixel-asset";
import { createDefaultObject } from "@shared/utils/pixel-asset";

interface RenderContextValue {
  content: PixelAssetContent;
  activeObjectId: string | null;
  selectedObjectId: string | null;
  setContent: (content: PixelAssetContent) => void;
  setActiveObjectId: (objectId: string | null) => void;
  setSelectedObjectId: (objectId: string | null) => void;
  updateObject: (objectId: string, updates: Partial<PixelObject>) => void;
  addObject: (parentId?: string) => void;
  deleteObject: (objectId: string) => void;
  renameObject: (objectId: string, name: string) => void;
  reorderObject: (objectId: string, newOrder: number, targetParentId?: string) => void;
  reparentObject: (objectId: string, newParentId: string | null) => void;
  isDirty: boolean;
  markDirty: () => void;
  markClean: () => void;
}

const RenderContext = createContext<RenderContextValue | null>(null);

export interface RenderContextProviderProps {
  initialContent: PixelAssetContent;
  children: React.ReactNode;
}

export function RenderContextProvider({
  initialContent,
  children,
}: RenderContextProviderProps) {
  const [content, setContent] = useState<PixelAssetContent>(initialContent);
  const [activeObjectId, setActiveObjectId] = useState<string | null>(
    initialContent.activeObjectId
  );
  const [selectedObjectId, setSelectedObjectId] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  const updateObject = useCallback((objectId: string, updates: Partial<PixelObject>) => {
    setContent((prev) => {
      const updateObjectInTree = (obj: PixelObject): PixelObject => {
        if (obj.id === objectId) {
          return { ...obj, ...updates };
        }
        return {
          ...obj,
          children: obj.children.map(updateObjectInTree),
        };
      };

      return {
        ...prev,
        objects: prev.objects.map(updateObjectInTree),
      };
    });
    setIsDirty(true);
  }, []);

  const addObject = useCallback((parentId?: string) => {
    setContent((prev) => {
      const newObject = createDefaultObject(
        `Object ${prev.objects.length + 1}`,
        prev.objects.length
      );

      if (parentId) {
        const addToParent = (obj: PixelObject): PixelObject => {
          if (obj.id === parentId) {
            return {
              ...obj,
              children: [...obj.children, newObject],
            };
          }
          return {
            ...obj,
            children: obj.children.map(addToParent),
          };
        };

        return {
          ...prev,
          objects: prev.objects.map(addToParent),
          activeObjectId: newObject.id,
        };
      } else {
        return {
          ...prev,
          objects: [...prev.objects, newObject],
          activeObjectId: newObject.id,
        };
      }
    });
    setIsDirty(true);
  }, []);

  const deleteObject = useCallback((objectId: string) => {
    setContent((prev) => {
      const removeFromTree = (objects: PixelObject[]): PixelObject[] => {
        return objects
          .filter((obj) => obj.id !== objectId)
          .map((obj) => ({
            ...obj,
            children: removeFromTree(obj.children),
          }));
      };

      const newObjects = removeFromTree(prev.objects);
      const newActiveObjectId =
        prev.activeObjectId === objectId
          ? newObjects.length > 0
            ? newObjects[0].id
            : null
          : prev.activeObjectId;

      return {
        ...prev,
        objects: newObjects,
        activeObjectId: newActiveObjectId,
      };
    });
    setIsDirty(true);
  }, []);

  const renameObject = useCallback((objectId: string, name: string) => {
    updateObject(objectId, { name });
  }, [updateObject]);

  const reorderObject = useCallback((objectId: string, newOrder: number, targetParentId?: string) => {
    setContent((prev) => {
      // Find the object and its current parent
      const findObjectAndParent = (objects: PixelObject[], parentId: string | null = null): { obj: PixelObject | null; parentId: string | null } => {
        for (const obj of objects) {
          if (obj.id === objectId) {
            return { obj, parentId };
          }
          const found = findObjectAndParent(obj.children, obj.id);
          if (found.obj) return found;
        }
        return { obj: null, parentId: null };
      };

      const { obj, parentId: currentParentId } = findObjectAndParent(prev.objects);
      if (!obj) return prev;
      
      const currentOrder = obj.order;

      // If reparenting, handle that separately
      if (targetParentId !== undefined && targetParentId !== currentParentId) {
        // This will be handled by reparentObject
        return prev;
      }

      // Reorder within the same parent level
      const reorderInParent = (objects: PixelObject[], parentId: string | null): PixelObject[] => {
        // Only process objects at the same level as the target
        if (parentId !== currentParentId) {
          return objects.map((o) => ({
            ...o,
            children: reorderInParent(o.children, o.id),
          }));
        }

        // Get all siblings (objects at this level)
        const siblings = [...objects];
        const draggedIndex = siblings.findIndex((o) => o.id === objectId);
        if (draggedIndex === -1) {
          return objects.map((o) => ({
            ...o,
            children: reorderInParent(o.children, o.id),
          }));
        }

        // Remove dragged object from siblings
        const dragged = siblings[draggedIndex];
        const withoutDragged = siblings.filter((_, i) => i !== draggedIndex);

        // Find insertion point based on newOrder
        let insertIndex = withoutDragged.length;
        for (let i = 0; i < withoutDragged.length; i++) {
          if (newOrder <= withoutDragged[i].order) {
            insertIndex = i;
            break;
          }
        }

        // Insert dragged object at new position
        const reordered = [
          ...withoutDragged.slice(0, insertIndex),
          { ...dragged, order: newOrder },
          ...withoutDragged.slice(insertIndex),
        ];

        // Adjust orders of objects that need shifting
        return reordered.map((o) => {
          if (o.id === objectId) {
            return {
              ...o,
              children: reorderInParent(o.children, o.id),
            };
          }
          
          // Find original position in siblings array
          const oldIndex = siblings.findIndex((x) => x.id === o.id);
          let adjustedOrder = o.order;
          
          if (draggedIndex < insertIndex) {
            // Moving down - shift objects between old and new positions
            if (oldIndex > draggedIndex && oldIndex <= insertIndex) {
              adjustedOrder = o.order - 1;
            }
          } else if (draggedIndex > insertIndex) {
            // Moving up - shift objects between new and old positions
            if (oldIndex >= insertIndex && oldIndex < draggedIndex) {
              adjustedOrder = o.order + 1;
            }
          }
          
          return {
            ...o,
            order: adjustedOrder,
            children: reorderInParent(o.children, o.id),
          };
        });
      };

      return {
        ...prev,
        objects: reorderInParent(prev.objects, null),
      };
    });
    setIsDirty(true);
  }, []);

  const reparentObject = useCallback((objectId: string, newParentId: string | null) => {
    setContent((prev) => {
      // Find and remove object from current parent
      const removeFromTree = (objects: PixelObject[]): { objects: PixelObject[]; removed: PixelObject | null } => {
        for (let i = 0; i < objects.length; i++) {
          if (objects[i].id === objectId) {
            const removed = objects[i];
            return {
              objects: objects.filter((_, idx) => idx !== i),
              removed,
            };
          }
          const result = removeFromTree(objects[i].children);
          if (result.removed) {
            return {
              objects: objects.map((obj, idx) =>
                idx === i ? { ...obj, children: result.objects } : obj
              ),
              removed: result.removed,
            };
          }
        }
        return { objects, removed: null };
      };

      const { objects: objectsWithout, removed } = removeFromTree(prev.objects);
      if (!removed) return prev;

      // Find max order in target parent
      const findMaxOrder = (objects: PixelObject[], targetId: string | null): number => {
        if (targetId === null) {
          return objects.length > 0 ? Math.max(...objects.map((o) => o.order)) : -1;
        }
        for (const obj of objects) {
          if (obj.id === targetId) {
            return obj.children.length > 0 ? Math.max(...obj.children.map((o) => o.order)) : -1;
          }
          const found = findMaxOrder(obj.children, targetId);
          if (found !== -1) return found;
        }
        return -1;
      };

      const maxOrder = findMaxOrder(objectsWithout, newParentId);
      const newObject = { ...removed, order: maxOrder + 1 };

      // Add to new parent
      const addToParent = (objects: PixelObject[]): PixelObject[] => {
        if (newParentId === null) {
          return [...objects, newObject];
        }
        return objects.map((obj) => {
          if (obj.id === newParentId) {
            return {
              ...obj,
              children: [...obj.children, newObject],
            };
          }
          return {
            ...obj,
            children: addToParent(obj.children),
          };
        });
      };

      return {
        ...prev,
        objects: addToParent(objectsWithout),
      };
    });
    setIsDirty(true);
  }, []);

  const markDirty = useCallback(() => setIsDirty(true), []);
  const markClean = useCallback(() => setIsDirty(false), []);

  const value: RenderContextValue = {
    content,
    activeObjectId,
    selectedObjectId,
    setContent,
    setActiveObjectId,
    setSelectedObjectId,
    updateObject,
    addObject,
    deleteObject,
    renameObject,
    reorderObject,
    reparentObject,
    isDirty,
    markDirty,
    markClean,
  };

  return <RenderContext.Provider value={value}>{children}</RenderContext.Provider>;
}

export function useRenderContext(): RenderContextValue {
  const context = useContext(RenderContext);
  if (!context) {
    throw new Error("useRenderContext must be used within RenderContextProvider");
  }
  return context;
}

