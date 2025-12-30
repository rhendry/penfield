import { LucideIcon, Pencil, Eraser, PaintBucket, Layers, Film } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

// Registry of Lucide icons - extend as needed
const LUCIDE_ICON_REGISTRY: Record<string, LucideIcon> = {};

/**
 * Register a Lucide icon manually. Useful for pre-loading common icons.
 */
function registerLucideIcon(iconName: string, icon: LucideIcon): void {
    LUCIDE_ICON_REGISTRY[iconName] = icon;
}

// Pre-register common icons
registerLucideIcon("Pencil", Pencil);
registerLucideIcon("Eraser", Eraser);
registerLucideIcon("PaintBucket", PaintBucket);
registerLucideIcon("Layers", Layers);
registerLucideIcon("Film", Film);

/**
 * Register multiple Lucide icons at once.
 */
export function registerLucideIcons(icons: Record<string, LucideIcon>): void {
    Object.assign(LUCIDE_ICON_REGISTRY, icons);
}

// Dynamic import helper for Lucide icons
async function loadLucideIcon(iconName: string): Promise<LucideIcon | null> {
    // Check registry first
    if (LUCIDE_ICON_REGISTRY[iconName]) {
        return LUCIDE_ICON_REGISTRY[iconName];
    }

    try {
        // Try to dynamically import from lucide-react
        // Note: This requires the icon name to match the export name exactly
        const lucideModule = await import("lucide-react");
        const IconComponent = (lucideModule as any)[iconName] as LucideIcon | undefined;

        if (IconComponent && typeof IconComponent === "function") {
            LUCIDE_ICON_REGISTRY[iconName] = IconComponent;
            return IconComponent;
        }
    } catch (error) {
        console.warn(`Failed to load Lucide icon: ${iconName}`, error);
    }

    return null;
}

// Custom SVG loader
async function loadCustomSvg(iconName: string): Promise<string | null> {
    try {
        const response = await fetch(`/icons/${iconName}`);
        if (response.ok) {
            return await response.text();
        }
    } catch (error) {
        console.warn(`Failed to load custom SVG: ${iconName}`, error);
    }
    return null;
}

export interface IconWithBadgeProps {
    iconType: "lucide" | "custom";
    iconName: string;
    badgeType?: "lucide" | "custom";
    badgeName?: string;
    badgeAlignment?: "top-right" | "top-left" | "bottom-right" | "bottom-left" | "center";
    className?: string;
    size?: number;
}

export function IconWithBadge({
    iconType,
    iconName,
    badgeType,
    badgeName,
    badgeAlignment = "top-right",
    className,
    size = 24,
}: IconWithBadgeProps) {
    const [IconComponent, setIconComponent] = useState<LucideIcon | null>(null);
    const [customSvg, setCustomSvg] = useState<string | null>(null);
    const [BadgeComponent, setBadgeComponent] = useState<LucideIcon | null>(null);
    const [badgeSvg, setBadgeSvg] = useState<string | null>(null);
    const [iconError, setIconError] = useState(false);
    const [badgeError, setBadgeError] = useState(false);

    // Load main icon
    useEffect(() => {
        if (iconType === "lucide") {
            loadLucideIcon(iconName).then((icon) => {
                if (icon) {
                    setIconComponent(icon);
                    setIconError(false);
                } else {
                    setIconError(true);
                }
            });
        } else {
            loadCustomSvg(iconName).then((svg) => {
                if (svg) {
                    setCustomSvg(svg);
                    setIconError(false);
                } else {
                    setIconError(true);
                }
            });
        }
    }, [iconType, iconName]);

    // Load badge icon
    useEffect(() => {
        if (badgeType && badgeName) {
            if (badgeType === "lucide") {
                loadLucideIcon(badgeName).then((icon) => {
                    if (icon) {
                        setBadgeComponent(icon);
                        setBadgeError(false);
                    } else {
                        setBadgeError(true);
                    }
                });
            } else {
                loadCustomSvg(badgeName).then((svg) => {
                    if (svg) {
                        setBadgeSvg(svg);
                        setBadgeError(false);
                    } else {
                        setBadgeError(true);
                    }
                });
            }
        }
    }, [badgeType, badgeName]);

    // Badge alignment classes
    const badgePositionClasses = {
        "top-right": "top-0 right-0 -translate-y-1/2 translate-x-1/2",
        "top-left": "top-0 left-0 -translate-y-1/2 -translate-x-1/2",
        "bottom-right": "bottom-0 right-0 translate-y-1/2 translate-x-1/2",
        "bottom-left": "bottom-0 left-0 translate-y-1/2 -translate-x-1/2",
        "center": "top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2",
    };

    const badgeSize = Math.max(8, size * 0.4); // Badge is 40% of icon size, minimum 8px

    return (
        <div className={cn("relative inline-flex items-center justify-center", className)} style={{ width: size, height: size }}>
            {/* Main Icon */}
            {iconError ? (
                <div
                    className="rounded border border-dashed border-muted-foreground/30"
                    style={{ width: size, height: size }}
                />
            ) : iconType === "lucide" && IconComponent ? (
                <IconComponent size={size} />
            ) : customSvg ? (
                <div
                    dangerouslySetInnerHTML={{ __html: customSvg }}
                    style={{ width: size, height: size }}
                    className="flex items-center justify-center [&>svg]:w-full [&>svg]:h-full"
                />
            ) : (
                <div className="animate-pulse rounded bg-muted" style={{ width: size, height: size }} />
            )}

            {/* Badge Overlay */}
            {badgeType && badgeName && !badgeError && (
                <div
                    className={cn(
                        "absolute flex items-center justify-center rounded-full bg-background border-2 border-background",
                        badgePositionClasses[badgeAlignment]
                    )}
                    style={{ width: badgeSize, height: badgeSize }}
                >
                    {badgeType === "lucide" && BadgeComponent ? (
                        <BadgeComponent size={badgeSize * 0.6} className="text-foreground" />
                    ) : badgeSvg ? (
                        <div
                            dangerouslySetInnerHTML={{ __html: badgeSvg }}
                            style={{ width: badgeSize * 0.6, height: badgeSize * 0.6 }}
                            className="flex items-center justify-center [&>svg]:w-full [&>svg]:h-full text-foreground"
                        />
                    ) : null}
                </div>
            )}
        </div>
    );
}

