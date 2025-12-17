import { LucideIcon } from "lucide-react";
import { ReactNode } from "react";

export interface Tool {
    id: string;
    name: string;
    // Legacy support: icon can be a LucideIcon component (for backward compatibility)
    icon?: LucideIcon;
    // New icon system: iconType and iconName
    iconType?: "lucide" | "custom";
    iconName?: string;
    // Badge support
    badgeType?: "lucide" | "custom";
    badgeName?: string;
    badgeAlignment?: "top-right" | "top-left" | "bottom-right" | "bottom-left" | "center";
    description?: string;
    hotkey?: string;
    // Utilities - Component(s) to render in the utilities panel when this tool is selected
    // Can be a single component or array of components
    utilities?: ReactNode | ReactNode[];
}

export interface ToolbeltSlot {
    id: string;
    hotkey: string; // e.g., "Q", "W", "E", "R"
    tool?: Tool;
    isActive?: boolean;
}

export interface ToolbeltConfig {
    /**
     * Number of rows (1-4). Defaults to 3.
     */
    rows?: number;
    /**
     * Number of columns per row (1-7). Defaults to 4.
     */
    cols?: number;
}

export interface ToolbeltProps {
    slots: ToolbeltSlot[];
    onSlotClick: (slotId: string) => void;
    className?: string;
    /**
     * Whether keyboard hotkeys are enabled. Defaults to true.
     * When false, keyboard input will not be captured.
     */
    keyboardEnabled?: boolean;
    /**
     * Configuration for toolbelt layout. Defaults to 3 rows, 4 cols.
     */
    config?: ToolbeltConfig;
}

export interface ToolSlotProps extends ToolbeltSlot {
    onClick: () => void;
}

export interface QuickSelectSlot {
    id: string;
    tool: Tool;
    position: number; // 0-4
    lastUsedAt?: Date;
    isActive?: boolean;
}
