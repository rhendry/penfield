import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

export interface ColorPickerProps {
    value: string; // RGBA hex string (e.g., "#ff0000ff" or "#ff0000")
    onChange: (color: string) => void;
    label?: string;
    className?: string;
}

/**
 * Converts hex color to RGBA hex format
 */
function toRGBAHex(hex: string): string {
    // Remove # if present
    hex = hex.replace("#", "");
    
    // Handle RGB (6 chars) - add FF for alpha
    if (hex.length === 6) {
        return `#${hex}ff`;
    }
    
    // Handle RGBA (8 chars) - return as is
    if (hex.length === 8) {
        return `#${hex}`;
    }
    
    // Handle short RGB (3 chars) - expand and add FF
    if (hex.length === 3) {
        const expanded = hex.split("").map((c) => c + c).join("");
        return `#${expanded}ff`;
    }
    
    // Default fallback
    return `#${hex}ff`;
}

/**
 * Converts RGBA hex to standard hex (removes alpha for display)
 */
function toHex(rgbaHex: string): string {
    const hex = rgbaHex.replace("#", "");
    if (hex.length === 8) {
        return `#${hex.slice(0, 6)}`;
    }
    return rgbaHex;
}

/**
 * Converts RGBA hex to alpha value (0-1)
 */
function hexToAlpha(rgbaHex: string): number {
    const hex = rgbaHex.replace("#", "");
    if (hex.length === 8) {
        const alphaHex = hex.slice(6, 8);
        return parseInt(alphaHex, 16) / 255;
    }
    return 1;
}

/**
 * Converts alpha (0-1) to hex string
 */
function alphaToHex(alpha: number): string {
    const clamped = Math.max(0, Math.min(1, alpha));
    const hex = Math.round(clamped * 255).toString(16).padStart(2, "0");
    return hex;
}

/**
 * Converts HSL to RGB
 */
function hslToRgb(h: number, s: number, l: number): [number, number, number] {
    h /= 360;
    s /= 100;
    l /= 100;
    
    let r, g, b;
    
    if (s === 0) {
        r = g = b = l;
    } else {
        const hue2rgb = (p: number, q: number, t: number) => {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1/6) return p + (q - p) * 6 * t;
            if (t < 1/2) return q;
            if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
            return p;
        };
        
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        r = hue2rgb(p, q, h + 1/3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1/3);
    }
    
    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

/**
 * Converts RGB to HSL
 */
function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
    r /= 255;
    g /= 255;
    b /= 255;
    
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0, s = 0;
    const l = (max + min) / 2;
    
    if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        
        switch (max) {
            case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
            case g: h = ((b - r) / d + 2) / 6; break;
            case b: h = ((r - g) / d + 4) / 6; break;
        }
    }
    
    return [h * 360, s * 100, l * 100];
}

/**
 * Converts hex to RGB
 */
function hexToRgb(hex: string): [number, number, number] {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
        ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
        : [0, 0, 0];
}

/**
 * Converts RGB to hex
 */
function rgbToHex(r: number, g: number, b: number): string {
    return `#${[r, g, b].map((x) => x.toString(16).padStart(2, "0")).join("")}`;
}

/**
 * ColorPicker - Full color picker with visible gradient/wheel and alpha support.
 * Always shows color wheel/gradient area - nothing hidden behind modals.
 */
export function ColorPicker({
    value,
    onChange,
    label = "Color",
    className,
}: ColorPickerProps) {
    const rgbaValue = toRGBAHex(value);
    const hexValue = toHex(rgbaValue);
    const alphaValue = hexToAlpha(rgbaValue);
    
    const [hue, setHue] = useState(0);
    const [saturation, setSaturation] = useState(100);
    const [lightness, setLightness] = useState(50);
    const [isDragging, setIsDragging] = useState(false);
    const [isDraggingHue, setIsDraggingHue] = useState(false);
    
    const gradientRef = useRef<HTMLDivElement>(null);
    const hueRef = useRef<HTMLDivElement>(null);
    const isInitialMountRef = useRef(true);
    const lastSentHexRef = useRef<string | null>(null);

    // Initialize HSL from hex value (only when external value changes)
    useEffect(() => {
        // Normalize the incoming hex value for comparison
        const normalizedHexValue = hexValue.replace("#", "").toLowerCase();
        
        // If this matches the last hex we sent via onChange, this is our own update
        // Skip syncing HSL to avoid infinite loops
        if (lastSentHexRef.current !== null && normalizedHexValue === lastSentHexRef.current) {
            return;
        }
        
        // This is an external change - sync HSL from hex
        const [r, g, b] = hexToRgb(hexValue);
        const [h, s, l] = rgbToHsl(r, g, b);
        setHue(h);
        setSaturation(s);
        setLightness(l);
        // Don't update lastSentHexRef here - only update it when we send via onChange
    }, [hexValue]);

    // Update color when HSL changes from user interaction
    useEffect(() => {
        if (isInitialMountRef.current) {
            isInitialMountRef.current = false;
            // Initialize lastSentHexRef on mount with current hex
            const [r, g, b] = hslToRgb(hue, saturation, lightness);
            const hex = rgbToHex(r, g, b);
            lastSentHexRef.current = hex.replace("#", "").toLowerCase();
            return;
        }
        
        const [r, g, b] = hslToRgb(hue, saturation, lightness);
        const hex = rgbToHex(r, g, b);
        const alphaHex = alphaToHex(alphaValue);
        const newValue = `#${hex.replace("#", "")}${alphaHex}`;
        
        // Update our tracking ref BEFORE calling onChange
        // This ensures that when the value comes back as a prop, we recognize it as our own
        lastSentHexRef.current = hex.replace("#", "").toLowerCase();
        onChange(newValue);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [hue, saturation, lightness, alphaValue]);

    const handleGradientClick = (e: React.MouseEvent<HTMLDivElement>) => {
        e.preventDefault();
        if (!gradientRef.current) return;
        const rect = gradientRef.current.getBoundingClientRect();
        const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
        const y = Math.max(0, Math.min(rect.height, e.clientY - rect.top));
        // X-axis: saturation (0% left, 100% right)
        const s = (x / rect.width) * 100;
        // Y-axis: lightness varies based on saturation
        // At right edge (saturation=100%): top=50% lightness (pure hue), bottom=0% (black)
        // At left edge (saturation=0%): top=100% lightness (white), bottom=0% (black)
        const yRatio = 1 - (y / rect.height); // 1.0 at top, 0.0 at bottom
        const maxLightness = 100 - (s / 2); // 50% at saturation=100%, 100% at saturation=0%
        const l = yRatio * maxLightness;
        setSaturation(s);
        setLightness(l);
    };

    const handleGradientMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(true);
        handleGradientClick(e);
    };

    const handleHueClick = (e: React.MouseEvent<HTMLDivElement>) => {
        e.preventDefault();
        if (!hueRef.current) return;
        const rect = hueRef.current.getBoundingClientRect();
        const y = Math.max(0, Math.min(rect.height, e.clientY - rect.top));
        const h = (y / rect.height) * 360;
        setHue(h);
    };

    const handleHueMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDraggingHue(true);
        handleHueClick(e);
    };

    const handleMouseMove = (e: MouseEvent) => {
        e.preventDefault();
        if (isDragging && gradientRef.current) {
            const rect = gradientRef.current.getBoundingClientRect();
            const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
            const y = Math.max(0, Math.min(rect.height, e.clientY - rect.top));
            // X-axis: saturation (0% left, 100% right)
            const s = (x / rect.width) * 100;
            // Y-axis: lightness varies based on saturation
            const yRatio = 1 - (y / rect.height); // 1.0 at top, 0.0 at bottom
            const maxLightness = 100 - (s / 2); // 50% at saturation=100%, 100% at saturation=0%
            const l = yRatio * maxLightness;
            setSaturation(s);
            setLightness(l);
        }
        if (isDraggingHue && hueRef.current) {
            const rect = hueRef.current.getBoundingClientRect();
            const y = Math.max(0, Math.min(rect.height, e.clientY - rect.top));
            const h = (y / rect.height) * 360;
            setHue(h);
        }
    };

    const handleMouseUp = (e: MouseEvent) => {
        e.preventDefault();
        setIsDragging(false);
        setIsDraggingHue(false);
    };

    useEffect(() => {
        if (isDragging || isDraggingHue) {
            // Prevent text selection during drag
            document.body.style.userSelect = "none";
            document.body.style.webkitUserSelect = "none";
            
            window.addEventListener("mousemove", handleMouseMove);
            window.addEventListener("mouseup", handleMouseUp);
            return () => {
                document.body.style.userSelect = "";
                document.body.style.webkitUserSelect = "";
                window.removeEventListener("mousemove", handleMouseMove);
                window.removeEventListener("mouseup", handleMouseUp);
            };
        }
    }, [isDragging, isDraggingHue]);

    const handleHexChange = (hex: string) => {
        const alphaHex = alphaToHex(alphaValue);
        const rgbHex = hex.replace("#", "");
        const normalizedHex = rgbHex.length === 3 
            ? rgbHex.split("").map((c) => c + c).join("")
            : rgbHex.slice(0, 6);
        onChange(`#${normalizedHex}${alphaHex}`);
    };

    const handleAlphaChange = (alpha: number) => {
        const alphaHex = alphaToHex(alpha);
        const hex = rgbaValue.replace("#", "").slice(0, 6);
        onChange(`#${hex}${alphaHex}`);
    };

    const currentColor = `hsl(${hue}, 100%, 50%)`;
    const selectedColor = `hsl(${hue}, ${saturation}%, ${lightness}%)`;

    return (
        <div className={cn("space-y-3", className)}>
            {label && (
                <label className="text-sm font-medium text-foreground">{label}</label>
            )}
            
            {/* Color Gradient Area */}
            <div className="relative">
                <div
                    ref={gradientRef}
                    onClick={handleGradientClick}
                    onMouseDown={handleGradientMouseDown}
                    className="relative w-full h-48 rounded-lg border-2 border-white/20 cursor-crosshair overflow-hidden select-none"
                    style={{
                        background: `linear-gradient(to top, black, transparent), linear-gradient(to right, white, ${currentColor})`,
                    }}
                >
                    {/* Selection Indicator */}
                    <div
                        className="absolute w-4 h-4 rounded-full border-2 border-white shadow-lg pointer-events-none"
                        style={{
                            left: `${saturation}%`,
                            // Convert HSL lightness back to Y position
                            // lightness = yRatio * maxLightness, where maxLightness = 100 - (saturation / 2)
                            // yRatio = lightness / maxLightness
                            // y = (1 - yRatio) * 100%
                            top: (() => {
                                const maxLightness = 100 - (saturation / 2);
                                const yRatio = maxLightness > 0 ? lightness / maxLightness : 0;
                                return `${(1 - yRatio) * 100}%`;
                            })(),
                            transform: "translate(-50%, -50%)",
                            backgroundColor: selectedColor,
                        }}
                    />
                </div>
                
                {/* Hue Slider */}
                <div className="mt-2 flex items-center gap-2 min-w-0">
                    <div
                        ref={hueRef}
                        onClick={handleHueClick}
                        onMouseDown={handleHueMouseDown}
                        className="relative w-8 h-48 rounded border-2 border-white/20 cursor-pointer overflow-hidden flex-shrink-0 select-none"
                        style={{
                            background: "linear-gradient(to bottom, #ff0000 0%, #ffff00 17%, #00ff00 33%, #00ffff 50%, #0000ff 67%, #ff00ff 83%, #ff0000 100%)",
                        }}
                    >
                        <div
                            className="absolute left-0 right-0 w-full h-1 bg-white border border-black/20 pointer-events-none"
                            style={{
                                top: `${(hue / 360) * 100}%`,
                                transform: "translateY(-50%)",
                            }}
                        />
                    </div>
                    
                    {/* Current Color Swatch and Hex Input */}
                    <div className="flex-1 space-y-2 min-w-0">
                        <div className="flex items-center gap-2 min-w-0">
                            <div
                                className="w-12 h-12 rounded-lg border-2 border-white/20 flex-shrink-0"
                                style={{ backgroundColor: selectedColor }}
                            />
                            <input
                                type="text"
                                value={hexValue}
                                onChange={(e) => handleHexChange(e.target.value)}
                                className="flex-1 min-w-0 px-2 py-2 rounded-lg border border-white/10 bg-background/40 text-xs font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                                placeholder="#000000"
                            />
                        </div>
                        
                        {/* Alpha Slider */}
                        <div className="space-y-1">
                            <div className="flex items-center justify-between">
                                <label className="text-xs text-muted-foreground">Opacity</label>
                                <span className="text-xs font-mono text-muted-foreground">
                                    {Math.round(alphaValue * 100)}%
                                </span>
                            </div>
                            <div className="relative">
                                {/* Color gradient overlay */}
                                <div
                                    className="absolute inset-0 rounded-lg"
                                    style={{
                                        background: `linear-gradient(to right, ${selectedColor}00, ${selectedColor}ff)`,
                                    }}
                                />
                                <input
                                    type="range"
                                    min="0"
                                    max="1"
                                    step="0.01"
                                    value={alphaValue}
                                    onChange={(e) => handleAlphaChange(parseFloat(e.target.value))}
                                    className="relative w-full h-2 rounded-lg appearance-none cursor-pointer accent-primary"
                                    style={{
                                        background: `rgba(128, 128, 128, 0.4)`,
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

