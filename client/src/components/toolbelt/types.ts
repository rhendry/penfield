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
}

export interface ToolSlotProps extends ToolbeltSlot {
    onClick: () => void;
}
