import { LucideIcon } from "lucide-react";

export interface Tool {
    id: string;
    name: string;
    icon: LucideIcon;
    description?: string;
    hotkey?: string;
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
