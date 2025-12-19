import { useEffect, useRef } from "react";

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
            // Space is a global hotkey - should work everywhere
            // But don't handle it if Ctrl is pressed (Ctrl+Space is for utilities panel)
            if ((event.key === " " || event.code === "Space") && !event.ctrlKey && !event.metaKey) {
                event.preventDefault();
                event.stopPropagation();
                onToggleRef.current();
            }
        };

        // Use capture phase to catch events before they reach inputs
        window.addEventListener("keydown", handleKeyDown, { capture: true });
        return () => {
            window.removeEventListener("keydown", handleKeyDown, { capture: true });
        };
    }, [enabled]);
}

