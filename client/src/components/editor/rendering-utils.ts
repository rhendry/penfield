import type { PixelObject, Transform, ColorTint, ColorAdjustments, PixelAssetContent } from "@shared/types/pixel-asset";
import { flattenObjectTree, getObjectById } from "@shared/utils/pixel-asset";
import { composeTransforms, transformToMatrix } from "@shared/utils/transform";

/**
 * Render an object's pixels to ImageData
 */
export function renderObjectPixelsToImageData(
  object: PixelObject,
  imageData: ImageData,
  maxSize: number,
  halfSize: number
): void {
  for (const key in object.pixels) {
    const commaIdx = key.indexOf(",");
    const x = parseInt(key.slice(0, commaIdx), 10);
    const y = parseInt(key.slice(commaIdx + 1), 10);

    const imgX = x + halfSize;
    const imgY = y + halfSize;
    if (imgX < 0 || imgX >= maxSize || imgY < 0 || imgY >= maxSize) continue;

    const idx = (imgY * maxSize + imgX) * 4;
    const [r, g, b, a] = parseColor(object.pixels[key]);
    imageData.data[idx] = r;
    imageData.data[idx + 1] = g;
    imageData.data[idx + 2] = b;
    imageData.data[idx + 3] = a;
  }
}

/**
 * Parse color string to RGBA (0-255)
 */
function parseColor(color: string): [number, number, number, number] {
  const rgbaMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
  if (rgbaMatch) {
    return [
      parseInt(rgbaMatch[1], 10),
      parseInt(rgbaMatch[2], 10),
      parseInt(rgbaMatch[3], 10),
      rgbaMatch[4] ? Math.round(parseFloat(rgbaMatch[4]) * 255) : 255
    ];
  }

  let hex = color;
  if (hex.startsWith('#')) hex = hex.slice(1);
  if (hex.length === 3) {
    hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  }
  if (hex.length === 6) {
    return [
      parseInt(hex.slice(0, 2), 16),
      parseInt(hex.slice(2, 4), 16),
      parseInt(hex.slice(4, 6), 16),
      255
    ];
  }
  if (hex.length === 8) {
    return [
      parseInt(hex.slice(0, 2), 16),
      parseInt(hex.slice(2, 4), 16),
      parseInt(hex.slice(4, 6), 16),
      parseInt(hex.slice(6, 8), 16)
    ];
  }
  return [0, 0, 0, 255];
}

/**
 * Apply color tint (multiply blend) to ImageData
 */
export function applyColorTint(
  imageData: ImageData,
  tint: ColorTint
): void {
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] === 0) continue; // Skip transparent pixels
    
    data[i] = Math.round(data[i] * tint.r * tint.a);
    data[i + 1] = Math.round(data[i + 1] * tint.g * tint.a);
    data[i + 2] = Math.round(data[i + 2] * tint.b * tint.a);
    data[i + 3] = Math.round(data[i + 3] * tint.a);
  }
}

/**
 * Apply color adjustments (brightness, contrast, saturation) to ImageData
 */
export function applyColorAdjustments(
  imageData: ImageData,
  adjustments: ColorAdjustments
): void {
  const data = imageData.data;
  const brightness = adjustments.brightness;
  const contrast = adjustments.contrast;
  const saturation = adjustments.saturation;

  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] === 0) continue; // Skip transparent pixels

    let r = data[i] / 255;
    let g = data[i + 1] / 255;
    let b = data[i + 2] / 255;

    // Brightness
    r += brightness;
    g += brightness;
    b += brightness;

    // Contrast
    const contrastFactor = (contrast + 1) / (1 - contrast);
    r = ((r - 0.5) * contrastFactor) + 0.5;
    g = ((g - 0.5) * contrastFactor) + 0.5;
    b = ((b - 0.5) * contrastFactor) + 0.5;

    // Saturation
    const gray = 0.299 * r + 0.587 * g + 0.114 * b;
    const satFactor = saturation + 1;
    r = gray + (r - gray) * satFactor;
    g = gray + (g - gray) * satFactor;
    b = gray + (b - gray) * satFactor;

    // Clamp and convert back
    data[i] = Math.max(0, Math.min(255, Math.round(r * 255)));
    data[i + 1] = Math.max(0, Math.min(255, Math.round(g * 255)));
    data[i + 2] = Math.max(0, Math.min(255, Math.round(b * 255)));
  }
}

/**
 * Composite source ImageData onto destination ImageData using alpha blending
 */
export function compositeImageData(
  dest: ImageData,
  source: ImageData,
  transform: Transform,
  maxSize: number,
  halfSize: number
): void {
  const matrix = transformToMatrix(transform);
  const cos = Math.cos(transform.rotation);
  const sin = Math.sin(transform.rotation);

  for (let sy = 0; sy < maxSize; sy++) {
    for (let sx = 0; sx < maxSize; sx++) {
      const srcIdx = (sy * maxSize + sx) * 4;
      const srcA = source.data[srcIdx + 3];
      if (srcA === 0) continue; // Skip transparent pixels

      // Apply inverse transform to find destination coordinates
      const srcX = sx - halfSize;
      const srcY = sy - halfSize;

      // Apply transform
      const dx = srcX * transform.scaleX * cos - srcY * transform.scaleY * sin + transform.x;
      const dy = srcX * transform.scaleX * sin + srcY * transform.scaleY * cos + transform.y;

      const destX = Math.round(dx + halfSize);
      const destY = Math.round(dy + halfSize);

      if (destX < 0 || destX >= maxSize || destY < 0 || destY >= maxSize) continue;

      const destIdx = (destY * maxSize + destX) * 4;

      // Alpha blending
      const srcR = source.data[srcIdx];
      const srcG = source.data[srcIdx + 1];
      const srcB = source.data[srcIdx + 2];
      const destA = dest.data[destIdx + 3];
      const destR = dest.data[destIdx];
      const destG = dest.data[destIdx + 1];
      const destB = dest.data[destIdx + 2];

      const alpha = srcA / 255;
      const invAlpha = 1 - alpha;

      dest.data[destIdx] = Math.round(srcR * alpha + destR * invAlpha);
      dest.data[destIdx + 1] = Math.round(srcG * alpha + destG * invAlpha);
      dest.data[destIdx + 2] = Math.round(srcB * alpha + destB * invAlpha);
      dest.data[destIdx + 3] = Math.min(255, Math.round(srcA + destA * invAlpha));
    }
  }
}

/**
 * Render object's pixels to a single ImageData buffer
 * Note: Visibility is checked in renderAssetContent, so this always renders
 */
export function renderObjectPixels(
  object: PixelObject,
  maxSize: number,
  halfSize: number
): ImageData {
  const imageData = new ImageData(maxSize, maxSize);
    renderObjectPixelsToImageData(object, imageData, maxSize, halfSize);
  return imageData;
}

/**
 * Render entire asset content to a single ImageData buffer
 */
export function renderAssetContent(
  content: PixelAssetContent,
  maxSize: number,
  halfSize: number
): ImageData {
  const result = new ImageData(maxSize, maxSize);
  
  // Flatten object tree and sort by order (lower order = drawn first/behind)
  const allObjects = flattenObjectTree(content.objects);
  const sortedObjects = [...allObjects].sort((a, b) => a.order - b.order);
  
  // Render each visible object
  for (const obj of sortedObjects) {
    if (!obj.visible) continue;
    
    // Render object's pixels to temporary buffer
    const objectBuffer = renderObjectPixels(obj, maxSize, halfSize);
    
    // Compute composite transform (for now, just use object's transform)
    // TODO: Compute parent transforms when nested objects are implemented
    const compositeTransform = obj.transform;
    
    // Apply color tint
    if (obj.colorTint.r !== 1 || obj.colorTint.g !== 1 || obj.colorTint.b !== 1 || obj.colorTint.a !== 1) {
      applyColorTint(objectBuffer, obj.colorTint);
    }
    
    // Apply color adjustments
    if (obj.colorAdjustments.brightness !== 0 || obj.colorAdjustments.contrast !== 0 || obj.colorAdjustments.saturation !== 0) {
      applyColorAdjustments(objectBuffer, obj.colorAdjustments);
    }
    
    // Composite onto result
    compositeImageData(result, objectBuffer, compositeTransform, maxSize, halfSize);
  }
  
  return result;
}

