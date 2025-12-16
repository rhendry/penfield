import { useEffect, useCallback } from "react";

export interface UseKeyboardHotkeysOptions {
    enabled?: boolean;
    slots: Array<{ id: string; hotkey: string; tool?: unknown }>;
    onHotkeyPress: (slotId: string) => void;
}

/**
 * Hook to capture keyboard hotkeys for toolbelt slots.
 * Designed to never drop inputs, even with rapid key presses.
 */
export function useKeyboardHotkeys({
    enabled = true,
    slots,
    onHotkeyPress,
}: UseKeyboardHotkeysOptions) {
    const handleKeyDown = useCallback(
        (event: KeyboardEvent) => {
            // Don't capture if disabled or if user is typing in an input/textarea
            if (!enabled) return;
            if (
                event.target instanceof HTMLInputElement ||
                event.target instanceof HTMLTextAreaElement ||
                event.target instanceof HTMLSelectElement
            ) {
                return;
            }

            const pressedKey = event.key.toUpperCase();

            // Find matching slot by hotkey
            const matchingSlot = slots.find(
                (slot) => slot.hotkey.toUpperCase() === pressedKey
            );

            if (matchingSlot && matchingSlot.tool) {
                event.preventDefault();
                event.stopPropagation();
                
                // Only call handler if slot has an assigned tool
                onHotkeyPress(matchingSlot.id);
            }
        },
        [enabled, slots, onHotkeyPress]
    );

    useEffect(() => {
        if (!enabled) return;

        window.addEventListener("keydown", handleKeyDown, { capture: true });
        return () => {
            window.removeEventListener("keydown", handleKeyDown, { capture: true });
        };
    }, [enabled, handleKeyDown]);
}

