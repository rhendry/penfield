import { useRef, useState, useEffect, useCallback, useImperativeHandle, forwardRef } from "react";
import { cn } from "@/lib/utils";
import { PixelCanvas, PixelCanvasHandle } from "./pixel-canvas";
import { renderAssetContent } from "./rendering-utils";
import { useRenderContext } from "./render-context";
import type { PixelAssetContent } from "@shared/types/pixel-asset";

export interface MultiLayerCanvasProps {
  /** Maximum canvas size in pixels (width and height) */
  maxSize?: number;
  /** Default zoom level - number of pixels visible in vertical dimension */
  defaultZoomPixels?: number;
  /** Background color for the pixel canvas area */
  backgroundColor?: string;
  /** Background color for the area outside the canvas */
  outerBackgroundColor?: string;
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
 * Imperative handle exposed by MultiLayerCanvas
 */
export interface MultiLayerCanvasHandle {
  /** Get pixel color at coordinates (null if empty) */
  getPixel: (x: number, y: number) => string | null;
  /** Get full pixel data as ImageData (for bulk reads like flood fill) */
  getPixelData: () => ImageData | null;
  /** Trigger a render */
  render: () => void;
  /** Get all pixels as a Record (for serialization) */
  getAllPixels: () => Record<string, string>;
}

/**
 * MultiLayerCanvas - Renders PixelAssetContent with objects (which are the layers), transforms, and effects
 * Uses PixelCanvas internally for rendering and interaction
 */
export const MultiLayerCanvas = forwardRef<MultiLayerCanvasHandle, MultiLayerCanvasProps>(
  function MultiLayerCanvas(
    {
      maxSize = 256,
      defaultZoomPixels = 50,
      backgroundColor = "#ffffff",
      outerBackgroundColor = "#1a1a1a",
      gridLineColor = "#e5e5e5",
      xAxisColor = "#3b82f6",
      yAxisColor = "#3b82f6",
      onPixelClick,
      onPixelDrag,
      onMouseUp,
      className,
    },
    ref
  ) {
    const canvasRef = useRef<PixelCanvasHandle>(null);
    const renderContext = useRenderContext();
    const [renderedPixels, setRenderedPixels] = useState<Record<string, string>>({});
    const halfSize = maxSize / 2;

    // Render content to pixels whenever content changes
    const renderContent = useCallback(() => {
      const content = renderContext.content;
      const imageData = renderAssetContent(content, maxSize, halfSize);
      
      // Convert ImageData to pixel record
      const pixels: Record<string, string> = {};
      for (let y = 0; y < maxSize; y++) {
        for (let x = 0; x < maxSize; x++) {
          const idx = (y * maxSize + x) * 4;
          const a = imageData.data[idx + 3];
          if (a > 0) {
            const r = imageData.data[idx];
            const g = imageData.data[idx + 1];
            const b = imageData.data[idx + 2];
            const coordX = x - halfSize;
            const coordY = y - halfSize;
            const color = a === 255
              ? `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
              : `rgba(${r},${g},${b},${(a / 255).toFixed(2)})`;
            pixels[`${coordX},${coordY}`] = color;
          }
        }
      }
      
      setRenderedPixels(pixels);
      canvasRef.current?.loadPixels(pixels);
    }, [renderContext.content, maxSize, halfSize]);

    // Render when content changes
    useEffect(() => {
      renderContent();
    }, [renderContent]);

    // Expose imperative handle
    useImperativeHandle(
      ref,
      () => ({
        getPixel: (x: number, y: number) => {
          return canvasRef.current?.getPixel(x, y) ?? null;
        },
        getPixelData: () => {
          return canvasRef.current?.getPixelData() ?? null;
        },
        render: () => {
          renderContent();
        },
        getAllPixels: () => {
          return renderedPixels;
        },
      }),
      [renderContent, renderedPixels]
    );

    return (
      <PixelCanvas
        ref={canvasRef}
        maxSize={maxSize}
        defaultZoomPixels={defaultZoomPixels}
        backgroundColor={backgroundColor}
        outerBackgroundColor={outerBackgroundColor}
        gridLineColor={gridLineColor}
        xAxisColor={xAxisColor}
        yAxisColor={yAxisColor}
        onPixelClick={onPixelClick}
        onPixelDrag={onPixelDrag}
        onMouseUp={onMouseUp}
        className={className}
      />
    );
  }
);

