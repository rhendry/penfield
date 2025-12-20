import type { Meta, StoryObj } from "@storybook/react";
import { useState, useCallback, useRef, useEffect } from "react";
import { PixelCanvas, PixelCanvasHandle } from "../../client/src/components/editor/pixel-canvas";
import { smoothCurveAdaptive, type Point } from "../../client/src/lib/bezier";
import type { PixelDelta } from "../../client/src/tools/types";

const meta = {
    title: "Editor/PixelCanvas",
    component: PixelCanvas,
    parameters: {
        layout: "fullscreen",
    },
    tags: ["autodocs"],
} satisfies Meta<typeof PixelCanvas>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    render: () => (
        <div style={{ width: "100%", height: "100vh", position: "absolute", inset: 0 }}>
            <PixelCanvas />
        </div>
    ),
};

export const CustomColors: Story = {
    render: () => (
        <div style={{ width: "100%", height: "100vh", position: "absolute", inset: 0 }}>
            <PixelCanvas
                backgroundColor="#1a1a1a"
                gridLineColor="#333333"
                xAxisColor="#00ff00"
                yAxisColor="#ff0000"
            />
        </div>
    ),
};

export const LargeCanvas: Story = {
    render: () => (
        <div style={{ width: "100%", height: "100vh", position: "absolute", inset: 0 }}>
            <PixelCanvas maxSize={2000} defaultZoomPixels={100} />
        </div>
    ),
};

// Helper function to create pixel data
function createPixelData(positions: Array<[number, number, string]>): Record<string, string> {
    const data: Record<string, string> = {};
    positions.forEach(([x, y, color]) => {
        data[`${x},${y}`] = color;
    });
    return data;
}

// Smiley face pixel art
const smileyFacePixels = createPixelData([
    // Face outline
    [-2, -2, "#ffd700"], [-1, -2, "#ffd700"], [0, -2, "#ffd700"], [1, -2, "#ffd700"], [2, -2, "#ffd700"],
    [-2, -1, "#ffd700"], [2, -1, "#ffd700"],
    [-2, 0, "#ffd700"], [2, 0, "#ffd700"],
    [-2, 1, "#ffd700"], [-1, 1, "#ffd700"], [0, 1, "#ffd700"], [1, 1, "#ffd700"], [2, 1, "#ffd700"],
    [-2, 2, "#ffd700"], [-1, 2, "#ffd700"], [0, 2, "#ffd700"], [1, 2, "#ffd700"], [2, 2, "#ffd700"],
    // Eyes
    [-1, -1, "#000000"], [1, -1, "#000000"],
    // Mouth
    [-1, 0, "#000000"], [0, 0, "#000000"], [1, 0, "#000000"],
]);

// Component wrapper for stories with initial pixels
function CanvasWithInitialPixels({ pixels, ...props }: { pixels: Record<string, string> } & React.ComponentProps<typeof PixelCanvas>) {
    const canvasRef = useRef<PixelCanvasHandle>(null);
    
    useEffect(() => {
        if (canvasRef.current) {
            canvasRef.current.loadPixels(pixels);
        }
    }, [pixels]);
    
    return <PixelCanvas ref={canvasRef} {...props} />;
}

export const WithSmileyFace: Story = {
    render: () => (
        <div style={{ width: "100%", height: "100vh", position: "absolute", inset: 0 }}>
            <CanvasWithInitialPixels pixels={smileyFacePixels} />
        </div>
    ),
};

// Simple house pixel art
const housePixels = createPixelData([
    // Roof
    [-3, -3, "#8b4513"], [-2, -3, "#8b4513"], [-1, -3, "#8b4513"], [0, -3, "#8b4513"], [1, -3, "#8b4513"], [2, -3, "#8b4513"], [3, -3, "#8b4513"],
    [-2, -2, "#8b4513"], [-1, -2, "#8b4513"], [0, -2, "#8b4513"], [1, -2, "#8b4513"], [2, -2, "#8b4513"],
    [-1, -1, "#8b4513"], [0, -1, "#8b4513"], [1, -1, "#8b4513"],
    // Walls
    [-2, 0, "#ff6347"], [-1, 0, "#ff6347"], [0, 0, "#ff6347"], [1, 0, "#ff6347"], [2, 0, "#ff6347"],
    [-2, 1, "#ff6347"], [-1, 1, "#ff6347"], [0, 1, "#ff6347"], [1, 1, "#ff6347"], [2, 1, "#ff6347"],
    [-2, 2, "#ff6347"], [-1, 2, "#ff6347"], [0, 2, "#ff6347"], [1, 2, "#ff6347"], [2, 2, "#ff6347"],
    // Door
    [0, 1, "#654321"], [0, 2, "#654321"],
    // Window
    [-1, 0, "#87ceeb"], [1, 0, "#87ceeb"],
]);

export const WithHouse: Story = {
    render: () => (
        <div style={{ width: "100%", height: "100vh", position: "absolute", inset: 0 }}>
            <CanvasWithInitialPixels pixels={housePixels} />
        </div>
    ),
};

// Simple character sprite
const characterPixels = createPixelData([
    // Head
    [-1, -3, "#ffdbac"], [0, -3, "#ffdbac"], [1, -3, "#ffdbac"],
    [-1, -2, "#ffdbac"], [0, -2, "#ffdbac"], [1, -2, "#ffdbac"],
    [-1, -1, "#ffdbac"], [0, -1, "#ffdbac"], [1, -1, "#ffdbac"],
    // Eyes
    [-1, -2, "#000000"], [1, -2, "#000000"],
    // Body
    [-1, 0, "#4169e1"], [0, 0, "#4169e1"], [1, 0, "#4169e1"],
    [-1, 1, "#4169e1"], [0, 1, "#4169e1"], [1, 1, "#4169e1"],
    [-1, 2, "#4169e1"], [0, 2, "#4169e1"], [1, 2, "#4169e1"],
    // Arms
    [-2, 0, "#ffdbac"], [-2, 1, "#ffdbac"], [2, 0, "#ffdbac"], [2, 1, "#ffdbac"],
    // Legs
    [-1, 3, "#000080"], [0, 3, "#000080"], [1, 3, "#000080"],
    [-1, 4, "#000080"], [1, 4, "#000080"],
]);

export const WithCharacter: Story = {
    render: () => (
        <div style={{ width: "100%", height: "100vh", position: "absolute", inset: 0 }}>
            <CanvasWithInitialPixels pixels={characterPixels} />
        </div>
    ),
};

// Pattern/abstract art
const patternPixels = createPixelData([
    // Diagonal pattern
    [-5, -5, "#ff0000"], [-4, -4, "#ff0000"], [-3, -3, "#ff0000"], [-2, -2, "#ff0000"], [-1, -1, "#ff0000"], [0, 0, "#ff0000"], [1, 1, "#ff0000"], [2, 2, "#ff0000"], [3, 3, "#ff0000"], [4, 4, "#ff0000"], [5, 5, "#ff0000"],
    [-5, 5, "#00ff00"], [-4, 4, "#00ff00"], [-3, 3, "#00ff00"], [-2, 2, "#00ff00"], [-1, 1, "#00ff00"], [0, 0, "#00ff00"], [1, -1, "#00ff00"], [2, -2, "#00ff00"], [3, -3, "#00ff00"], [4, -4, "#00ff00"], [5, -5, "#00ff00"],
    // Cross pattern
    [-3, 0, "#0000ff"], [-2, 0, "#0000ff"], [-1, 0, "#0000ff"], [0, 0, "#0000ff"], [1, 0, "#0000ff"], [2, 0, "#0000ff"], [3, 0, "#0000ff"],
    [0, -3, "#0000ff"], [0, -2, "#0000ff"], [0, -1, "#0000ff"], [0, 1, "#0000ff"], [0, 2, "#0000ff"], [0, 3, "#0000ff"],
]);

export const WithPattern: Story = {
    render: () => (
        <div style={{ width: "100%", height: "100vh", position: "absolute", inset: 0 }}>
            <CanvasWithInitialPixels pixels={patternPixels} />
        </div>
    ),
};

// Interactive drawing story
export const Interactive: Story = {
    render: () => {
        const canvasRef = useRef<PixelCanvasHandle>(null);
        
        const handlePixelClick = useCallback((x: number, y: number, button: "left" | "right") => {
            canvasRef.current?.applyPixels({ [`${x},${y}`]: "#000000" });
        }, []);
        
        const handlePixelDrag = useCallback((x: number, y: number, button: "left" | "right") => {
            canvasRef.current?.applyPixels({ [`${x},${y}`]: "#000000" });
        }, []);
        
        return (
            <div style={{ width: "100%", height: "100vh", position: "absolute", inset: 0 }}>
                <PixelCanvas
                    ref={canvasRef}
                    onPixelClick={handlePixelClick}
                    onPixelDrag={handlePixelDrag}
                />
            </div>
        );
    },
};

// Bezier curve test story - shows control points and curve visualization
export const BezierCurveTest: Story = {
    render: () => {
        const canvasRef = useRef<PixelCanvasHandle>(null);
        const [controlPoints, setControlPoints] = useState<Point[]>([]);
        const [curvePoints, setCurvePoints] = useState<Point[]>([]);
        const inputBufferRef = useRef<Point[]>([]);
        const lastDrawnRef = useRef<Point | null>(null);
        const rafIdRef = useRef<number | null>(null);
        
        const processBuffer = useCallback(() => {
            if (inputBufferRef.current.length === 0) {
                rafIdRef.current = null;
                return;
            }
            
            const buffer = [...inputBufferRef.current];
            inputBufferRef.current = [];
            
            // Build control points
            const points: Point[] = [];
            if (lastDrawnRef.current) {
                points.push(lastDrawnRef.current);
            }
            buffer.forEach(p => points.push(p));
            
            setControlPoints([...points]);
            
            if (points.length >= 2) {
                // Generate curve
                const curve = smoothCurveAdaptive(points, 0.5, 2);
                setCurvePoints([...curve]);
                
                // Draw pixels along curve
                const delta: PixelDelta = {};
                curve.forEach(p => {
                    delta[`${p.x},${p.y}`] = "#000000";
                });
                canvasRef.current?.applyPixels(delta);
                
                if (curve.length > 0) {
                    lastDrawnRef.current = curve[curve.length - 1];
                }
            } else if (points.length === 1) {
                const p = points[0];
                canvasRef.current?.applyPixels({ [`${p.x},${p.y}`]: "#000000" });
                lastDrawnRef.current = p;
            }
            
            if (inputBufferRef.current.length > 0) {
                rafIdRef.current = requestAnimationFrame(processBuffer);
            } else {
                rafIdRef.current = null;
            }
        }, []);
        
        const handlePixelClick = useCallback((x: number, y: number, button: "left" | "right") => {
            lastDrawnRef.current = { x, y };
            canvasRef.current?.applyPixels({ [`${x},${y}`]: "#ff0000" }); // Red for control points
            setControlPoints([{ x, y }]);
            setCurvePoints([]);
        }, []);
        
        const handlePixelDrag = useCallback((x: number, y: number, button: "left" | "right") => {
            inputBufferRef.current.push({ x, y });
            if (rafIdRef.current === null) {
                rafIdRef.current = requestAnimationFrame(processBuffer);
            }
        }, [processBuffer]);
        
        const handleMouseUp = useCallback(() => {
            if (inputBufferRef.current.length > 0) {
                processBuffer();
            }
            lastDrawnRef.current = null;
            inputBufferRef.current = [];
            setControlPoints([]);
            setCurvePoints([]);
        }, [processBuffer]);
        
        // Show debug info
        const debugInfo = (
            <div style={{
                position: "absolute",
                top: 10,
                left: 10,
                background: "rgba(0,0,0,0.7)",
                color: "white",
                padding: "10px",
                borderRadius: "4px",
                fontSize: "12px",
                zIndex: 1000,
                fontFamily: "monospace"
            }}>
                <div>Control Points: {controlPoints.length}</div>
                <div>Curve Points: {curvePoints.length}</div>
                <div>Buffer Size: {inputBufferRef.current.length}</div>
                {controlPoints.length > 0 && (
                    <div style={{ marginTop: "5px" }}>
                        <div>Last Control: ({controlPoints[controlPoints.length - 1]?.x}, {controlPoints[controlPoints.length - 1]?.y})</div>
                    </div>
                )}
            </div>
        );
        
        return (
            <div style={{ width: "100%", height: "100vh", position: "absolute", inset: 0 }}>
                {debugInfo}
                <PixelCanvas
                    ref={canvasRef}
                    onPixelClick={handlePixelClick}
                    onPixelDrag={handlePixelDrag}
                    onMouseUp={handleMouseUp}
                />
            </div>
        );
    },
};
