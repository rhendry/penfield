import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PixelEditorProps {
    initialContent: any;
    onSave: (content: any) => Promise<void>;
}

export function PixelEditor({ initialContent, onSave }: PixelEditorProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isSaving, setIsSaving] = useState(false);
    const { toast } = useToast();

    // Basic state: grid of colors. Key: "x,y", Value: color string
    const [grid, setGrid] = useState<Record<string, string>>(initialContent?.grid || {});
    const [color, setColor] = useState("#000000");
    const [isDrawing, setIsDrawing] = useState(false);

    const PIXEL_SIZE = 20;
    const CANVAS_SIZE = 600; // 30x30 grid

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // Clear canvas
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

        // Draw grid
        ctx.strokeStyle = "#e5e5e5";
        ctx.lineWidth = 1;
        for (let i = 0; i <= CANVAS_SIZE; i += PIXEL_SIZE) {
            ctx.beginPath();
            ctx.moveTo(i, 0);
            ctx.lineTo(i, CANVAS_SIZE);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(0, i);
            ctx.lineTo(CANVAS_SIZE, i);
            ctx.stroke();
        }

        // Draw pixels
        Object.entries(grid).forEach(([key, color]) => {
            const [x, y] = key.split(",").map(Number);
            ctx.fillStyle = color;
            ctx.fillRect(x * PIXEL_SIZE, y * PIXEL_SIZE, PIXEL_SIZE, PIXEL_SIZE);
        });
    }, [grid]);

    const handleMouseDown = (e: React.MouseEvent) => {
        setIsDrawing(true);
        draw(e);
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDrawing) return;
        draw(e);
    };

    const handleMouseUp = () => {
        setIsDrawing(false);
    };

    const draw = (e: React.MouseEvent) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const x = Math.floor((e.clientX - rect.left) / PIXEL_SIZE);
        const y = Math.floor((e.clientY - rect.top) / PIXEL_SIZE);

        if (x >= 0 && x < CANVAS_SIZE / PIXEL_SIZE && y >= 0 && y < CANVAS_SIZE / PIXEL_SIZE) {
            setGrid((prev) => ({
                ...prev,
                [`${x},${y}`]: color,
            }));
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await onSave({ grid });
            toast({
                title: "Saved",
                description: "Your artwork has been saved.",
            });
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to save artwork.",
                variant: "destructive",
            });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="flex flex-col items-center gap-4">
            <div className="flex gap-4 items-center mb-4">
                <input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="h-10 w-10 cursor-pointer"
                />
                <Button onClick={handleSave} disabled={isSaving}>
                    {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    <Save className="mr-2 h-4 w-4" />
                    Save
                </Button>
            </div>
            <div className="border rounded-lg shadow-sm overflow-hidden">
                <canvas
                    ref={canvasRef}
                    width={CANVAS_SIZE}
                    height={CANVAS_SIZE}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                    className="cursor-crosshair"
                />
            </div>
            <p className="text-sm text-muted-foreground">
                Click and drag to draw. Select color above.
            </p>
        </div>
    );
}
