import { ToolbeltProps } from "./types";
import { ToolSlot } from "./tool-slot";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useKeyboardHotkeys } from "@/hooks/use-keyboard-hotkeys";
import { ToolSlotLayout } from "./tool-slot-layout";

export function Toolbelt({
    slots,
    onSlotClick,
    className,
    keyboardEnabled = true,
    config = { rows: 3, cols: 4 },
}: ToolbeltProps) {
    useKeyboardHotkeys({
        enabled: keyboardEnabled,
        slots,
        onHotkeyPress: onSlotClick,
    });

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
                        onClick={() => onSlotClick(slot.id)}
                    />
                )}
                config={config}
            />
        </motion.div>
    );
}
