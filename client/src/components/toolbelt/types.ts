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

export interface ToolbeltProps {
    slots: ToolbeltSlot[];
    onSlotClick: (slotId: string) => void;
    className?: string;
    /**
     * Whether keyboard hotkeys are enabled. Defaults to true.
     * When false, keyboard input will not be captured.
     */
    keyboardEnabled?: boolean;
}

export interface ToolSlotProps extends ToolbeltSlot {
    onClick: () => void;
}
