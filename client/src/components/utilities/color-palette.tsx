import { useState } from "react";
import { cn } from "@/lib/utils";
import { Plus, Trash2 } from "lucide-react";

export interface ColorPaletteProps {
    colors: string[];
    selectedColor: string;
    onSelectColor: (color: string) => void;
    onAddColor?: (color: string) => void;
    onRemoveColor?: (color: string) => void;
    maxColors?: number;
    className?: string;
}

/**
 * ColorPalette - Palette of colors for quick selection.
 */
export function ColorPalette({
    colors,
    selectedColor,
    onSelectColor,
    onAddColor,
    onRemoveColor,
    maxColors = 20,
    className,
}: ColorPaletteProps) {
    const [showAddColor, setShowAddColor] = useState(false);
    const [newColor, setNewColor] = useState("#000000");

    const handleAddColor = () => {
        if (onAddColor && newColor && !colors.includes(newColor) && colors.length < maxColors) {
            onAddColor(newColor);
            setNewColor("#000000");
            setShowAddColor(false);
        }
    };

    return (
        <div className={cn("space-y-3", className)}>
            <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-foreground">Color Palette</label>
                {onAddColor && colors.length < maxColors && (
                    <button
                        onClick={() => setShowAddColor(!showAddColor)}
                        className="p-1.5 rounded-lg border border-white/10 hover:bg-background/60 transition-colors"
                        title="Add color"
                    >
                        <Plus size={14} className="text-muted-foreground" />
                    </button>
                )}
            </div>

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
            <div className="grid grid-cols-6 gap-2">
                {colors.map((color, index) => {
                    const isSelected = color === selectedColor;
                    return (
                        <div key={index} className="relative group">
                            <button
                                onClick={() => onSelectColor(color)}
                                className={cn(
                                    "w-full aspect-square rounded-lg border-2 transition-all",
                                    "hover:scale-110",
                                    isSelected
                                        ? "border-primary shadow-[0_0_8px_rgba(var(--primary),0.5)] scale-110"
                                        : "border-white/20 hover:border-white/40"
                                )}
                                style={{ backgroundColor: color }}
                                title={color}
                            />
                            {onRemoveColor && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onRemoveColor(color);
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
                        <p className="text-xs mt-1">Click + to add colors</p>
                    )}
                </div>
            )}
        </div>
    );
}

