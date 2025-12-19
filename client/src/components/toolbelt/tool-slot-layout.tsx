import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { ToolbeltConfig } from "./types";

// Keyboard row mappings
const KEYBOARD_ROWS = [
    ["1", "2", "3", "4", "5", "6", "7"], // Row 1: Numbers
    ["Q", "W", "E", "R", "T", "Y", "U"], // Row 2: Q row
    ["A", "S", "D", "F", "G", "H", "J"], // Row 3: A row
    ["Z", "X", "C", "V", "B", "N", "M"], // Row 4: Z row
];

// Row offsets for keyboard-like staggered layout
const ROW_OFFSETS = ["ml-0", "ml-8", "ml-16", "ml-24"];

export interface ToolSlotLayoutProps<T> {
    /**
     * Array of items to display in the layout
     */
    items: T[];
    /**
     * Function to get the hotkey for an item
     */
    getHotkey: (item: T) => string;
    /**
     * Function to get a unique ID for an item
     */
    getId: (item: T) => string;
    /**
     * Render prop for rendering each item
     */
    renderItem: (item: T) => ReactNode;
    /**
     * Configuration for layout (rows and columns)
     */
    config?: ToolbeltConfig;
    /**
     * Additional CSS classes for the container
     */
    className?: string;
}

/**
 * Groups items by keyboard row based on hotkey and configuration
 */
function groupItemsByRow<T>(
    items: T[],
    getHotkey: (item: T) => string,
    config: Required<ToolbeltConfig>
): Array<T[]> {
    const rows: Array<T[]> = [];

    // Initialize rows based on config
    for (let i = 0; i < config.rows; i++) {
        rows.push([]);
    }

    // Get the valid keys for each row based on config
    const validKeysPerRow = KEYBOARD_ROWS.slice(0, config.rows).map((row) =>
        row.slice(0, config.cols)
    );

    // Group items by their hotkey
    items.forEach((item) => {
        const key = getHotkey(item).toUpperCase();
        for (let rowIndex = 0; rowIndex < validKeysPerRow.length; rowIndex++) {
            if (validKeysPerRow[rowIndex].includes(key)) {
                rows[rowIndex].push(item);
                break;
            }
        }
    });

    // Sort each row by hotkey order
    rows.forEach((row) => {
        row.sort((a, b) => {
            const aKey = getHotkey(a).toUpperCase();
            const bKey = getHotkey(b).toUpperCase();
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

/**
 * Shared layout component for toolbelt and toolbelt selector.
 * Handles keyboard-staggered row layout based on hotkeys.
 */
export function ToolSlotLayout<T>({
    items,
    getHotkey,
    getId,
    renderItem,
    config = { rows: 3, cols: 4 },
    className,
}: ToolSlotLayoutProps<T>) {
    // Clamp config values to valid ranges
    const normalizedConfig: Required<ToolbeltConfig> = {
        rows: Math.max(1, Math.min(4, config.rows ?? 3)),
        cols: Math.max(1, Math.min(7, config.cols ?? 4)),
    };

    const rows = groupItemsByRow(items, getHotkey, normalizedConfig);

    return (
        <div className={cn("flex flex-col gap-2 pb-0", className)}>
            {rows.map((row, rowIndex) => (
                <div
                    key={rowIndex}
                    className={cn("flex gap-2", ROW_OFFSETS[rowIndex])}
                >
                    {row.map((item) => (
                        <div key={getId(item)}>
                            {renderItem(item)}
                        </div>
                    ))}
                </div>
            ))}
        </div>
    );
}

