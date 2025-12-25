import { z } from "zod";

// Base pixel data format (unchanged)
export type PixelGrid = Record<string, string>; // "x,y" -> color

// Transform - 2D transformation
export interface Transform {
  x: number;      // Translation X
  y: number;      // Translation Y
  rotation: number; // Rotation in radians
  scaleX: number;  // Scale X (1.0 = no scaling)
  scaleY: number; // Scale Y (1.0 = no scaling)
}

// Color tinting (multiply blend mode)
export interface ColorTint {
  r: number; // 0-1 multiplier for red channel
  g: number; // 0-1 multiplier for green channel
  b: number; // 0-1 multiplier for blue channel
  a: number; // Opacity (0-1)
}

// Color adjustments (post-effects)
export interface ColorAdjustments {
  brightness: number;  // -1 to 1 (0 = no change)
  contrast: number;    // -1 to 1 (0 = no change)
  saturation: number;   // -1 to 1 (0 = no change)
}

// Object - contains pixel data directly, transform, and effects
// Objects are essentially their own canvas layers
export interface PixelObject {
  id: string;
  name: string;
  pixels: PixelGrid; // Direct pixel data - objects are the layers
  transform: Transform;
  colorTint: ColorTint;
  colorAdjustments: ColorAdjustments;
  visible: boolean;
  order: number; // Higher = drawn on top
  children: PixelObject[]; // Nested objects (inherit parent transform)
}

// Animation frame
export interface AnimationFrame {
  objectId: string;  // Reference to a PixelObject
  duration: number;  // Duration in milliseconds
}

// Animation
export interface SpriteAnimation {
  id: string;
  name: string;
  frames: AnimationFrame[];
  loop: boolean;
  playing: boolean;
}

// Root asset structure
export interface PixelAssetContent {
  version: number; // Schema version for future migrations
  objects: PixelObject[]; // Root scene objects (these are the layers)
  animations: SpriteAnimation[];
  activeObjectId: string | null; // Currently active object for editing
}

// Zod schemas for validation
export const pixelGridSchema = z.record(z.string(), z.string());

export const transformSchema = z.object({
  x: z.number(),
  y: z.number(),
  rotation: z.number(),
  scaleX: z.number(),
  scaleY: z.number(),
});

export const colorTintSchema = z.object({
  r: z.number().min(0).max(1),
  g: z.number().min(0).max(1),
  b: z.number().min(0).max(1),
  a: z.number().min(0).max(1),
});

export const colorAdjustmentsSchema = z.object({
  brightness: z.number().min(-1).max(1),
  contrast: z.number().min(-1).max(1),
  saturation: z.number().min(-1).max(1),
});

export const pixelObjectSchema: z.ZodType<PixelObject> = z.lazy(() => z.object({
  id: z.string(),
  name: z.string(),
  pixels: pixelGridSchema,
  transform: transformSchema,
  colorTint: colorTintSchema,
  colorAdjustments: colorAdjustmentsSchema,
  visible: z.boolean(),
  order: z.number(),
  children: z.array(pixelObjectSchema),
}));

export const animationFrameSchema = z.object({
  objectId: z.string(),
  duration: z.number().min(0),
});

export const spriteAnimationSchema = z.object({
  id: z.string(),
  name: z.string(),
  frames: z.array(animationFrameSchema),
  loop: z.boolean(),
  playing: z.boolean(),
});

export const pixelAssetContentSchema = z.object({
  version: z.number(),
  objects: z.array(pixelObjectSchema),
  animations: z.array(spriteAnimationSchema),
  activeObjectId: z.string().nullable(),
});

