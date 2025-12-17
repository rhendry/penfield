import { useState } from "react";
import { cn } from "@/lib/utils";

export interface ColorPickerProps {
    value: string;
    onChange: (color: string) => void;
    label?: string;
    className?: string;
}

/**
 * ColorPicker - Simple color picker utility for tools.
 */
export function ColorPicker({
    value,
    onChange,
    label = "Color",
    className,
}: ColorPickerProps) {
    return (
        <div className={cn("space-y-2", className)}>
            {label && (
                <label className="text-sm font-medium text-foreground">{label}</label>
            )}
            <div className="flex items-center gap-3">
                <input
                    type="color"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="w-12 h-12 rounded-lg border-2 border-white/20 cursor-pointer bg-transparent"
                />
                <input
                    type="text"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-lg border border-white/10 bg-background/40 text-sm font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="#000000"
                />
            </div>
        </div>
    );
}

