import { useRef, useState, useEffect, useCallback, useImperativeHandle, forwardRef } from "react";
import { cn } from "@/lib/utils";
import type { PixelDelta } from "@/tools/types";

export interface PixelCanvasProps {
    /** Maximum canvas size in pixels (width and height) */
    maxSize?: number;
    /** Default zoom level - number of pixels visible in vertical dimension */
    defaultZoomPixels?: number;
    /** Background color */
    backgroundColor?: string;
    /** Color for grid lines (non-axis) */
    gridLineColor?: string;
    /** Color for x-axis line */
    xAxisColor?: string;
    /** Color for y-axis line */
    yAxisColor?: string;
    /** Callback when a pixel is clicked */
    onPixelClick?: (x: number, y: number, button: "left" | "right") => void;
    /** Callback when dragging over pixels */
    onPixelDrag?: (x: number, y: number, button: "left" | "right") => void;
    /** Callback when mouse is released */
    onMouseUp?: () => void;
    /** Additional className */
    className?: string;
}

/**
 * Imperative handle exposed by PixelCanvas
 */
export interface PixelCanvasHandle {
    /** Get pixel color at coordinates (null if empty) */
    getPixel: (x: number, y: number) => string | null;
    /** Apply pixel changes - pass color to set, null to clear */
    applyPixels: (delta: PixelDelta) => void;
    /** Trigger a render (call after applyPixels if batching) */
    render: () => void;
    /** Get all pixels as a Record (for serialization) */
    getAllPixels: () => Record<string, string>;
    /** Clear all pixels */
    clear: () => void;
    /** Load pixels from a Record (for deserialization) */
    loadPixels: (pixels: Record<string, string>) => void;
}

/**
 * Parse a CSS color string to RGBA values (0-255)
 */
function parseColor(color: string): [number, number, number, number] {
    // Handle rgba/rgb
    const rgbaMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
    if (rgbaMatch) {
        return [
            parseInt(rgbaMatch[1], 10),
            parseInt(rgbaMatch[2], 10),
            parseInt(rgbaMatch[3], 10),
            rgbaMatch[4] ? Math.round(parseFloat(rgbaMatch[4]) * 255) : 255
        ];
    }
    
    // Handle hex colors
    let hex = color;
    if (hex.startsWith('#')) {
        hex = hex.slice(1);
    }
    
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
    
    // Fallback to black
    return [0, 0, 0, 255];
}

/**
 * Convert RGBA values to a CSS color string
 */
function rgbaToString(r: number, g: number, b: number, a: number): string {
    if (a === 255) {
        return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    }
    return `rgba(${r},${g},${b},${(a / 255).toFixed(2)})`;
}

/**
 * PixelCanvas - Infinite zoomable, pannable grid for creating pixel art.
 * Uses ImageData as source of truth for efficient pixel operations.
 * Supports mousewheel zoom and middle-click drag panning.
 */
export const PixelCanvas = forwardRef<PixelCanvasHandle, PixelCanvasProps>(function PixelCanvas({
    maxSize = 1000,
    defaultZoomPixels = 50,
    backgroundColor = "#ffffff",
    gridLineColor = "#e5e5e5",
    xAxisColor = "#3b82f6",
    yAxisColor = "#3b82f6",
    onPixelClick,
    onPixelDrag,
    onMouseUp,
    className,
}, ref) {
    const containerRef = useRef<HTMLDivElement>(null);
    const svgRef = useRef<SVGSVGElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    
    // ImageData is the source of truth for pixel data
    const imageDataRef = useRef<ImageData | null>(null);
    const needsRenderRef = useRef(false);
    const renderScheduledRef = useRef(false);
    
    // Get container dimensions
    const [containerSize, setContainerSize] = useState({ width: 800, height: 600 });
    
    // View state: zoom and pan
    const [zoom, setZoom] = useState(1);
    const [panX, setPanX] = useState(0);
    const [panY, setPanY] = useState(0);
    
    // Pan state
    const [isPanning, setIsPanning] = useState(false);
    const [panStart, setPanStart] = useState({ x: 0, y: 0 });
    
    // Drawing state
    const [isDrawing, setIsDrawing] = useState(false);
    const [drawButton, setDrawButton] = useState<"left" | "right" | null>(null);
    
    // Track if we've initialized
    const [isInitialized, setIsInitialized] = useState(false);
    
    // Force re-render trigger
    const [renderTrigger, setRenderTrigger] = useState(0);
    
    const halfSize = maxSize / 2;
    
    // Initialize ImageData
    useEffect(() => {
        imageDataRef.current = new ImageData(maxSize, maxSize);
        return () => {
            imageDataRef.current = null;
        };
    }, [maxSize]);
    
    // Clamp pan to boundaries
    const clampPan = useCallback((x: number, y: number, currentZoom: number, containerWidth: number, containerHeight: number) => {
        const minPanX = containerWidth - halfSize * currentZoom;
        const maxPanX = halfSize * currentZoom;
        const minPanY = containerHeight - halfSize * currentZoom;
        const maxPanY = halfSize * currentZoom;
        
        return {
            x: Math.max(minPanX, Math.min(maxPanX, x)),
            y: Math.max(minPanY, Math.min(maxPanY, y)),
        };
    }, [halfSize]);
    
    // Update container size and calculate initial zoom
    useEffect(() => {
        const updateSize = () => {
            if (!containerRef.current) return;
            const width = containerRef.current.clientWidth || 800;
            const height = containerRef.current.clientHeight || 600;
            setContainerSize({ width, height });
            
            if (!isInitialized && height > 0 && width > 0) {
                const initialZoom = height / defaultZoomPixels;
                const maxZoomOut = Math.min(width / maxSize, height / maxSize);
                const clampedZoom = Math.max(maxZoomOut, initialZoom);
                setZoom(clampedZoom);
                
                const initialPanX = width / 2;
                const initialPanY = height / 2;
                const minPanX = width - halfSize * clampedZoom;
                const maxPanX = halfSize * clampedZoom;
                const minPanY = height - halfSize * clampedZoom;
                const maxPanY = halfSize * clampedZoom;
                setPanX(Math.max(minPanX, Math.min(maxPanX, initialPanX)));
                setPanY(Math.max(minPanY, Math.min(maxPanY, initialPanY)));
                setIsInitialized(true);
            }
        };
        
        updateSize();
        
        const resizeObserver = new ResizeObserver(updateSize);
        if (containerRef.current) {
            resizeObserver.observe(containerRef.current);
        }
        
        window.addEventListener("resize", updateSize);
        return () => {
            resizeObserver.disconnect();
            window.removeEventListener("resize", updateSize);
        };
    }, [defaultZoomPixels, isInitialized, maxSize, halfSize]);
    
    // Calculate max zoom to prevent seeing beyond boundaries
    const calculateMaxZoom = useCallback(() => {
        if (!containerRef.current) return 100;
        const containerWidth = containerRef.current.clientWidth || 800;
        const containerHeight = containerRef.current.clientHeight || 600;
        return Math.min(containerWidth / maxSize, containerHeight / maxSize);
    }, [maxSize]);
    
    // Get pixel color from ImageData
    const getPixel = useCallback((x: number, y: number): string | null => {
        const imageData = imageDataRef.current;
        if (!imageData) return null;
        
        // Convert from centered coords to ImageData coords
        const imgX = x + halfSize;
        const imgY = y + halfSize;
        
        if (imgX < 0 || imgX >= maxSize || imgY < 0 || imgY >= maxSize) {
            return null;
        }
        
        const idx = (imgY * maxSize + imgX) * 4;
        const r = imageData.data[idx];
        const g = imageData.data[idx + 1];
        const b = imageData.data[idx + 2];
        const a = imageData.data[idx + 3];
        
        if (a === 0) return null;
        
        return rgbaToString(r, g, b, a);
    }, [halfSize, maxSize]);
    
    // Apply pixel delta to ImageData
    const applyPixels = useCallback((delta: PixelDelta) => {
        const imageData = imageDataRef.current;
        if (!imageData) return;
        
        for (const key in delta) {
            const commaIdx = key.indexOf(",");
            const x = parseInt(key.slice(0, commaIdx), 10);
            const y = parseInt(key.slice(commaIdx + 1), 10);
            
            const imgX = x + halfSize;
            const imgY = y + halfSize;
            
            if (imgX < 0 || imgX >= maxSize || imgY < 0 || imgY >= maxSize) {
                continue;
            }
            
            const idx = (imgY * maxSize + imgX) * 4;
            const color = delta[key];
            
            if (color === null) {
                // Clear pixel
                imageData.data[idx] = 0;
                imageData.data[idx + 1] = 0;
                imageData.data[idx + 2] = 0;
                imageData.data[idx + 3] = 0;
            } else {
                const [r, g, b, a] = parseColor(color);
                imageData.data[idx] = r;
                imageData.data[idx + 1] = g;
                imageData.data[idx + 2] = b;
                imageData.data[idx + 3] = a;
            }
        }
        
        needsRenderRef.current = true;
        
        // Auto-schedule render if not already scheduled
        if (!renderScheduledRef.current) {
            renderScheduledRef.current = true;
            requestAnimationFrame(() => {
                renderScheduledRef.current = false;
                if (needsRenderRef.current) {
                    needsRenderRef.current = false;
                    setRenderTrigger(t => t + 1);
                }
            });
        }
    }, [halfSize, maxSize]);
    
    // Force render
    const render = useCallback(() => {
        setRenderTrigger(t => t + 1);
    }, []);
    
    // Get all pixels as Record (for serialization)
    const getAllPixels = useCallback((): Record<string, string> => {
        const imageData = imageDataRef.current;
        if (!imageData) return {};
        
        const result: Record<string, string> = {};
        
        for (let y = 0; y < maxSize; y++) {
            for (let x = 0; x < maxSize; x++) {
                const idx = (y * maxSize + x) * 4;
                const a = imageData.data[idx + 3];
                
                if (a > 0) {
                    const r = imageData.data[idx];
                    const g = imageData.data[idx + 1];
                    const b = imageData.data[idx + 2];
                    const canvasX = x - halfSize;
                    const canvasY = y - halfSize;
                    result[`${canvasX},${canvasY}`] = rgbaToString(r, g, b, a);
                }
            }
        }
        
        return result;
    }, [maxSize, halfSize]);
    
    // Clear all pixels
    const clear = useCallback(() => {
        const imageData = imageDataRef.current;
        if (!imageData) return;
        
        imageData.data.fill(0);
        setRenderTrigger(t => t + 1);
    }, []);
    
    // Load pixels from Record
    const loadPixels = useCallback((pixels: Record<string, string>) => {
        const imageData = imageDataRef.current;
        if (!imageData) return;
        
        // Clear first
        imageData.data.fill(0);
        
        // Load pixels
        for (const key in pixels) {
            const commaIdx = key.indexOf(",");
            const x = parseInt(key.slice(0, commaIdx), 10);
            const y = parseInt(key.slice(commaIdx + 1), 10);
            
            const imgX = x + halfSize;
            const imgY = y + halfSize;
            
            if (imgX < 0 || imgX >= maxSize || imgY < 0 || imgY >= maxSize) {
                continue;
            }
            
            const idx = (imgY * maxSize + imgX) * 4;
            const [r, g, b, a] = parseColor(pixels[key]);
            imageData.data[idx] = r;
            imageData.data[idx + 1] = g;
            imageData.data[idx + 2] = b;
            imageData.data[idx + 3] = a;
        }
        
        setRenderTrigger(t => t + 1);
    }, [halfSize, maxSize]);
    
    // Expose imperative handle
    useImperativeHandle(ref, () => ({
        getPixel,
        applyPixels,
        render,
        getAllPixels,
        clear,
        loadPixels,
    }), [getPixel, applyPixels, render, getAllPixels, clear, loadPixels]);
    
    // Handle mousewheel zoom
    const handleWheel = useCallback((e: WheelEvent) => {
        e.preventDefault();
        
        if (!containerRef.current || !svgRef.current) return;
        
        const rect = containerRef.current.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
        const maxZoomOut = calculateMaxZoom();
        const newZoom = Math.max(maxZoomOut, Math.min(100, zoom * zoomFactor));
        
        const canvasX = (mouseX - panX) / zoom;
        const canvasY = (mouseY - panY) / zoom;
        
        let newPanX = mouseX - canvasX * newZoom;
        let newPanY = mouseY - canvasY * newZoom;
        
        const clamped = clampPan(newPanX, newPanY, newZoom, rect.width, rect.height);
        
        const panChangedX = Math.abs(clamped.x - newPanX) > 1;
        const panChangedY = Math.abs(clamped.y - newPanY) > 1;
        
        if (panChangedX || panChangedY) {
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            const centerCanvasX = (-panX + centerX) / zoom;
            const centerCanvasY = (-panY + centerY) / zoom;
            
            const centeredPanX = centerX - centerCanvasX * newZoom;
            const centeredPanY = centerY - centerCanvasY * newZoom;
            
            const centeredClamped = clampPan(centeredPanX, centeredPanY, newZoom, rect.width, rect.height);
            
            setZoom(newZoom);
            setPanX(centeredClamped.x);
            setPanY(centeredClamped.y);
        } else {
            setZoom(newZoom);
            setPanX(clamped.x);
            setPanY(clamped.y);
        }
    }, [zoom, panX, panY, clampPan, calculateMaxZoom]);
    
    // Convert screen coordinates to canvas coordinates
    const screenToCanvas = useCallback((screenX: number, screenY: number): { x: number; y: number } | null => {
        if (!containerRef.current) return null;
        const rect = containerRef.current.getBoundingClientRect();
        const mouseX = screenX - rect.left;
        const mouseY = screenY - rect.top;
        const canvasX = Math.floor((-panX + mouseX) / zoom);
        const canvasY = Math.floor((-panY + mouseY) / zoom);
        return { x: canvasX, y: canvasY };
    }, [panX, panY, zoom]);

    // Handle mouse down
    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        if (e.button === 1) {
            e.preventDefault();
            e.stopPropagation();
            setIsPanning(true);
            setPanStart({
                x: e.clientX - panX,
                y: e.clientY - panY,
            });
        } else if (e.button === 0 || e.button === 2) {
            e.preventDefault();
            e.stopPropagation();
            const button = e.button === 0 ? "left" : "right";
            setIsDrawing(true);
            setDrawButton(button);
            
            const coords = screenToCanvas(e.clientX, e.clientY);
            if (coords && onPixelClick) {
                onPixelClick(coords.x, coords.y, button);
            }
        }
    }, [panX, panY, screenToCanvas, onPixelClick]);
    
    // Prevent middle mouse button scroll
    useEffect(() => {
        const handleAuxClick = (e: MouseEvent) => {
            if (e.button === 1) {
                e.preventDefault();
            }
        };
        
        const container = containerRef.current;
        if (!container) return;
        
        container.addEventListener("auxclick", handleAuxClick);
        return () => container.removeEventListener("auxclick", handleAuxClick);
    }, []);
    
    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (isPanning && containerRef.current) {
            const newPanX = e.clientX - panStart.x;
            const newPanY = e.clientY - panStart.y;
            
            const rect = containerRef.current.getBoundingClientRect();
            const clamped = clampPan(newPanX, newPanY, zoom, rect.width, rect.height);
            
            setPanX(clamped.x);
            setPanY(clamped.y);
        } else if (isDrawing && drawButton && onPixelDrag) {
            const coords = screenToCanvas(e.clientX, e.clientY);
            if (coords) {
                onPixelDrag(coords.x, coords.y, drawButton);
            }
        }
    }, [isPanning, panStart, zoom, clampPan, isDrawing, drawButton, onPixelDrag, screenToCanvas]);
    
    const handleMouseUp = useCallback(() => {
        setIsPanning(false);
        setIsDrawing(false);
        setDrawButton(null);
        if (onMouseUp) {
            onMouseUp();
        }
    }, [onMouseUp]);
    
    // Set up event listeners
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;
        
        container.addEventListener("wheel", handleWheel, { passive: false });
        window.addEventListener("mousemove", handleMouseMove);
        window.addEventListener("mouseup", handleMouseUp);
        
        return () => {
            container.removeEventListener("wheel", handleWheel);
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseup", handleMouseUp);
        };
    }, [handleWheel, handleMouseMove, handleMouseUp]);
    
    // Calculate visible range
    const startX = Math.floor((-panX / zoom) - 1);
    const endX = Math.ceil((-panX + containerSize.width) / zoom + 1);
    const startY = Math.floor((-panY / zoom) - 1);
    const endY = Math.ceil((-panY + containerSize.height) / zoom + 1);
    
    const clampedStartX = Math.max(-halfSize, startX);
    const clampedEndX = Math.min(halfSize, endX);
    const clampedStartY = Math.max(-halfSize, startY);
    const clampedEndY = Math.min(halfSize, endY);
    
    const numVerticalLines = Math.max(0, clampedEndX - clampedStartX + 1);
    const numHorizontalLines = Math.max(0, clampedEndY - clampedStartY + 1);
    
    const viewBoxX = -panX / zoom;
    const viewBoxY = -panY / zoom;
    const viewBoxWidth = containerSize.width / zoom;
    const viewBoxHeight = containerSize.height / zoom;
    
    // Render ImageData to display canvas
    useEffect(() => {
        const canvas = canvasRef.current;
        const imageData = imageDataRef.current;
        if (!canvas || !imageData) return;
        
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        
        const dpr = window.devicePixelRatio || 1;
        const displayWidth = containerSize.width;
        const displayHeight = containerSize.height;
        
        canvas.width = displayWidth * dpr;
        canvas.height = displayHeight * dpr;
        ctx.scale(dpr, dpr);
        ctx.imageSmoothingEnabled = false;
        
        ctx.clearRect(0, 0, displayWidth, displayHeight);
        
        // Create temporary canvas for ImageData
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = maxSize;
        tempCanvas.height = maxSize;
        const tempCtx = tempCanvas.getContext('2d');
        if (!tempCtx) return;
        
        tempCtx.putImageData(imageData, 0, 0);
        
        // Calculate source rect
        const srcX = viewBoxX + halfSize;
        const srcY = viewBoxY + halfSize;
        const srcWidth = viewBoxWidth;
        const srcHeight = viewBoxHeight;
        
        ctx.drawImage(
            tempCanvas,
            srcX, srcY, srcWidth, srcHeight,
            0, 0, displayWidth, displayHeight
        );
    }, [renderTrigger, zoom, panX, panY, containerSize, viewBoxX, viewBoxY, viewBoxWidth, viewBoxHeight, maxSize, halfSize]);

    return (
        <div
            ref={containerRef}
            className={cn("w-full h-full overflow-hidden relative", className)}
            style={{ backgroundColor, width: "100%", height: "100%" }}
            onMouseDown={handleMouseDown}
            onContextMenu={(e) => e.preventDefault()}
        >
            <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full"
                style={{ pointerEvents: "none" }}
            />
            
            <svg
                ref={svgRef}
                className="absolute inset-0 w-full h-full"
                viewBox={zoom > 0 && containerSize.width > 0 && containerSize.height > 0 
                    ? `${viewBoxX} ${viewBoxY} ${viewBoxWidth} ${viewBoxHeight}`
                    : `-25 -25 50 50`}
                preserveAspectRatio="none"
                style={{ pointerEvents: "none" }}
            >
                {numVerticalLines > 0 && Array.from({ length: numVerticalLines }, (_, i) => {
                    const x = clampedStartX + i;
                    const isAxis = x === 0;
                    const strokeWidth = isAxis ? 0.02 : 0.01;
                    return (
                        <line
                            key={`v-${x}`}
                            x1={x}
                            y1={clampedStartY}
                            x2={x}
                            y2={clampedEndY}
                            stroke={isAxis ? yAxisColor : gridLineColor}
                            strokeWidth={strokeWidth}
                        />
                    );
                })}
                
                {numHorizontalLines > 0 && Array.from({ length: numHorizontalLines }, (_, i) => {
                    const y = clampedStartY + i;
                    const isAxis = y === 0;
                    const strokeWidth = isAxis ? 0.02 : 0.01;
                    return (
                        <line
                            key={`h-${y}`}
                            x1={clampedStartX}
                            y1={y}
                            x2={clampedEndX}
                            y2={y}
                            stroke={isAxis ? xAxisColor : gridLineColor}
                            strokeWidth={strokeWidth}
                        />
                    );
                })}
            </svg>
        </div>
    );
});
