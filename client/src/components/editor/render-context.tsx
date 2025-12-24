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
  reorderObject: (objectId: string, targetObjectId: string, position: "before" | "after") => void;
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
      if (parentId) {
        // Find parent and calculate order for new child (lowest order = appears at end)
        const findParentAndMinOrder = (
          objects: PixelObject[],
          targetId: string
        ): { found: boolean; minOrder: number } => {
          for (const obj of objects) {
            if (obj.id === targetId) {
              // Find minimum order among children (or use 0 if no children)
              const minOrder =
                obj.children.length > 0
                  ? Math.min(...obj.children.map((c) => c.order))
                  : 0;
              return { found: true, minOrder: minOrder - 1 };
            }
            const result = findParentAndMinOrder(obj.children, targetId);
            if (result.found) return result;
          }
          return { found: false, minOrder: 0 };
        };

        const { minOrder } = findParentAndMinOrder(prev.objects, parentId);
        const newObject = createDefaultObject(
          `Object ${prev.objects.length + 1}`,
          minOrder
        );

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
        // Add to root - find minimum order among root objects
        const minOrder =
          prev.objects.length > 0
            ? Math.min(...prev.objects.map((o) => o.order))
            : 0;
        const newObject = createDefaultObject(
          `Object ${prev.objects.length + 1}`,
          minOrder - 1
        );
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

  const reorderObject = useCallback((objectId: string, targetObjectId: string, position: "before" | "after") => {
    setContent((prev) => {
      // Helper to find object in tree
      const findObject = (objects: PixelObject[], id: string): PixelObject | null => {
        for (const obj of objects) {
          if (obj.id === id) return obj;
          const found = findObject(obj.children, id);
          if (found) return found;
        }
        return null;
      };

      const draggedObj = findObject(prev.objects, objectId);
      if (!draggedObj) return prev;
      
      // Remove dragged from tree
      const removeFromTree = (objects: PixelObject[]): PixelObject[] => {
        return objects
          .filter((obj) => obj.id !== objectId)
          .map((obj) => ({
            ...obj,
            children: removeFromTree(obj.children),
          }));
      };
      
      let newObjects = removeFromTree(prev.objects);
      
      // Insert at new location relative to target
      const insertRelativeTo = (objects: PixelObject[]): PixelObject[] => {
        const result: PixelObject[] = [];
        for (const obj of objects) {
          if (obj.id === targetObjectId) {
            if (position === "before") {
              result.push(draggedObj);
              result.push({ ...obj, children: insertRelativeTo(obj.children) });
            } else {
              result.push({ ...obj, children: insertRelativeTo(obj.children) });
              result.push(draggedObj);
            }
          } else {
            result.push({
              ...obj,
              children: insertRelativeTo(obj.children),
            });
          }
        }
        return result;
      };
      
      newObjects = insertRelativeTo(newObjects);
      
      // Renumber based on array position (higher index = lower order since we display descending)
      const renumberTree = (objects: PixelObject[]): PixelObject[] => {
        return objects.map((obj, idx) => ({
          ...obj,
          order: objects.length - 1 - idx, // First in array gets highest order
          children: renumberTree(obj.children),
        }));
      };

      return {
        ...prev,
        objects: renumberTree(newObjects),
      };
    });
    setIsDirty(true);
  }, []);

  const reparentObject = useCallback((objectId: string, newParentId: string | null) => {
    setContent((prev) => {
      // Prevent dropping into own children hierarchy
      const isDescendant = (obj: PixelObject, targetId: string): boolean => {
        if (obj.id === targetId) return true;
        return obj.children.some((child) => isDescendant(child, targetId));
      };
      
      const findObject = (objects: PixelObject[], targetId: string): PixelObject | null => {
        for (const obj of objects) {
          if (obj.id === targetId) return obj;
          const found = findObject(obj.children, targetId);
          if (found) return found;
        }
        return null;
      };
      
      const draggedObject = findObject(prev.objects, objectId);
      if (!draggedObject) return prev;
      
      if (newParentId !== null) {
        const targetParent = findObject(prev.objects, newParentId);
        if (targetParent && isDescendant(targetParent, objectId)) {
          return prev; // Cannot drop into own hierarchy
        }
      }

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

      // Find minimum order in target parent (lowest = appears at end)
      const findMinOrder = (objects: PixelObject[], targetId: string | null): number => {
        if (targetId === null) {
          return objects.length > 0 ? Math.min(...objects.map((o) => o.order)) : 0;
        }
        for (const obj of objects) {
          if (obj.id === targetId) {
            return obj.children.length > 0
              ? Math.min(...obj.children.map((o) => o.order))
              : 0;
          }
          const found = findMinOrder(obj.children, targetId);
          if (found !== 0 || obj.children.length === 0) return found;
        }
        return 0;
      };

      const minOrder = findMinOrder(objectsWithout, newParentId);
      const newObject = { ...removed, order: minOrder - 1 };

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

