import type { PixelObject, PixelAssetContent, SpriteAnimation, Transform, ColorTint, ColorAdjustments } from "../types/pixel-asset";

/**
 * Create a default transform (identity transform)
 */
export function createDefaultTransform(): Transform {
  return {
    x: 0,
    y: 0,
    rotation: 0,
    scaleX: 1,
    scaleY: 1,
  };
}

/**
 * Create a default color tint (no tinting)
 */
export function createDefaultColorTint(): ColorTint {
  return {
    r: 1,
    g: 1,
    b: 1,
    a: 1,
  };
}

/**
 * Create default color adjustments (no adjustments)
 */
export function createDefaultColorAdjustments(): ColorAdjustments {
  return {
    brightness: 0,
    contrast: 0,
    saturation: 0,
  };
}

/**
 * Create a default object with empty pixel data
 */
export function createDefaultObject(name: string, order: number = 0): PixelObject {
  return {
    id: crypto.randomUUID(),
    name,
    pixels: {},
    transform: createDefaultTransform(),
    colorTint: createDefaultColorTint(),
    colorAdjustments: createDefaultColorAdjustments(),
    visible: true,
    order,
    children: [],
  };
}

/**
 * Create a default animation
 */
export function createDefaultAnimation(name: string): SpriteAnimation {
  return {
    id: crypto.randomUUID(),
    name,
    frames: [],
    loop: true,
    playing: false,
    gridConfig: { rows: 2, cols: 2 },
    stickyGrid: false,
    ghosting: false,
    ghostingAlpha: 0.3,
  };
}

/**
 * Create default asset content with a single "main" object
 */
export function createDefaultAssetContent(): PixelAssetContent {
  const mainObject = createDefaultObject("main", 0);
  
  return {
    version: 1,
    objects: [mainObject],
    animations: [],
    activeObjectId: mainObject.id,
  };
}

/**
 * Migrate legacy content format { grid: ... } to new PixelAssetContent format
 */
export function migrateLegacyContent(legacyContent: { grid?: Record<string, string> }): PixelAssetContent {
  const defaultObject = createDefaultObject("Object 1", 0);
  
  if (legacyContent.grid) {
    defaultObject.pixels = legacyContent.grid;
  }

  return {
    version: 1,
    objects: [defaultObject],
    animations: [],
    activeObjectId: defaultObject.id,
  };
}

/**
 * Get the active object from asset content
 */
export function getActiveObject(content: PixelAssetContent): PixelObject | null {
  if (!content.activeObjectId) return null;
  return getObjectById(content, content.activeObjectId);
}

/**
 * Get an object by ID from the object tree
 */
export function getObjectById(content: PixelAssetContent, objectId: string): PixelObject | null {
  for (const obj of content.objects) {
    const found = findObjectInTree(obj, objectId);
    if (found) return found;
  }
  return null;
}

/**
 * Find an object in a tree by ID
 */
function findObjectInTree(obj: PixelObject, objectId: string): PixelObject | null {
  if (obj.id === objectId) return obj;
  
  for (const child of obj.children) {
    const found = findObjectInTree(child, objectId);
    if (found) return found;
  }
  
  return null;
}

/**
 * Flatten object tree into a list of all objects (for rendering)
 * Returns objects in depth-first order
 */
export function flattenObjectTree(objects: PixelObject[]): PixelObject[] {
  const result: PixelObject[] = [];
  
  function traverse(obj: PixelObject) {
    result.push(obj);
    for (const child of obj.children) {
      traverse(child);
    }
  }
  
  for (const obj of objects) {
    traverse(obj);
  }
  
  return result;
}

/**
 * Get all objects from asset content (flattened, sorted by order)
 */
export function getAllObjects(content: PixelAssetContent): PixelObject[] {
  const allObjects = flattenObjectTree(content.objects);
  return allObjects.sort((a, b) => a.order - b.order);
}

