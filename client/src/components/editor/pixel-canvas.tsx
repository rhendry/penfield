import { useRef, useState, useEffect, useCallback, useImperativeHandle, forwardRef } from "react";
import { cn } from "@/lib/utils";
import type { PixelDelta } from "@/tools/types";
import type { PixelAssetContent } from "@shared/types/pixel-asset";
import { renderAssetContent } from "./rendering-utils";
import type { GridConfig } from "@/utils/frame-extraction";

export interface PixelCanvasProps {
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
    /** PixelAssetContent for object-based rendering */
    content?: PixelAssetContent;
    /** Callback when a pixel is clicked */
    onPixelClick?: (x: number, y: number, button: "left" | "right") => void;
    /** Callback when dragging over pixels */
    onPixelDrag?: (x: number, y: number, button: "left" | "right") => void;
    /** Callback when mouse is released */
    onMouseUp?: () => void;
    /** Animation grid configuration (for sprite animation tool) */
    gridConfig?: GridConfig;
    /** Additional className */
    className?: string;
}

/**
 * Imperative handle exposed by PixelCanvas
 */
export interface PixelCanvasHandle {
    /** Get pixel color at coordinates (null if empty) */
    getPixel: (x: number, y: number) => string | null;
    /** Get full pixel data as ImageData (for bulk reads like flood fill) */
    getPixelData: () => ImageData | null;
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
 * Convert RGBA values to a CSS color string
 */
function rgbaToString(r: number, g: number, b: number, a: number): string {
    if (a === 255) {
        return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    }
    return `rgba(${r},${g},${b},${(a / 255).toFixed(2)})`;
}

/**
 * WebGL shader for rendering pixel texture
 */
const vertexShaderSource = `
attribute vec2 a_position;
attribute vec2 a_texCoord;
varying vec2 v_texCoord;
uniform vec2 u_resolution;
uniform vec2 u_viewOffset;
uniform float u_zoom;

void main() {
    // Transform canvas coordinates to screen coordinates
    // screenX = canvasX * zoom + panX
    vec2 screenPos = a_position * u_zoom + u_viewOffset;
    
    // Transform screen coordinates to clip space (-1 to 1)
    vec2 clipPos = (screenPos / u_resolution) * 2.0 - 1.0;
    
    // Flip Y axis (WebGL Y is up, screen Y is down)
    gl_Position = vec4(clipPos.x, -clipPos.y, 0, 1);
    v_texCoord = a_texCoord;
}
`;

const fragmentShaderSource = `
precision mediump float;
uniform sampler2D u_texture;
varying vec2 v_texCoord;

void main() {
    gl_FragColor = texture2D(u_texture, v_texCoord);
}
`;

const solidColorFragmentShaderSource = `
precision mediump float;
uniform vec4 u_color;

void main() {
    gl_FragColor = u_color;
}
`;

/**
 * PixelCanvas - WebGL-based infinite zoomable, pannable grid for pixel art.
 * Uses WebGL texture for GPU-accelerated rendering.
 */
export const PixelCanvas = forwardRef<PixelCanvasHandle, PixelCanvasProps>(function PixelCanvas({
    maxSize = 256,
    defaultZoomPixels = 50,
    backgroundColor = "#ffffff",
    outerBackgroundColor = "#1a1a1a",
    gridLineColor = "#e5e5e5",
    xAxisColor = "#3b82f6",
    yAxisColor = "#3b82f6",
    content,
    onPixelClick,
    onPixelDrag,
    onMouseUp,
    gridConfig,
    className,
}, ref) {
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const svgRef = useRef<SVGSVGElement>(null);

    // WebGL context and resources
    const glRef = useRef<WebGLRenderingContext | null>(null);
    const textureRef = useRef<WebGLTexture | null>(null);
    const programRef = useRef<WebGLProgram | null>(null);
    const backgroundProgramRef = useRef<WebGLProgram | null>(null);
    const positionBufferRef = useRef<WebGLBuffer | null>(null);
    const texCoordBufferRef = useRef<WebGLBuffer | null>(null);

    // Pixel data (CPU-side for reading/writing)
    const imageDataRef = useRef<ImageData | null>(null);
    const textureDirtyRef = useRef(false);
    const renderScheduledRef = useRef(false);
    // Track dirty region for efficient partial texture updates
    const dirtyRegionRef = useRef<{ minX: number; minY: number; maxX: number; maxY: number } | null>(null);

    // View state
    const [zoom, setZoom] = useState(1);
    const [panX, setPanX] = useState(0);
    const [panY, setPanY] = useState(0);
    const [containerSize, setContainerSize] = useState({ width: 800, height: 600 });
    const [renderTrigger, setRenderTrigger] = useState(0);

    // UI state
    const [isPanning, setIsPanning] = useState(false);
    const [panStart, setPanStart] = useState({ x: 0, y: 0 });
    const [isDrawing, setIsDrawing] = useState(false);
    const [drawButton, setDrawButton] = useState<"left" | "right" | null>(null);

    const halfSize = maxSize / 2;

    // Initialize WebGL
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const gl = canvas.getContext("webgl", { preserveDrawingBuffer: true });
        if (!gl) {
            console.error("WebGL not supported");
            return;
        }

        glRef.current = gl;

        // Create shaders for texture rendering
        const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
        const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
        if (!vertexShader || !fragmentShader) return;

        // Create program for texture rendering
        const program = createProgram(gl, vertexShader, fragmentShader);
        if (!program) return;
        programRef.current = program;

        // Create shaders for solid color background
        const backgroundFragmentShader = createShader(gl, gl.FRAGMENT_SHADER, solidColorFragmentShaderSource);
        if (!backgroundFragmentShader) return;

        // Create program for background
        const backgroundProgram = createProgram(gl, vertexShader, backgroundFragmentShader);
        if (!backgroundProgram) return;
        backgroundProgramRef.current = backgroundProgram;

        // Create buffers
        positionBufferRef.current = gl.createBuffer();
        texCoordBufferRef.current = gl.createBuffer();

        // Create texture
        const texture = gl.createTexture();
        if (!texture) return;
        textureRef.current = texture;

        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

        // Enable blending for transparency
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

        // Initialize ImageData
        imageDataRef.current = new ImageData(maxSize, maxSize);

        // Initialize texture with ImageData (ensures texture is properly set up)
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, maxSize, maxSize, 0, gl.RGBA, gl.UNSIGNED_BYTE, imageDataRef.current.data);

        return () => {
            if (texture) gl.deleteTexture(texture);
            if (positionBufferRef.current) gl.deleteBuffer(positionBufferRef.current);
            if (texCoordBufferRef.current) gl.deleteBuffer(texCoordBufferRef.current);
            glRef.current = null;
            textureRef.current = null;
            programRef.current = null;
            backgroundProgramRef.current = null;
        };
    }, [maxSize]);

    function createShader(gl: WebGLRenderingContext, type: number, source: string): WebGLShader | null {
        const shader = gl.createShader(type);
        if (!shader) return null;
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            console.error("Shader compile error:", gl.getShaderInfoLog(shader));
            gl.deleteShader(shader);
            return null;
        }
        return shader;
    }

    function createProgram(gl: WebGLRenderingContext, vertexShader: WebGLShader, fragmentShader: WebGLShader): WebGLProgram | null {
        const program = gl.createProgram();
        if (!program) return null;
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            console.error("Program link error:", gl.getProgramInfoLog(program));
            gl.deleteProgram(program);
            return null;
        }
        return program;
    }

    // Update container size
    useEffect(() => {
        const updateSize = () => {
            if (!containerRef.current) return;
            const { width, height } = containerRef.current.getBoundingClientRect();
            setContainerSize({ width, height });
        };

        updateSize();
        const resizeObserver = new ResizeObserver(updateSize);
        if (containerRef.current) {
            resizeObserver.observe(containerRef.current);
        }
        return () => resizeObserver.disconnect();
    }, []);

    // Initialize zoom and center camera on (0,0)
    useEffect(() => {
        if (!containerRef.current || containerSize.width === 0) return;
        const initialZoom = containerSize.height / defaultZoomPixels;
        setZoom(initialZoom);
        // Center camera on (0,0) - pan should position (0,0) at center of screen
        setPanX(containerSize.width / 2);
        setPanY(containerSize.height / 2);
    }, [containerSize, defaultZoomPixels]);

    // Render function (WebGL)
    const render = useCallback(() => {
        const gl = glRef.current;
        const texture = textureRef.current;
        const program = programRef.current;
        const backgroundProgram = backgroundProgramRef.current;
        const canvas = canvasRef.current;
        if (!gl || !texture || !program || !backgroundProgram || !canvas) return;
        const dpr = window.devicePixelRatio || 1;
        const displayWidth = containerSize.width;
        const displayHeight = containerSize.height;

        // Resize canvas if needed
        const targetWidth = displayWidth * dpr;
        const targetHeight = displayHeight * dpr;
        if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
            canvas.width = targetWidth;
            canvas.height = targetHeight;
            gl.viewport(0, 0, targetWidth, targetHeight);
        }

        // Update texture if dirty
        if (textureDirtyRef.current && imageDataRef.current) {
            gl.bindTexture(gl.TEXTURE_2D, texture);
            const imgData = imageDataRef.current;
            const dirtyRegion = dirtyRegionRef.current;

            if (dirtyRegion) {
                // Partial update using texSubImage2D - only upload changed region
                const width = dirtyRegion.maxX - dirtyRegion.minX + 1;
                const height = dirtyRegion.maxY - dirtyRegion.minY + 1;

                // Extract subregion from ImageData
                const subData = new Uint8Array(width * height * 4);
                for (let y = 0; y < height; y++) {
                    const srcY = dirtyRegion.minY + y;
                    const srcStart = (srcY * maxSize + dirtyRegion.minX) * 4;
                    const dstStart = y * width * 4;
                    subData.set(imgData.data.subarray(srcStart, srcStart + width * 4), dstStart);
                }

                // Upload only the dirty region
                gl.texSubImage2D(
                    gl.TEXTURE_2D,
                    0,
                    dirtyRegion.minX,
                    dirtyRegion.minY,
                    width,
                    height,
                    gl.RGBA,
                    gl.UNSIGNED_BYTE,
                    subData
                );

                // Clear dirty region after update
                dirtyRegionRef.current = null;
            } else {
                // Full texture update (fallback - should rarely happen)
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, maxSize, maxSize, 0, gl.RGBA, gl.UNSIGNED_BYTE, imgData.data);
            }

            textureDirtyRef.current = false;
        }

        // Clear
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);

        // Set up quad covering canvas area (shared by both programs)
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBufferRef.current);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
            -halfSize, -halfSize,
            halfSize, -halfSize,
            -halfSize, halfSize,
            halfSize, halfSize,
        ]), gl.STATIC_DRAW);

        // Render white background first
        gl.useProgram(backgroundProgram);
        const bgPositionLocation = gl.getAttribLocation(backgroundProgram, "a_position");
        gl.enableVertexAttribArray(bgPositionLocation);
        gl.vertexAttribPointer(bgPositionLocation, 2, gl.FLOAT, false, 0, 0);

        const bgResolutionLocation = gl.getUniformLocation(backgroundProgram, "u_resolution");
        const bgViewOffsetLocation = gl.getUniformLocation(backgroundProgram, "u_viewOffset");
        const bgZoomLocation = gl.getUniformLocation(backgroundProgram, "u_zoom");
        const bgColorLocation = gl.getUniformLocation(backgroundProgram, "u_color");

        const [r, g, b, a] = parseColor(backgroundColor);
        gl.uniform2f(bgResolutionLocation, displayWidth, displayHeight);
        gl.uniform2f(bgViewOffsetLocation, panX, panY);
        gl.uniform1f(bgZoomLocation, zoom);
        gl.uniform4f(bgColorLocation, r / 255, g / 255, b / 255, a / 255);

        // Draw background
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

        // Now render texture on top
        gl.useProgram(program);
        const positionLocation = gl.getAttribLocation(program, "a_position");
        gl.enableVertexAttribArray(positionLocation);
        gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

        // Texture coordinates
        gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBufferRef.current);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
            0, 0,
            1, 0,
            0, 1,
            1, 1,
        ]), gl.STATIC_DRAW);

        const texCoordLocation = gl.getAttribLocation(program, "a_texCoord");
        gl.enableVertexAttribArray(texCoordLocation);
        gl.vertexAttribPointer(texCoordLocation, 2, gl.FLOAT, false, 0, 0);

        // Bind texture before setting uniforms (ensures it's active)
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture);

        // Set uniforms
        const resolutionLocation = gl.getUniformLocation(program, "u_resolution");
        const viewOffsetLocation = gl.getUniformLocation(program, "u_viewOffset");
        const zoomLocation = gl.getUniformLocation(program, "u_zoom");
        const textureLocation = gl.getUniformLocation(program, "u_texture");

        gl.uniform2f(resolutionLocation, displayWidth, displayHeight);
        gl.uniform2f(viewOffsetLocation, panX, panY);
        gl.uniform1f(zoomLocation, zoom);
        gl.uniform1i(textureLocation, 0);

        // Draw texture
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }, [containerSize, halfSize, maxSize, zoom, panX, panY, backgroundColor]);

    // Update ImageData when content changes (object-based rendering)
    useEffect(() => {
        if (content && imageDataRef.current) {
            const rendered = renderAssetContent(content, maxSize, halfSize);
            imageDataRef.current.data.set(rendered.data);
            textureDirtyRef.current = true;
            dirtyRegionRef.current = null; // Full update
            setRenderTrigger((t) => t + 1);
        }
    }, [content, maxSize, halfSize]);

    // Render on view changes or pixel updates
    useEffect(() => {
        render();
    }, [render, zoom, panX, panY, containerSize, renderTrigger]);

    // Get pixel
    const getPixel = useCallback((x: number, y: number): string | null => {
        const imageData = imageDataRef.current;
        if (!imageData) return null;

        const imgX = x + halfSize;
        const imgY = y + halfSize;
        if (imgX < 0 || imgX >= maxSize || imgY < 0 || imgY >= maxSize) return null;

        const idx = (imgY * maxSize + imgX) * 4;
        const r = imageData.data[idx];
        const g = imageData.data[idx + 1];
        const b = imageData.data[idx + 2];
        const a = imageData.data[idx + 3];

        if (a === 0) return null;
        return rgbaToString(r, g, b, a);
    }, [halfSize, maxSize]);

    // Get pixel data
    const getPixelData = useCallback((): ImageData | null => {
        return imageDataRef.current;
    }, []);

    // Apply pixels
    const applyPixels = useCallback((delta: PixelDelta) => {
        const imageData = imageDataRef.current;
        if (!imageData) return;

        // Cache parsed colors to avoid repeated parsing
        const colorCache = new Map<string | null, [number, number, number, number] | null>();
        colorCache.set(null, null); // null means transparent

        // Track dirty region bounds
        let minX = maxSize;
        let minY = maxSize;
        let maxX = -1;
        let maxY = -1;

        for (const key in delta) {
            const commaIdx = key.indexOf(",");
            const x = parseInt(key.slice(0, commaIdx), 10);
            const y = parseInt(key.slice(commaIdx + 1), 10);

            const imgX = x + halfSize;
            const imgY = y + halfSize;
            if (imgX < 0 || imgX >= maxSize || imgY < 0 || imgY >= maxSize) continue;

            // Update dirty region bounds
            minX = Math.min(minX, imgX);
            minY = Math.min(minY, imgY);
            maxX = Math.max(maxX, imgX);
            maxY = Math.max(maxY, imgY);

            const idx = (imgY * maxSize + imgX) * 4;
            const color = delta[key];

            // Get or parse color
            let rgba: [number, number, number, number] | null;
            if (!colorCache.has(color)) {
                rgba = color === null ? null : parseColor(color);
                colorCache.set(color, rgba);
            } else {
                rgba = colorCache.get(color)!;
            }

            if (rgba === null) {
                imageData.data[idx] = 0;
                imageData.data[idx + 1] = 0;
                imageData.data[idx + 2] = 0;
                imageData.data[idx + 3] = 0;
            } else {
                imageData.data[idx] = rgba[0];
                imageData.data[idx + 1] = rgba[1];
                imageData.data[idx + 2] = rgba[2];
                imageData.data[idx + 3] = rgba[3];
            }
        }

        // Update dirty region (merge with existing if any)
        if (minX <= maxX && minY <= maxY) {
            if (dirtyRegionRef.current) {
                dirtyRegionRef.current = {
                    minX: Math.min(dirtyRegionRef.current.minX, minX),
                    minY: Math.min(dirtyRegionRef.current.minY, minY),
                    maxX: Math.max(dirtyRegionRef.current.maxX, maxX),
                    maxY: Math.max(dirtyRegionRef.current.maxY, maxY),
                };
            } else {
                dirtyRegionRef.current = { minX, minY, maxX, maxY };
            }
            textureDirtyRef.current = true;
        }

        // Batch render triggers - only schedule once per frame
        if (!renderScheduledRef.current) {
            renderScheduledRef.current = true;
            requestAnimationFrame(() => {
                renderScheduledRef.current = false;
                setRenderTrigger(t => t + 1);
            });
        }
    }, [halfSize, maxSize]);

    // Get all pixels
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
                    const coordX = x - halfSize;
                    const coordY = y - halfSize;
                    result[`${coordX},${coordY}`] = rgbaToString(r, g, b, a);
                }
            }
        }
        return result;
    }, [maxSize, halfSize]);

    // Clear
    const clear = useCallback(() => {
        const imageData = imageDataRef.current;
        if (!imageData) return;
        imageData.data.fill(0);
        textureDirtyRef.current = true;
        dirtyRegionRef.current = null; // Full texture update
        setRenderTrigger(t => t + 1);
    }, []);

    // Load pixels
    const loadPixels = useCallback((pixels: Record<string, string>) => {
        const imageData = imageDataRef.current;
        if (!imageData) return;

        imageData.data.fill(0);
        for (const key in pixels) {
            const commaIdx = key.indexOf(",");
            const x = parseInt(key.slice(0, commaIdx), 10);
            const y = parseInt(key.slice(commaIdx + 1), 10);

            const imgX = x + halfSize;
            const imgY = y + halfSize;
            if (imgX < 0 || imgX >= maxSize || imgY < 0 || imgY >= maxSize) continue;

            const idx = (imgY * maxSize + imgX) * 4;
            const [r, g, b, a] = parseColor(pixels[key]);
            imageData.data[idx] = r;
            imageData.data[idx + 1] = g;
            imageData.data[idx + 2] = b;
            imageData.data[idx + 3] = a;
        }

        textureDirtyRef.current = true;
        dirtyRegionRef.current = null; // Full texture update
        setRenderTrigger(t => t + 1);
    }, [halfSize, maxSize]);

    // Render function for imperative handle
    const triggerRender = useCallback(() => {
        setRenderTrigger(t => t + 1);
    }, []);

    // Expose imperative handle
    useImperativeHandle(ref, () => ({
        getPixel,
        getPixelData,
        applyPixels,
        render: triggerRender,
        getAllPixels,
        clear,
        loadPixels,
    }), [getPixel, getPixelData, applyPixels, triggerRender, getAllPixels, clear, loadPixels]);

    // Mouse handlers (zoom, pan, draw)
    const handleWheel = useCallback((e: WheelEvent) => {
        e.preventDefault();
        if (!containerRef.current) return;

        const rect = containerRef.current.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        setZoom(currentZoom => {
            const newZoom = Math.max(0.1, Math.min(100, currentZoom * delta));
            const zoomFactor = newZoom / currentZoom;
            setPanX(currentPanX => mouseX - (mouseX - currentPanX) * zoomFactor);
            setPanY(currentPanY => mouseY - (mouseY - currentPanY) * zoomFactor);
            return newZoom;
        });
    }, []);

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        if (!containerRef.current) return;

        if (e.button === 1) { // Middle mouse
            e.preventDefault();
            setIsPanning(true);
            setPanStart({ x: e.clientX - panX, y: e.clientY - panY });
        } else if (e.button === 0 || e.button === 2) {
            const rect = containerRef.current.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;

            const canvasX = (mouseX - panX) / zoom;
            const canvasY = (mouseY - panY) / zoom;
            const pixelX = Math.floor(canvasX);
            const pixelY = Math.floor(canvasY);

            setIsDrawing(true);
            setDrawButton(e.button === 0 ? "left" : "right");
            onPixelClick?.(pixelX, pixelY, e.button === 0 ? "left" : "right");
        }
    }, [onPixelClick, panX, panY, zoom]);

    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        if (!containerRef.current) return;

        if (isPanning) {
            setPanX(e.clientX - panStart.x);
            setPanY(e.clientY - panStart.y);
        } else if (isDrawing && drawButton !== null) {
            const rect = containerRef.current.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;

            const canvasX = (mouseX - panX) / zoom;
            const canvasY = (mouseY - panY) / zoom;
            const pixelX = Math.floor(canvasX);
            const pixelY = Math.floor(canvasY);

            onPixelDrag?.(pixelX, pixelY, drawButton);
        }
    }, [isPanning, isDrawing, drawButton, panStart, panX, panY, zoom, onPixelDrag]);

    const handleMouseUp = useCallback(() => {
        setIsPanning(false);
        setIsDrawing(false);
        setDrawButton(null);
        onMouseUp?.();
    }, [onMouseUp]);

    // Event listeners
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        container.addEventListener("wheel", handleWheel);
        return () => container.removeEventListener("wheel", handleWheel);
    }, [handleWheel]);

    // Grid rendering (SVG overlay)
    const viewBoxX = -panX / zoom;
    const viewBoxY = -panY / zoom;
    const viewBoxWidth = containerSize.width / zoom;
    const viewBoxHeight = containerSize.height / zoom;

    const startX = Math.floor(viewBoxX - 1);
    const endX = Math.ceil(viewBoxX + viewBoxWidth + 1);
    const startY = Math.floor(viewBoxY - 1);
    const endY = Math.ceil(viewBoxY + viewBoxHeight + 1);

    const clampedStartX = Math.max(-halfSize, startX);
    const clampedEndX = Math.min(halfSize, endX);
    const clampedStartY = Math.max(-halfSize, startY);
    const clampedEndY = Math.min(halfSize, endY);

    const numVerticalLines = Math.max(0, clampedEndX - clampedStartX + 1);
    const numHorizontalLines = Math.max(0, clampedEndY - clampedStartY + 1);

    return (
        <div
            ref={containerRef}
            className={cn("w-full h-full overflow-hidden relative", className)}
            style={{ backgroundColor: outerBackgroundColor, width: "100%", height: "100%" }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
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
                
                {/* Animation Grid Overlay */}
                {gridConfig && (() => {
                    const { rows, cols } = gridConfig;
                    const cellWidth = maxSize / cols;
                    const cellHeight = maxSize / rows;
                    
                    // Calculate visible cells
                    const startCol = Math.max(0, Math.floor((clampedStartX + halfSize) / cellWidth));
                    const endCol = Math.min(cols - 1, Math.floor((clampedEndX + halfSize) / cellWidth));
                    const startRow = Math.max(0, Math.floor((clampedStartY + halfSize) / cellHeight));
                    const endRow = Math.min(rows - 1, Math.floor((clampedEndY + halfSize) / cellHeight));
                    
                    const cells = [];
                    
                    // Draw cell borders and frame numbers
                    for (let row = startRow; row <= endRow; row++) {
                        for (let col = startCol; col <= endCol; col++) {
                            const cellIndex = row * cols + col;
                            const cellX = -halfSize + col * cellWidth;
                            const cellY = -halfSize + row * cellHeight;
                            
                            // Cell border
                            cells.push(
                                <rect
                                    key={`cell-${cellIndex}`}
                                    x={cellX}
                                    y={cellY}
                                    width={cellWidth}
                                    height={cellHeight}
                                    fill="none"
                                    stroke="#3b82f6"
                                    strokeWidth={0.02}
                                    opacity={0.5}
                                />
                            );
                            
                            // Frame number (centered in cell)
                            const textX = cellX + cellWidth / 2;
                            const textY = cellY + cellHeight / 2;
                            const fontSize = Math.min(cellWidth, cellHeight) * 0.3;
                            
                            cells.push(
                                <text
                                    key={`text-${cellIndex}`}
                                    x={textX}
                                    y={textY}
                                    fontSize={fontSize}
                                    fill="#3b82f6"
                                    textAnchor="middle"
                                    dominantBaseline="middle"
                                    opacity={0.7}
                                    fontWeight="bold"
                                >
                                    {cellIndex}
                                </text>
                            );
                        }
                    }
                    
                    return cells;
                })()}
            </svg>
        </div>
    );
});
