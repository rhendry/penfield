import { useRef, useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";

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
    /** Additional className */
    className?: string;
}

/**
 * PixelCanvas - Infinite zoomable, pannable grid for creating pixel art.
 * Supports mousewheel zoom and middle-click drag panning.
 */
export function PixelCanvas({
    maxSize = 1000,
    defaultZoomPixels = 50,
    backgroundColor = "#ffffff",
    gridLineColor = "#e5e5e5",
    xAxisColor = "#3b82f6",
    yAxisColor = "#3b82f6",
    className,
}: PixelCanvasProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const svgRef = useRef<SVGSVGElement>(null);
    
    // Get container dimensions
    const [containerSize, setContainerSize] = useState({ width: 800, height: 600 });
    
    // View state: zoom and pan
    const [zoom, setZoom] = useState(1);
    const [panX, setPanX] = useState(0);
    const [panY, setPanY] = useState(0);
    
    // Pan state
    const [isPanning, setIsPanning] = useState(false);
    const [panStart, setPanStart] = useState({ x: 0, y: 0 });
    
    // Track if we've initialized
    const [isInitialized, setIsInitialized] = useState(false);
    
    // Update container size and calculate initial zoom
    useEffect(() => {
        const updateSize = () => {
            if (!containerRef.current) return;
            const width = containerRef.current.clientWidth || 800;
            const height = containerRef.current.clientHeight || 600;
            setContainerSize({ width, height });
            
            // Calculate initial zoom to show defaultZoomPixels in vertical dimension (only once)
            if (!isInitialized && height > 0) {
                const initialZoom = height / defaultZoomPixels;
                setZoom(initialZoom);
                // Center the view at origin (0, 0)
                setPanX(width / 2);
                setPanY(height / 2);
                setIsInitialized(true);
            }
        };
        
        updateSize();
        
        // Use ResizeObserver for better size tracking
        const resizeObserver = new ResizeObserver(updateSize);
        if (containerRef.current) {
            resizeObserver.observe(containerRef.current);
        }
        
        window.addEventListener("resize", updateSize);
        return () => {
            resizeObserver.disconnect();
            window.removeEventListener("resize", updateSize);
        };
    }, [defaultZoomPixels, isInitialized]);
    
    // Handle mousewheel zoom
    const handleWheel = useCallback((e: WheelEvent) => {
        e.preventDefault();
        
        if (!containerRef.current || !svgRef.current) return;
        
        const rect = containerRef.current.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        // Zoom factor
        const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
        const newZoom = Math.max(0.1, Math.min(100, zoom * zoomFactor));
        
        // Calculate mouse position in canvas coordinates before zoom
        const canvasX = (mouseX - panX) / zoom;
        const canvasY = (mouseY - panY) / zoom;
        
        // Adjust pan to zoom towards mouse position
        const newPanX = mouseX - canvasX * newZoom;
        const newPanY = mouseY - canvasY * newZoom;
        
        setZoom(newZoom);
        setPanX(newPanX);
        setPanY(newPanY);
    }, [zoom, panX, panY]);
    
    // Handle middle mouse button pan
    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        if (e.button === 1) { // Middle mouse button
            e.preventDefault();
            e.stopPropagation();
            setIsPanning(true);
            setPanStart({
                x: e.clientX - panX,
                y: e.clientY - panY,
            });
        }
    }, [panX, panY]);
    
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
        if (!isPanning) return;
        
        setPanX(e.clientX - panStart.x);
        setPanY(e.clientY - panStart.y);
    }, [isPanning, panStart]);
    
    const handleMouseUp = useCallback(() => {
        setIsPanning(false);
    }, []);
    
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
    
    // Calculate grid dimensions
    const gridSize = maxSize;
    const halfSize = gridSize / 2;
    
    // Calculate visible range in canvas coordinates
    // Convert screen coordinates to canvas coordinates
    const startX = Math.floor((-panX / zoom) - 1);
    const endX = Math.ceil((-panX + containerSize.width) / zoom + 1);
    const startY = Math.floor((-panY / zoom) - 1);
    const endY = Math.ceil((-panY + containerSize.height) / zoom + 1);
    
    // Clamp to canvas bounds
    const clampedStartX = Math.max(-halfSize, startX);
    const clampedEndX = Math.min(halfSize, endX);
    const clampedStartY = Math.max(-halfSize, startY);
    const clampedEndY = Math.min(halfSize, endY);
    
    // Ensure we have valid ranges
    const numVerticalLines = Math.max(0, clampedEndX - clampedStartX + 1);
    const numHorizontalLines = Math.max(0, clampedEndY - clampedStartY + 1);
    
    // Calculate the viewBox and transform for the SVG coordinate system
    // We want to show canvas coordinates, so we transform the viewBox
    const viewBoxX = -panX / zoom;
    const viewBoxY = -panY / zoom;
    const viewBoxWidth = containerSize.width / zoom;
    const viewBoxHeight = containerSize.height / zoom;

    return (
        <div
            ref={containerRef}
            className={cn("w-full h-full overflow-hidden relative", className)}
            style={{ backgroundColor, width: "100%", height: "100%" }}
            onMouseDown={handleMouseDown}
            onContextMenu={(e) => e.preventDefault()} // Prevent context menu on middle click
        >
            <svg
                ref={svgRef}
                className="absolute inset-0 w-full h-full"
                viewBox={zoom > 0 && containerSize.width > 0 && containerSize.height > 0 
                    ? `${viewBoxX} ${viewBoxY} ${viewBoxWidth} ${viewBoxHeight}`
                    : `-25 -25 50 50`}
                preserveAspectRatio="none"
            >
                {/* Grid lines - vertical */}
                {numVerticalLines > 0 && Array.from({ length: numVerticalLines }, (_, i) => {
                    const x = clampedStartX + i;
                    const isAxis = x === 0;
                    // Stroke width in canvas coordinates (will scale with viewBox)
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
                
                {/* Grid lines - horizontal */}
                {numHorizontalLines > 0 && Array.from({ length: numHorizontalLines }, (_, i) => {
                    const y = clampedStartY + i;
                    const isAxis = y === 0;
                    // Stroke width in canvas coordinates (will scale with viewBox)
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
}

