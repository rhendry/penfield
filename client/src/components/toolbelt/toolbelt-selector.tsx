import { ToolSlotLayout } from "./tool-slot-layout";
import { ToolbeltConfig } from "./types";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { ToolSlot } from "./tool-slot";

export interface Toolbelt {
    id: string;
    name: string;
    description?: string;
    hotkey?: string; // Number key (1-4) for equipping
    config?: ToolbeltConfig;
}

export interface ToolbeltSelectorProps {
    toolbelts: Toolbelt[];
    onSelectToolbelt: (toolbeltId: string) => void;
    className?: string;
    config?: ToolbeltConfig; // Defaults to {rows: 1, cols: 4}
}

/**
 * ToolbeltSelector component - replaces toolbelt when toolkit explorer is open.
 * Shows toolbelts mapped to number keys 1-4.
 */
export function ToolbeltSelector({
    toolbelts,
    onSelectToolbelt,
    className,
    config = { rows: 1, cols: 4 },
}: ToolbeltSelectorProps) {
    // Map toolbelts to slots with hotkeys 1-4
    const slots = toolbelts.slice(0, 4).map((toolbelt, index) => ({
        id: toolbelt.id,
        hotkey: toolbelt.hotkey || String(index + 1),
        tool: {
            id: toolbelt.id,
            name: toolbelt.name,
            // For now, use a placeholder icon - in real implementation, toolbelts might have icons
            icon: undefined,
            description: toolbelt.description,
        },
        isActive: false,
    }));

    return (
        <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className={cn(
                "fixed bottom-8 left-8 p-3 rounded-2xl border backdrop-blur-xl shadow-2xl z-40",
                "border-white/10 bg-black/40",
                className
            )}
        >
            <ToolSlotLayout
                items={slots}
                getHotkey={(slot) => slot.hotkey}
                getId={(slot) => slot.id}
                renderItem={(slot) => (
                    <ToolSlot
                        {...slot}
                        onClick={() => onSelectToolbelt(slot.id)}
                    />
                )}
                config={config}
            />
        </motion.div>
    );
}

