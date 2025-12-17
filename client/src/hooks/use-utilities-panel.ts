import { useEffect, useCallback, useRef } from "react";

export interface UseUtilitiesPanelOptions {
    enabled?: boolean;
    onToggle: () => void;
}

/**
 * Hook to handle Control+Space key to toggle utilities panel.
 */
export function useUtilitiesPanel({
    enabled = true,
    onToggle,
}: UseUtilitiesPanelOptions) {
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

            // Control+Space or Ctrl+Space
            if ((event.ctrlKey || event.metaKey) && (event.key === " " || event.code === "Space")) {
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

