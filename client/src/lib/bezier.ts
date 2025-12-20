/**
 * Bezier Curve Library
 * 
 * Provides utilities for generating smooth curves from control points.
 * Used for smoothing pixel art drawing when mouse moves quickly.
 */

export interface Point {
    x: number;
    y: number;
}

/**
 * Generate points along a quadratic Bezier curve
 * @param p0 Start point
 * @param p1 Control point
 * @param p2 End point
 * @param numPoints Number of points to generate along the curve
 * @returns Array of points along the curve
 */
export function quadraticBezier(
    p0: Point,
    p1: Point,
    p2: Point,
    numPoints: number
): Point[] {
    const points: Point[] = [];
    
    for (let i = 0; i <= numPoints; i++) {
        const t = i / numPoints;
        const mt = 1 - t;
        const mt2 = mt * mt;
        const t2 = t * t;
        
        const x = mt2 * p0.x + 2 * mt * t * p1.x + t2 * p2.x;
        const y = mt2 * p0.y + 2 * mt * t * p1.y + t2 * p2.y;
        
        points.push({ x: Math.round(x), y: Math.round(y) });
    }
    
    return points;
}

/**
 * Generate points along a cubic Bezier curve
 * @param p0 Start point
 * @param p1 First control point
 * @param p2 Second control point
 * @param p3 End point
 * @param numPoints Number of points to generate along the curve
 * @returns Array of points along the curve
 */
export function cubicBezier(
    p0: Point,
    p1: Point,
    p2: Point,
    p3: Point,
    numPoints: number
): Point[] {
    const points: Point[] = [];
    
    for (let i = 0; i <= numPoints; i++) {
        const t = i / numPoints;
        const mt = 1 - t;
        const mt2 = mt * mt;
        const mt3 = mt2 * mt;
        const t2 = t * t;
        const t3 = t2 * t;
        
        const x = mt3 * p0.x + 3 * mt2 * t * p1.x + 3 * mt * t2 * p2.x + t3 * p3.x;
        const y = mt3 * p0.y + 3 * mt2 * t * p1.y + 3 * mt * t2 * p2.y + t3 * p3.y;
        
        points.push({ x: Math.round(x), y: Math.round(y) });
    }
    
    return points;
}

/**
 * Calculate distance between two points
 */
function distance(p1: Point, p2: Point): number {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Generate smooth curve points from a series of control points.
 * Uses quadratic Bezier curves between consecutive points with automatic
 * control point calculation for smooth transitions.
 * 
 * @param controlPoints Array of control points (mouse positions)
 * @param tension Controls the curvature (0-1, higher = more curved)
 * @param minSegmentLength Minimum distance between points before generating curve
 * @returns Array of points along the smooth curve
 */
export function smoothCurve(
    controlPoints: Point[],
    tension: number = 0.5,
    minSegmentLength: number = 1
): Point[] {
    if (controlPoints.length === 0) return [];
    if (controlPoints.length === 1) return [controlPoints[0]];
    if (controlPoints.length === 2) {
        // Simple line between two points
        const p0 = controlPoints[0];
        const p1 = controlPoints[1];
        const dist = distance(p0, p1);
        const numPoints = Math.max(2, Math.ceil(dist / minSegmentLength));
        return quadraticBezier(p0, p0, p1, numPoints - 1);
    }
    
    const result: Point[] = [];
    
    // Add first point
    result.push(controlPoints[0]);
    
    // Generate curves between consecutive points
    for (let i = 0; i < controlPoints.length - 1; i++) {
        const p0 = controlPoints[i];
        const p1 = controlPoints[i + 1];
        const dist = distance(p0, p1);
        
        // If points are very close, just add the end point
        if (dist < minSegmentLength) {
            if (i === controlPoints.length - 2) {
                result.push(p1);
            }
            continue;
        }
        
        // Calculate control point for smooth curve
        let controlPoint: Point;
        
        if (i === 0) {
            // First segment: use next point to determine direction
            const p2 = controlPoints[i + 2] || p1;
            const dx = (p2.x - p0.x) * tension;
            const dy = (p2.y - p0.y) * tension;
            controlPoint = {
                x: p0.x + dx,
                y: p0.y + dy,
            };
        } else if (i === controlPoints.length - 2) {
            // Last segment: use previous point to determine direction
            const pPrev = controlPoints[i - 1];
            const dx = (p1.x - pPrev.x) * tension;
            const dy = (p1.y - pPrev.y) * tension;
            controlPoint = {
                x: p0.x + dx,
                y: p0.y + dy,
            };
        } else {
            // Middle segments: use both previous and next points
            const pPrev = controlPoints[i - 1];
            const pNext = controlPoints[i + 2] || p1;
            const dx = (pNext.x - pPrev.x) * tension;
            const dy = (pNext.y - pPrev.y) * tension;
            controlPoint = {
                x: p0.x + dx,
                y: p0.y + dy,
            };
        }
        
        // Generate points along the curve
        const numPoints = Math.max(2, Math.ceil(dist / minSegmentLength));
        const curvePoints = quadraticBezier(p0, controlPoint, p1, numPoints - 1);
        
        // Add curve points (skip first since it's the same as p0)
        for (let j = 1; j < curvePoints.length; j++) {
            result.push(curvePoints[j]);
        }
    }
    
    return result;
}

/**
 * Generate smooth curve points with adaptive density based on distance.
 * Points that are further apart get more interpolated points.
 * 
 * @param controlPoints Array of control points
 * @param tension Controls the curvature (0-1)
 * @param pointsPerPixel How many points to generate per pixel of distance
 * @returns Array of points along the smooth curve
 */
export function smoothCurveAdaptive(
    controlPoints: Point[],
    tension: number = 0.5,
    pointsPerPixel: number = 2
): Point[] {
    if (controlPoints.length === 0) return [];
    if (controlPoints.length === 1) return [controlPoints[0]];
    if (controlPoints.length === 2) {
        const p0 = controlPoints[0];
        const p1 = controlPoints[1];
        const dist = distance(p0, p1);
        const numPoints = Math.max(2, Math.ceil(dist * pointsPerPixel));
        return quadraticBezier(p0, p0, p1, numPoints - 1);
    }
    
    const result: Point[] = [];
    result.push(controlPoints[0]);
    
    for (let i = 0; i < controlPoints.length - 1; i++) {
        const p0 = controlPoints[i];
        const p1 = controlPoints[i + 1];
        const dist = distance(p0, p1);
        
        if (dist < 0.5) {
            if (i === controlPoints.length - 2) {
                result.push(p1);
            }
            continue;
        }
        
        // Calculate control point
        let controlPoint: Point;
        
        if (i === 0) {
            const p2 = controlPoints[i + 2] || p1;
            const dx = (p2.x - p0.x) * tension;
            const dy = (p2.y - p0.y) * tension;
            controlPoint = { x: p0.x + dx, y: p0.y + dy };
        } else if (i === controlPoints.length - 2) {
            const pPrev = controlPoints[i - 1];
            const dx = (p1.x - pPrev.x) * tension;
            const dy = (p1.y - pPrev.y) * tension;
            controlPoint = { x: p0.x + dx, y: p0.y + dy };
        } else {
            const pPrev = controlPoints[i - 1];
            const pNext = controlPoints[i + 2] || p1;
            const dx = (pNext.x - pPrev.x) * tension;
            const dy = (pNext.y - pPrev.y) * tension;
            controlPoint = { x: p0.x + dx, y: p0.y + dy };
        }
        
        // Generate points based on distance
        const numPoints = Math.max(2, Math.ceil(dist * pointsPerPixel));
        const curvePoints = quadraticBezier(p0, controlPoint, p1, numPoints - 1);
        
        for (let j = 1; j < curvePoints.length; j++) {
            result.push(curvePoints[j]);
        }
    }
    
    return result;
}

