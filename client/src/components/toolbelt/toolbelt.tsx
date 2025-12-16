import { ToolbeltProps } from "./types";
import { ToolSlot } from "./tool-slot";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useKeyboardHotkeys } from "@/hooks/use-keyboard-hotkeys";

// Group slots by keyboard row based on hotkey
function groupSlotsByRow(slots: ToolbeltProps["slots"]) {
    const row1: typeof slots = []; // 1, 2, 3, 4
    const row2: typeof slots = []; // Q, W, E, R
    const row3: typeof slots = []; // A, S, D, F

    slots.forEach((slot) => {
        const key = slot.hotkey.toUpperCase();
        if (["1", "2", "3", "4"].includes(key)) {
            row1.push(slot);
        } else if (["Q", "W", "E", "R"].includes(key)) {
            row2.push(slot);
        } else if (["A", "S", "D", "F"].includes(key)) {
            row3.push(slot);
        }
    });

    return { row1, row2, row3 };
}

export function Toolbelt({
    slots,
    onSlotClick,
    className,
    keyboardEnabled = true,
}: ToolbeltProps) {
    const { row1, row2, row3 } = groupSlotsByRow(slots);
    
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
                "fixed bottom-8 left-8 flex flex-col gap-3 p-3 rounded-2xl border backdrop-blur-xl shadow-2xl",
                "border-white/10 bg-black/40",
                className
            )}
        >
            {/* Row 1: 1, 2, 3, 4 - No offset */}
            <div className="flex gap-3">
                {row1.map((slot) => (
                    <ToolSlot
                        key={slot.id}
                        {...slot}
                        onClick={() => onSlotClick(slot.id)}
                    />
                ))}
            </div>

            {/* Row 2: Q, W, E, R - Indented by half slot width */}
            <div className="flex gap-3 ml-8">
                {row2.map((slot) => (
                    <ToolSlot
                        key={slot.id}
                        {...slot}
                        onClick={() => onSlotClick(slot.id)}
                    />
                ))}
            </div>

            {/* Row 3: A, S, D, F - Indented by full slot width */}
            <div className="flex gap-3 ml-16">
                {row3.map((slot) => (
                    <ToolSlot
                        key={slot.id}
                        {...slot}
                        onClick={() => onSlotClick(slot.id)}
                    />
                ))}
            </div>
        </motion.div>
    );
}
