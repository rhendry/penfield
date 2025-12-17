import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Plus, Trash2 } from "lucide-react";
import { PaletteSelector, type Palette } from "./palette-selector";

export interface ColorPaletteProps {
    paletteId: string;
    palettes: Palette[];
    colors: string[]; // Colors for the selected palette
    selectedColor: string;
    onSelectPalette: (paletteId: string) => void;
    onSelectColor: (color: string, paletteId: string) => void;
    onAddColor?: (color: string, paletteId: string) => void;
    onRemoveColor?: (color: string, paletteId: string) => void;
    onCreatePalette?: () => void;
    maxColors?: number;
    className?: string;
}

/**
 * ColorPalette - Palette of colors for quick selection.
 * All data comes from props. Includes palette selector dropdown.
 */
export function ColorPalette({
    paletteId,
    palettes,
    colors,
    selectedColor,
    onSelectPalette,
    onSelectColor,
    onAddColor,
    onRemoveColor,
    onCreatePalette,
    maxColors = 20,
    className,
}: ColorPaletteProps) {
    const [showAddColor, setShowAddColor] = useState(false);
    const [newColor, setNewColor] = useState("#000000");
    const [columns, setColumns] = useState(6);
    const gridRef = useRef<HTMLDivElement>(null);

    const SWATCH_SIZE = 40; // Fixed size for each swatch in pixels
    const GAP = 8; // Gap between swatches

    // Calculate number of columns based on available width
    useEffect(() => {
        const updateColumns = () => {
            if (!gridRef.current) return;
            const width = gridRef.current.offsetWidth;
            const cols = Math.max(1, Math.floor((width + GAP) / (SWATCH_SIZE + GAP)));
            setColumns(cols);
        };

        updateColumns();
        const resizeObserver = new ResizeObserver(updateColumns);
        if (gridRef.current) {
            resizeObserver.observe(gridRef.current);
        }

        return () => {
            resizeObserver.disconnect();
        };
    }, []);

    const handleAddColor = () => {
        if (onAddColor && newColor && !colors.includes(newColor) && colors.length < maxColors) {
            onAddColor(newColor, paletteId);
            setNewColor("#000000");
            setShowAddColor(false);
        }
    };

    return (
        <div className={cn("space-y-3", className)}>
            {/* Palette Selector */}
            <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Color Palette</label>
                <PaletteSelector
                    palettes={palettes}
                    selectedPaletteId={paletteId}
                    onSelectPalette={onSelectPalette}
                    onCreatePalette={onCreatePalette}
                />
            </div>

            {/* Add Color Button */}
            {onAddColor && colors.length < maxColors && (
                <button
                    onClick={() => setShowAddColor(!showAddColor)}
                    className="w-full px-3 py-2 rounded-lg border border-white/10 hover:bg-background/60 transition-colors flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                    title="Add color"
                >
                    <Plus size={14} />
                    <span>Add Color</span>
                </button>
            )}

            {/* Add Color Input */}
            {showAddColor && onAddColor && (
                <div className="flex items-center gap-2 p-2 rounded-lg border border-white/10 bg-background/40">
                    <input
                        type="color"
                        value={newColor}
                        onChange={(e) => setNewColor(e.target.value)}
                        className="w-8 h-8 rounded border border-white/20 cursor-pointer"
                    />
                    <input
                        type="text"
                        value={newColor}
                        onChange={(e) => setNewColor(e.target.value)}
                        className="flex-1 px-2 py-1 rounded border border-white/10 bg-background text-xs font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                        placeholder="#000000"
                    />
                    <button
                        onClick={handleAddColor}
                        className="px-2 py-1 rounded bg-primary text-primary-foreground text-xs hover:bg-primary/90 transition-colors"
                    >
                        Add
                    </button>
                </div>
            )}

            {/* Color Swatches */}
            <div
                ref={gridRef}
                className="grid gap-2"
                style={{
                    gridTemplateColumns: `repeat(${columns}, ${SWATCH_SIZE}px)`,
                }}
            >
                {colors.map((color, index) => {
                    const isSelected = color === selectedColor;
                    return (
                        <div key={index} className="relative group">
                            <button
                                onClick={() => onSelectColor(color, paletteId)}
                                className={cn(
                                    "rounded-lg border-2 transition-all",
                                    "hover:scale-110",
                                    isSelected
                                        ? "border-primary shadow-[0_0_8px_rgba(var(--primary),0.5)] scale-110"
                                        : "border-white/20 hover:border-white/40"
                                )}
                                style={{
                                    width: `${SWATCH_SIZE}px`,
                                    height: `${SWATCH_SIZE}px`,
                                    backgroundColor: color,
                                }}
                                title={color}
                            />
                            {onRemoveColor && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onRemoveColor(color, paletteId);
                                    }}
                                    className={cn(
                                        "absolute -top-1 -right-1 w-4 h-4 rounded-full bg-destructive",
                                        "flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity",
                                        "hover:scale-110"
                                    )}
                                    title="Remove color"
                                >
                                    <Trash2 size={8} className="text-destructive-foreground" />
                                </button>
                            )}
                        </div>
                    );
                })}
            </div>

            {colors.length === 0 && (
                <div className="text-center py-4 text-muted-foreground">
                    <p className="text-xs">No colors in palette</p>
                    {onAddColor && (
                        <p className="text-xs mt-1">Click "Add Color" to add colors</p>
                    )}
                </div>
            )}
        </div>
    );
}

