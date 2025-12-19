import * as React from "react";
import { cn } from "@/lib/utils";
import { KeyboardKey } from "./keyboard-key";

export interface HotkeyTipProps {
    /** The label/description for this hotkey tip */
    label?: string;
    /** Array of keys to display. Can be strings or arrays for key combinations (e.g., ["Ctrl", "Space"]) */
    keys: (string | string[])[];
    /** Size of the keyboard keys */
    size?: "sm" | "md" | "lg";
    /** Variant of the keyboard keys */
    variant?: "default" | "ghost";
    /** Additional className for the container */
    className?: string;
}

/**
 * HotkeyTip - Displays a hotkey tip with keyboard key components.
 * Used to show keyboard shortcuts throughout the app.
 * 
 * @example
 * <HotkeyTip label="Cycle colors" keys={["Z", "X"]} />
 * <HotkeyTip keys={[["Ctrl", "Space"]]} />
 */
export function HotkeyTip({
    label,
    keys,
    size = "md",
    variant = "default",
    className,
}: HotkeyTipProps) {
    return (
        <div className={cn("flex items-center gap-1 text-xs text-muted-foreground", className)}>
            {label && <span>{label}</span>}
            <div className="flex items-center gap-0.5">
                {keys.map((keyOrCombo, index) => {
                    const isCombo = Array.isArray(keyOrCombo);
                    const keyArray = isCombo ? keyOrCombo : [keyOrCombo];
                    
                    return (
                        <React.Fragment key={index}>
                            {index > 0 && (
                                <span className="text-muted-foreground/60 mx-0.5">or</span>
                            )}
                            {isCombo ? (
                                <span className="flex items-center gap-0.5">
                                    {keyArray.map((key, keyIndex) => (
                                        <React.Fragment key={keyIndex}>
                                            {keyIndex > 0 && (
                                                <span className="text-muted-foreground/60">+</span>
                                            )}
                                            <KeyboardKey size={size} variant={variant}>
                                                {key}
                                            </KeyboardKey>
                                        </React.Fragment>
                                    ))}
                                </span>
                            ) : (
                                <KeyboardKey size={size} variant={variant}>
                                    {keyOrCombo}
                                </KeyboardKey>
                            )}
                        </React.Fragment>
                    );
                })}
            </div>
        </div>
    );
}

