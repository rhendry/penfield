import { useState } from "react";
import { cn } from "@/lib/utils";
import { ChevronDown, Search } from "lucide-react";

export interface Palette {
    id: string;
    name: string;
    isDefault?: boolean;
}

export interface PaletteSelectorProps {
    palettes: Palette[];
    selectedPaletteId: string;
    onSelectPalette: (paletteId: string) => void;
    onCreatePalette?: () => void;
    className?: string;
}

/**
 * PaletteSelector - Dropdown/search interface for selecting color palettes.
 */
export function PaletteSelector({
    palettes,
    selectedPaletteId,
    onSelectPalette,
    onCreatePalette,
    className,
}: PaletteSelectorProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    const selectedPalette = palettes.find((p) => p.id === selectedPaletteId);

    const filteredPalettes = palettes.filter((palette) =>
        palette.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className={cn("relative", className)}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "w-full px-3 py-2 rounded-lg border border-white/10 bg-background/40",
                    "flex items-center justify-between gap-2",
                    "hover:bg-background/60 transition-colors",
                    "text-sm text-foreground"
                )}
            >
                <span className="truncate">
                    {selectedPalette?.name || "Select palette"}
                </span>
                <ChevronDown
                    className={cn(
                        "w-4 h-4 text-muted-foreground flex-shrink-0 transition-transform",
                        isOpen && "rotate-180"
                    )}
                />
            </button>

            {isOpen && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 z-10"
                        onClick={() => setIsOpen(false)}
                    />

                    {/* Dropdown */}
                    <div className="absolute top-full left-0 right-0 mt-1 z-20 rounded-lg border border-white/10 bg-background shadow-lg overflow-hidden">
                        {/* Search */}
                        <div className="p-2 border-b border-white/10">
                            <div className="relative">
                                <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search palettes..."
                                    className="w-full pl-8 pr-3 py-1.5 rounded border border-white/10 bg-background/40 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                                    autoFocus
                                />
                            </div>
                        </div>

                        {/* Palette List */}
                        <div className="max-h-48 overflow-y-auto">
                            {filteredPalettes.length > 0 ? (
                                filteredPalettes.map((palette) => (
                                    <button
                                        key={palette.id}
                                        onClick={() => {
                                            onSelectPalette(palette.id);
                                            setIsOpen(false);
                                            setSearchQuery("");
                                        }}
                                        className={cn(
                                            "w-full px-3 py-2 text-left text-sm transition-colors",
                                            "hover:bg-background/60",
                                            selectedPaletteId === palette.id
                                                ? "bg-primary/20 text-primary"
                                                : "text-foreground"
                                        )}
                                    >
                                        <div className="flex items-center justify-between">
                                            <span>{palette.name}</span>
                                            {palette.isDefault && (
                                                <span className="text-xs text-muted-foreground">Default</span>
                                            )}
                                        </div>
                                    </button>
                                ))
                            ) : (
                                <div className="px-3 py-4 text-center text-sm text-muted-foreground">
                                    No palettes found
                                </div>
                            )}
                        </div>

                        {/* Create New */}
                        {onCreatePalette && (
                            <div className="p-2 border-t border-white/10">
                                <button
                                    onClick={() => {
                                        onCreatePalette();
                                        setIsOpen(false);
                                        setSearchQuery("");
                                    }}
                                    className="w-full px-3 py-2 rounded bg-primary/20 text-primary text-sm hover:bg-primary/30 transition-colors"
                                >
                                    Create New Palette
                                </button>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}

