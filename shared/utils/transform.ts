import type { Transform } from "../types/pixel-asset";

/**
 * Compose two transforms: result = parent * child
 * Applies parent transform first, then child transform
 */
export function composeTransforms(parent: Transform, child: Transform): Transform {
  // Convert to matrices for composition
  const parentMatrix = transformToMatrix(parent);
  const childMatrix = transformToMatrix(child);
  
  // Multiply matrices: parent * child
  const resultMatrix = multiplyMatrices(parentMatrix, childMatrix);
  
  return matrixToTransform(resultMatrix);
}

/**
 * Apply transform to a point
 */
export function applyTransform(transform: Transform, point: { x: number; y: number }): { x: number; y: number } {
  const matrix = transformToMatrix(transform);
  
  // Apply matrix transformation
  const x = matrix[0] * point.x + matrix[1] * point.y + matrix[2];
  const y = matrix[3] * point.x + matrix[4] * point.y + matrix[5];
  
  return { x, y };
}

/**
 * Get inverse transform
 */
export function inverseTransform(transform: Transform): Transform {
  const matrix = transformToMatrix(transform);
  const invMatrix = invertMatrix(matrix);
  return matrixToTransform(invMatrix);
}

/**
 * Convert transform to 3x3 matrix (stored as 9-element array, row-major)
 * [a, b, tx]
 * [c, d, ty]
 * [0, 0, 1]
 */
export function transformToMatrix(transform: Transform): number[] {
  const cos = Math.cos(transform.rotation);
  const sin = Math.sin(transform.rotation);
  
  return [
    transform.scaleX * cos, -transform.scaleY * sin, transform.x,
    transform.scaleX * sin, transform.scaleY * cos, transform.y,
    0, 0, 1,
  ];
}

/**
 * Convert 3x3 matrix to transform
 */
export function matrixToTransform(matrix: number[]): Transform {
  const a = matrix[0];
  const b = matrix[1];
  const c = matrix[3];
  const d = matrix[4];
  const tx = matrix[2];
  const ty = matrix[5];
  
  // Extract scale and rotation
  const scaleX = Math.sqrt(a * a + c * c);
  const scaleY = Math.sqrt(b * b + d * d);
  const rotation = Math.atan2(c, a);
  
  return {
    x: tx,
    y: ty,
    rotation,
    scaleX,
    scaleY,
  };
}

/**
 * Multiply two 3x3 matrices
 */
function multiplyMatrices(a: number[], b: number[]): number[] {
  return [
    a[0] * b[0] + a[1] * b[3] + a[2] * b[6],
    a[0] * b[1] + a[1] * b[4] + a[2] * b[7],
    a[0] * b[2] + a[1] * b[5] + a[2] * b[8],
    a[3] * b[0] + a[4] * b[3] + a[5] * b[6],
    a[3] * b[1] + a[4] * b[4] + a[5] * b[7],
    a[3] * b[2] + a[4] * b[5] + a[5] * b[8],
    a[6] * b[0] + a[7] * b[3] + a[8] * b[6],
    a[6] * b[1] + a[7] * b[4] + a[8] * b[7],
    a[6] * b[2] + a[7] * b[5] + a[8] * b[8],
  ];
}

/**
 * Invert a 3x3 matrix
 */
function invertMatrix(matrix: number[]): number[] {
  const a = matrix[0];
  const b = matrix[1];
  const c = matrix[2];
  const d = matrix[3];
  const e = matrix[4];
  const f = matrix[5];
  const g = matrix[6];
  const h = matrix[7];
  const i = matrix[8];
  
  // Determinant
  const det = a * (e * i - f * h) - b * (d * i - f * g) + c * (d * h - e * g);
  
  if (Math.abs(det) < 1e-10) {
    // Singular matrix, return identity
    return [1, 0, 0, 0, 1, 0, 0, 0, 1];
  }
  
  const invDet = 1 / det;
  
  return [
    (e * i - f * h) * invDet,
    (c * h - b * i) * invDet,
    (b * f - c * e) * invDet,
    (f * g - d * i) * invDet,
    (a * i - c * g) * invDet,
    (c * d - a * f) * invDet,
    (d * h - e * g) * invDet,
    (b * g - a * h) * invDet,
    (a * e - b * d) * invDet,
  ];
}

