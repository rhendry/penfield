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
    /** Pixel data: key is "x,y", value is color string */
    pixels?: Record<string, string>;
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
    pixels = {},
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
    
    // Clamp pan to boundaries
    // Pan coordinates are in screen space. ViewBox shows canvas coordinates.
    // Canvas goes from -halfSize to +halfSize.
    // viewBoxX = -panX/zoom, viewBoxWidth = containerWidth/zoom
    // We want: -halfSize <= viewBoxX and viewBoxX + viewBoxWidth <= halfSize
    // So: -halfSize <= -panX/zoom → panX <= halfSize * zoom
    // And: -panX/zoom + containerWidth/zoom <= halfSize → panX >= containerWidth - halfSize * zoom
    const clampPan = useCallback((x: number, y: number, currentZoom: number, containerWidth: number, containerHeight: number) => {
        const halfSize = maxSize / 2;
        
        // Clamp panX: ensure viewBox stays within [-halfSize, halfSize]
        const minPanX = containerWidth - halfSize * currentZoom;
        const maxPanX = halfSize * currentZoom;
        
        // Clamp panY similarly
        const minPanY = containerHeight - halfSize * currentZoom;
        const maxPanY = halfSize * currentZoom;
        
        return {
            x: Math.max(minPanX, Math.min(maxPanX, x)),
            y: Math.max(minPanY, Math.min(maxPanY, y)),
        };
    }, [maxSize]);
    
    // Update container size and calculate initial zoom
    useEffect(() => {
        const updateSize = () => {
            if (!containerRef.current) return;
            const width = containerRef.current.clientWidth || 800;
            const height = containerRef.current.clientHeight || 600;
            setContainerSize({ width, height });
            
            // Calculate initial zoom to show defaultZoomPixels in vertical dimension (only once)
            if (!isInitialized && height > 0 && width > 0) {
                const initialZoom = height / defaultZoomPixels;
                // Max zoom ensures the entire canvas fits (use smaller ratio)
                const maxZoom = Math.min(width / maxSize, height / maxSize);
                const clampedZoom = Math.max(maxZoom, initialZoom);
                setZoom(clampedZoom);
                // Center the view at origin (0, 0)
                // When panX = width/2, viewBoxX = -width/(2*zoom), showing center at 0
                const initialPanX = width / 2;
                const initialPanY = height / 2;
                // Clamp to ensure we stay within boundaries
                const halfSize = maxSize / 2;
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
    }, [defaultZoomPixels, isInitialized, maxSize]);
    
    // Calculate max zoom to prevent seeing beyond boundaries
    const calculateMaxZoom = useCallback(() => {
        if (!containerRef.current) return 100;
        const containerWidth = containerRef.current.clientWidth || 800;
        const containerHeight = containerRef.current.clientHeight || 600;
        // Max zoom should ensure at least one dimension fits the full canvas
        // Use the smaller ratio to ensure the entire canvas is visible
        return Math.min(containerWidth / maxSize, containerHeight / maxSize);
    }, [maxSize]);
    
    // Handle mousewheel zoom
    const handleWheel = useCallback((e: WheelEvent) => {
        e.preventDefault();
        
        if (!containerRef.current || !svgRef.current) return;
        
        const rect = containerRef.current.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        // Zoom factor
        const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
        const maxZoom = calculateMaxZoom();
        const newZoom = Math.max(maxZoom, Math.min(100, zoom * zoomFactor));
        
        // Calculate mouse position in canvas coordinates before zoom
        const canvasX = (mouseX - panX) / zoom;
        const canvasY = (mouseY - panY) / zoom;
        
        // Adjust pan to zoom towards mouse position
        let newPanX = mouseX - canvasX * newZoom;
        let newPanY = mouseY - canvasY * newZoom;
        
        // Clamp pan to boundaries
        const clamped = clampPan(newPanX, newPanY, newZoom, rect.width, rect.height);
        
        setZoom(newZoom);
        setPanX(clamped.x);
        setPanY(clamped.y);
    }, [zoom, panX, panY, clampPan, calculateMaxZoom]);
    
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
        if (!isPanning || !containerRef.current) return;
        
        const newPanX = e.clientX - panStart.x;
        const newPanY = e.clientY - panStart.y;
        
        // Clamp pan to boundaries
        const rect = containerRef.current.getBoundingClientRect();
        const clamped = clampPan(newPanX, newPanY, zoom, rect.width, rect.height);
        
        setPanX(clamped.x);
        setPanY(clamped.y);
    }, [isPanning, panStart, zoom, clampPan]);
    
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
                
                {/* Render pixels */}
                {Object.entries(pixels).map(([key, color]) => {
                    const [x, y] = key.split(",").map(Number);
                    // Only render visible pixels
                    if (x < clampedStartX || x > clampedEndX || y < clampedStartY || y > clampedEndY) {
                        return null;
                    }
                    return (
                        <rect
                            key={`pixel-${key}`}
                            x={x}
                            y={y}
                            width={1}
                            height={1}
                            fill={color}
                        />
                    );
                })}
            </svg>
        </div>
    );
}

