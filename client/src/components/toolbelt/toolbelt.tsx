import { ToolbeltProps, ToolbeltConfig } from "./types";
import { ToolSlot } from "./tool-slot";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useKeyboardHotkeys } from "@/hooks/use-keyboard-hotkeys";

// Keyboard row mappings
const KEYBOARD_ROWS = [
    ["1", "2", "3", "4", "5", "6", "7"], // Row 1: Numbers
    ["Q", "W", "E", "R", "T", "Y", "U"], // Row 2: Q row
    ["A", "S", "D", "F", "G", "H", "J"], // Row 3: A row
    ["Z", "X", "C", "V", "B", "N", "M"], // Row 4: Z row
];

// Row offsets for keyboard-like staggered layout
const ROW_OFFSETS = ["ml-0", "ml-8", "ml-16", "ml-24"];

/**
 * Group slots by keyboard row based on hotkey and configuration
 */
function groupSlotsByRow(
    slots: ToolbeltProps["slots"],
    config: Required<ToolbeltConfig>
) {
    const rows: Array<typeof slots> = [];
    
    // Initialize rows based on config
    for (let i = 0; i < config.rows; i++) {
        rows.push([]);
    }

    // Get the valid keys for each row based on config
    const validKeysPerRow = KEYBOARD_ROWS.slice(0, config.rows).map((row) =>
        row.slice(0, config.cols)
    );

    // Group slots by their hotkey
    slots.forEach((slot) => {
        const key = slot.hotkey.toUpperCase();
        for (let rowIndex = 0; rowIndex < validKeysPerRow.length; rowIndex++) {
            if (validKeysPerRow[rowIndex].includes(key)) {
                rows[rowIndex].push(slot);
                break;
            }
        }
    });

    // Sort each row by hotkey order
    rows.forEach((row) => {
        row.sort((a, b) => {
            const aKey = a.hotkey.toUpperCase();
            const bKey = b.hotkey.toUpperCase();
            const aRowIndex = validKeysPerRow.findIndex((keys) => keys.includes(aKey));
            const bRowIndex = validKeysPerRow.findIndex((keys) => keys.includes(bKey));
            
            if (aRowIndex !== bRowIndex) return aRowIndex - bRowIndex;
            
            const aKeyIndex = validKeysPerRow[aRowIndex].indexOf(aKey);
            const bKeyIndex = validKeysPerRow[bRowIndex].indexOf(bKey);
            return aKeyIndex - bKeyIndex;
        });
    });

    return rows;
}

export function Toolbelt({
    slots,
    onSlotClick,
    className,
    keyboardEnabled = true,
    config = { rows: 3, cols: 4 },
}: ToolbeltProps) {
    // Clamp config values to valid ranges
    const normalizedConfig: Required<ToolbeltConfig> = {
        rows: Math.max(1, Math.min(4, config.rows ?? 3)),
        cols: Math.max(1, Math.min(7, config.cols ?? 4)),
    };

    const rows = groupSlotsByRow(slots, normalizedConfig);
    
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
            {rows.map((row, rowIndex) => (
                <div
                    key={rowIndex}
                    className={cn("flex gap-3", ROW_OFFSETS[rowIndex])}
                >
                    {row.map((slot) => (
                        <ToolSlot
                            key={slot.id}
                            {...slot}
                            onClick={() => onSlotClick(slot.id)}
                        />
                    ))}
                </div>
            ))}
        </motion.div>
    );
}
