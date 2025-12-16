import { useEffect, useCallback, useRef } from "react";

export interface UseToolkitExplorerOptions {
    enabled?: boolean;
    onToggle: () => void;
}

/**
 * Hook to handle [space] key to open/close toolkit explorer.
 * Coordinates with toolbelt keyboard handler to disable toolbelt hotkeys when explorer is open.
 */
export function useToolkitExplorer({
    enabled = true,
    onToggle,
}: UseToolkitExplorerOptions) {
    const onToggleRef = useRef(onToggle);

    useEffect(() => {
        onToggleRef.current = onToggle;
    }, [onToggle]);

    useEffect(() => {
        if (!enabled) return;

        const handleKeyDown = (event: KeyboardEvent) => {
            if (
                event.target instanceof HTMLInputElement ||
                event.target instanceof HTMLTextAreaElement ||
                event.target instanceof HTMLSelectElement
            ) {
                return;
            }

            if (event.key === " " || event.code === "Space") {
                event.preventDefault();
                event.stopPropagation();
                onToggleRef.current();
            }
        };

        window.addEventListener("keydown", handleKeyDown, { capture: true });
        return () => {
            window.removeEventListener("keydown", handleKeyDown, { capture: true });
        };
    }, [enabled]);
}

