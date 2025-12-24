/**
 * Object reordering and reparenting utilities
 * 
 * Pure functions for manipulating object hierarchies.
 * These functions are testable and don't depend on React.
 */

import type { PixelObject, PixelAssetContent } from "../types/pixel-asset";

/**
 * Move an object within the hierarchy
 * 
 * @param content - The current asset content
 * @param draggedId - ID of the object being moved
 * @param parentId - ID of the new parent (null for root level)
 * @param index - Index position to insert at (0-based)
 * @returns New content with object moved
 */
export function moveObject(
  content: PixelAssetContent,
  draggedId: string,
  parentId: string | null,
  index: number
): PixelAssetContent {
  // Helper to find object and its current location
  const findObjectLocation = (
    objs: PixelObject[],
    targetId: string,
    currentParent: PixelObject | null = null
  ): { obj: PixelObject | null; parent: PixelObject | null; index: number } | null => {
    for (let i = 0; i < objs.length; i++) {
      if (objs[i].id === targetId) {
        return { obj: objs[i], parent: currentParent, index: i };
      }
      const found = findObjectLocation(objs[i].children, targetId, objs[i]);
      if (found) return found;
    }
    return null;
  };

  // Helper to get children of a specific parent (or root)
  const getChildren = (objs: PixelObject[], targetParentId: string | null): PixelObject[] => {
    if (targetParentId === null) {
      return objs;
    }
    const findParent = (objs: PixelObject[]): PixelObject | null => {
      for (const obj of objs) {
        if (obj.id === targetParentId) return obj;
        const found = findParent(obj.children);
        if (found) return found;
      }
      return null;
    };
    const parent = findParent(objs);
    return parent ? parent.children : [];
  };

  const location = findObjectLocation(content.objects, draggedId);
  if (!location || !location.obj) return content;

  const draggedObj = location.obj;
  const oldParent = location.parent;
  const oldIndex = location.index;

  // Check if moving to same position
  const oldParentId = oldParent?.id ?? null;
  if (oldParentId === parentId && oldIndex === index) {
    return content; // No change needed
  }

  // Adjust index: if moving within same parent and dragging from before target index,
  // we need to adjust because removal shifts indices
  let adjustedIndex = index;
  if (oldParentId === parentId && oldIndex < index) {
    // Moving forward: after removal, target index shifts left by 1
    adjustedIndex = index - 1;
  }

  // Helper to remove object from tree
  const removeFromTree = (objs: PixelObject[]): PixelObject[] => {
    return objs
      .filter((obj) => obj.id !== draggedId)
      .map((obj) => ({
        ...obj,
        children: removeFromTree(obj.children),
      }));
  };

  // Remove dragged object from tree
  const objectsWithout = removeFromTree(content.objects);

  // Helper to insert object into tree
  const insertIntoTree = (objs: PixelObject[]): PixelObject[] => {
    if (parentId === null) {
      // Inserting at root level
      const result = [...objs];
      result.splice(adjustedIndex, 0, draggedObj);
      return result;
    } else {
      // Inserting into a parent
      return objs.map((obj) => {
        if (obj.id === parentId) {
          const children = [...obj.children];
          children.splice(adjustedIndex, 0, draggedObj);
          return { ...obj, children };
        }
        return { ...obj, children: insertIntoTree(obj.children) };
      });
    }
  };

  const newObjects = insertIntoTree(objectsWithout);

  // Update order values based on position (higher index = higher order)
  const updateOrder = (objs: PixelObject[]): PixelObject[] => {
    return objs.map((obj, idx) => ({
      ...obj,
      order: objs.length - 1 - idx, // Higher index = higher order
      children: obj.children.length > 0 ? updateOrder(obj.children) : [],
    }));
  };

  const orderedObjects = updateOrder(newObjects);

  return {
    ...content,
    objects: orderedObjects,
  };
}

