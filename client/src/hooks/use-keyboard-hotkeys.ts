import { useEffect, useState, useCallback, useRef } from "react";

export interface UseKeyboardHotkeysOptions {
    enabled?: boolean;
    slots: Array<{ id: string; hotkey: string }>;
    onHotkeyPress: (slotId: string) => void;
}

/**
 * Hook to capture keyboard hotkeys for toolbelt slots.
 * Returns whether keyboard input is currently being captured.
 * Designed to never drop inputs, even with rapid key presses.
 */
export function useKeyboardHotkeys({
    enabled = true,
    slots,
    onHotkeyPress,
}: UseKeyboardHotkeysOptions) {
    const [isCapturing, setIsCapturing] = useState(false);
    const timeoutRef = useRef<number | null>(null);
    const lastCaptureTimeRef = useRef<number>(0);

    const handleKeyDown = useCallback(
        (event: KeyboardEvent) => {
            // Don't capture if disabled or if user is typing in an input/textarea
            if (!enabled) return;
            if (
                event.target instanceof HTMLInputElement ||
                event.target instanceof HTMLTextAreaElement ||
                event.target instanceof HTMLSelectElement
            ) {
                setIsCapturing(false);
                return;
            }

            const pressedKey = event.key.toUpperCase();

            // Find matching slot by hotkey
            const matchingSlot = slots.find(
                (slot) => slot.hotkey.toUpperCase() === pressedKey
            );

            if (matchingSlot) {
                event.preventDefault();
                event.stopPropagation();
                
                // Always process the input immediately - never drop it
                const now = Date.now();
                lastCaptureTimeRef.current = now;
                
                // Update visual feedback immediately
                setIsCapturing(true);
                
                // Call the handler immediately - don't defer
                onHotkeyPress(matchingSlot.id);

                // Clear any existing timeout
                if (timeoutRef.current !== null) {
                    clearTimeout(timeoutRef.current);
                }

                // Reset capturing indicator after a very brief moment
                // Use the capture time to ensure we don't reset if a new key was pressed
                timeoutRef.current = window.setTimeout(() => {
                    // Only reset if no new key was pressed since this timeout was set
                    if (Date.now() - lastCaptureTimeRef.current >= 80) {
                        setIsCapturing(false);
                    }
                    timeoutRef.current = null;
                }, 100);
            }
        },
        [enabled, slots, onHotkeyPress]
    );

    useEffect(() => {
        if (!enabled) {
            setIsCapturing(false);
            if (timeoutRef.current !== null) {
                clearTimeout(timeoutRef.current);
                timeoutRef.current = null;
            }
            return;
        }

        window.addEventListener("keydown", handleKeyDown, { capture: true });
        return () => {
            window.removeEventListener("keydown", handleKeyDown, { capture: true });
            if (timeoutRef.current !== null) {
                clearTimeout(timeoutRef.current);
                timeoutRef.current = null;
            }
        };
    }, [enabled, handleKeyDown]);

    return { isCapturing };
}

