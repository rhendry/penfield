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
    const isInternalChangeRef = useRef(false);
    const isInitialMountRef = useRef(true);

    // Initialize HSL from hex value (only when external value changes)
    useEffect(() => {
        if (!isInternalChangeRef.current) {
            const [r, g, b] = hexToRgb(hexValue);
            const [h, s, l] = rgbToHsl(r, g, b);
            setHue(h);
            setSaturation(s);
            setLightness(l);
        }
        isInternalChangeRef.current = false;
    }, [hexValue]);

    // Update color when HSL changes from user interaction
    useEffect(() => {
        if (isInitialMountRef.current) {
            isInitialMountRef.current = false;
            return;
        }
        isInternalChangeRef.current = true;
        const [r, g, b] = hslToRgb(hue, saturation, lightness);
        const hex = rgbToHex(r, g, b);
        const alphaHex = alphaToHex(alphaValue);
        onChange(`#${hex.replace("#", "")}${alphaHex}`);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [hue, saturation, lightness, alphaValue]);

    const handleGradientClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!gradientRef.current) return;
        const rect = gradientRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const s = Math.max(0, Math.min(100, (x / rect.width) * 100));
        const l = Math.max(0, Math.min(100, 100 - (y / rect.height) * 100));
        setSaturation(s);
        setLightness(l);
    };

    const handleHueClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!hueRef.current) return;
        const rect = hueRef.current.getBoundingClientRect();
        const y = e.clientY - rect.top;
        const h = Math.max(0, Math.min(360, (y / rect.height) * 360));
        setHue(h);
    };

    const handleMouseMove = (e: MouseEvent) => {
        if (isDragging && gradientRef.current) {
            const rect = gradientRef.current.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const s = Math.max(0, Math.min(100, (x / rect.width) * 100));
            const l = Math.max(0, Math.min(100, 100 - (y / rect.height) * 100));
            setSaturation(s);
            setLightness(l);
        }
        if (isDraggingHue && hueRef.current) {
            const rect = hueRef.current.getBoundingClientRect();
            const y = e.clientY - rect.top;
            const h = Math.max(0, Math.min(360, (y / rect.height) * 360));
            setHue(h);
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
        setIsDraggingHue(false);
    };

    useEffect(() => {
        if (isDragging || isDraggingHue) {
            window.addEventListener("mousemove", handleMouseMove);
            window.addEventListener("mouseup", handleMouseUp);
            return () => {
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
                    onMouseDown={() => setIsDragging(true)}
                    className="relative w-full h-48 rounded-lg border-2 border-white/20 cursor-crosshair overflow-hidden"
                    style={{
                        background: `linear-gradient(to top, black, transparent), linear-gradient(to right, white, ${currentColor})`,
                    }}
                >
                    {/* Selection Indicator */}
                    <div
                        className="absolute w-4 h-4 rounded-full border-2 border-white shadow-lg pointer-events-none"
                        style={{
                            left: `${saturation}%`,
                            top: `${100 - lightness}%`,
                            transform: "translate(-50%, -50%)",
                            backgroundColor: selectedColor,
                        }}
                    />
                </div>
                
                {/* Hue Slider */}
                <div className="mt-2 flex items-center gap-3">
                    <div
                        ref={hueRef}
                        onClick={handleHueClick}
                        onMouseDown={() => setIsDraggingHue(true)}
                        className="relative w-8 h-48 rounded border-2 border-white/20 cursor-pointer overflow-hidden flex-shrink-0"
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
                    <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                            <div
                                className="w-12 h-12 rounded-lg border-2 border-white/20 flex-shrink-0"
                                style={{ backgroundColor: selectedColor }}
                            />
                            <input
                                type="text"
                                value={hexValue}
                                onChange={(e) => handleHexChange(e.target.value)}
                                className="flex-1 px-3 py-2 rounded-lg border border-white/10 bg-background/40 text-sm font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
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
                                    className="relative w-full h-2 rounded-lg appearance-none cursor-pointer bg-transparent accent-primary"
                                    style={{
                                        background: `linear-gradient(to right, transparent 0%, transparent ${alphaValue * 100}%, rgba(255,255,255,0.3) ${alphaValue * 100}%, rgba(255,255,255,0.3) 100%)`,
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

