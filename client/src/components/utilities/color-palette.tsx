import { useState, useRef, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Plus, Trash2 } from "lucide-react";
import { PaletteSelector, type Palette } from "./palette-selector";
import { HotkeyTip } from "@/components/ui/hotkey-tip";

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
    /** Current color from ColorPicker to use when adding colors */
    currentPickerColor?: string;
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
    currentPickerColor,
    className,
}: ColorPaletteProps) {
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
        // Use currentPickerColor if provided, otherwise fall back to selectedColor
        const colorToAdd = currentPickerColor || selectedColor;
        
        // Normalize color format - ensure it has alpha (add ff if missing)
        let normalizedColor = colorToAdd;
        if (normalizedColor.startsWith("#")) {
            if (normalizedColor.length === 7) {
                // RGB format, add alpha
                normalizedColor = normalizedColor + "ff";
            } else if (normalizedColor.length === 4) {
                // Short format (#RGB), expand and add alpha
                normalizedColor = "#" + normalizedColor.slice(1).split("").map(c => c + c).join("") + "ff";
            }
        }
        
        // Check if exact color (including alpha) already exists
        const colorExists = colors.includes(normalizedColor);
        
        if (onAddColor && normalizedColor && !colorExists && colors.length < maxColors) {
            onAddColor(normalizedColor, paletteId);
        }
    };

    // Keyboard shortcuts: z = cycle left, x = cycle right
    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        // Only handle if not typing in an input
        if (
            e.target instanceof HTMLInputElement ||
            e.target instanceof HTMLTextAreaElement ||
            e.target instanceof HTMLSelectElement
        ) {
            return;
        }

        if (colors.length === 0) return;

        // Normalize selectedColor for comparison - ensure both have same format
        const normalizeColor = (c: string) => {
            if (c.length === 7) return c + "ff";
            return c;
        };
        const normalizedSelected = normalizeColor(selectedColor);
        const currentIndex = colors.findIndex(c => normalizeColor(c) === normalizedSelected);
        
        if (e.key === "z" || e.key === "Z") {
            e.preventDefault();
            const newIndex = currentIndex === -1 
                ? colors.length - 1 
                : (currentIndex - 1 + colors.length) % colors.length;
            onSelectColor(colors[newIndex], paletteId);
        } else if (e.key === "x" || e.key === "X") {
            e.preventDefault();
            const newIndex = currentIndex === -1 
                ? 0 
                : (currentIndex + 1) % colors.length;
            onSelectColor(colors[newIndex], paletteId);
        }
    }, [colors, selectedColor, onSelectColor, paletteId]);

    useEffect(() => {
        window.addEventListener("keydown", handleKeyDown, { capture: true });
        return () => {
            window.removeEventListener("keydown", handleKeyDown, { capture: true });
        };
    }, [handleKeyDown]);

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
                    onClick={handleAddColor}
                    className="w-full px-3 py-2 rounded-lg border border-white/10 hover:bg-background/60 transition-colors flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                    title="Add current color from picker to palette"
                >
                    <Plus size={14} />
                    <span>Add Color</span>
                </button>
            )}

            {/* Keyboard Shortcuts Helper */}
            {colors.length > 0 && (
                <HotkeyTip
                    label="Cycle colors"
                    keys={["Z", "X"]}
                    size="sm"
                    className="mt-1"
                />
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
                    // Normalize colors for comparison - ensure both have same format
                    const normalizeColor = (c: string) => {
                        if (c.length === 7) return c + "ff";
                        return c;
                    };
                    const normalizedColor = normalizeColor(color);
                    const normalizedSelected = normalizeColor(selectedColor);
                    const isSelected = normalizedColor === normalizedSelected;
                    
                    // Ensure color has alpha for display (add ff if missing)
                    const displayColor = color.length === 7 ? color + "ff" : color;
                    
                    return (
                        <div key={index} className="relative group">
                            <button
                                onClick={() => onSelectColor(color, paletteId)}
                                className={cn(
                                    "rounded-lg border-2 transition-all relative overflow-hidden",
                                    "hover:scale-110",
                                    isSelected
                                        ? "border-primary shadow-[0_0_8px_rgba(var(--primary),0.5)] scale-110"
                                        : "border-white/20 hover:border-white/40"
                                )}
                                style={{
                                    width: `${SWATCH_SIZE}px`,
                                    height: `${SWATCH_SIZE}px`,
                                }}
                                title={color}
                            >
                                {/* Checkerboard background for transparency */}
                                <div
                                    className="absolute inset-0"
                                    style={{
                                        backgroundImage: `
                                            linear-gradient(45deg, #808080 25%, transparent 25%),
                                            linear-gradient(-45deg, #808080 25%, transparent 25%),
                                            linear-gradient(45deg, transparent 75%, #808080 75%),
                                            linear-gradient(-45deg, transparent 75%, #808080 75%)
                                        `,
                                        backgroundSize: "8px 8px",
                                        backgroundPosition: "0 0, 0 4px, 4px -4px, -4px 0px",
                                    }}
                                />
                                {/* Color overlay */}
                                <div
                                    className="absolute inset-0"
                                    style={{
                                        backgroundColor: displayColor,
                                    }}
                                />
                            </button>
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

