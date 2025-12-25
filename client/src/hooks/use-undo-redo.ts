import { useState, useEffect, useCallback, useRef } from "react";
import type { PixelAssetContent } from "@shared/types/pixel-asset";
import {
    type UndoableAction,
    serializeActions,
    deserializeActions,
    applyUndoAction,
    applyRedoAction,
} from "@/utils/undo-redo-actions";

const MAX_STACK_SIZE = 50;
const STORAGE_KEY_PREFIX = "undo-redo-";

/**
 * Hook for managing undo/redo functionality
 * Persists state to session storage, unique per asset
 */
export function useUndoRedo(assetId: string | undefined, content: PixelAssetContent, setContent: (content: PixelAssetContent) => void) {
    const [undoStack, setUndoStack] = useState<UndoableAction[]>([]);
    const [redoStack, setRedoStack] = useState<UndoableAction[]>([]);
    const previousAssetIdRef = useRef<string | undefined>(undefined);
    const isApplyingActionRef = useRef(false);

    // Storage key for this asset
    const storageKey = assetId ? `${STORAGE_KEY_PREFIX}${assetId}` : null;

    // Load from session storage on mount or asset change
    useEffect(() => {
        if (!storageKey) {
            setUndoStack([]);
            setRedoStack([]);
            return;
        }

        // Clear stacks when asset changes
        if (previousAssetIdRef.current !== undefined && previousAssetIdRef.current !== assetId) {
            setUndoStack([]);
            setRedoStack([]);
        }

        previousAssetIdRef.current = assetId;

        try {
            const stored = sessionStorage.getItem(storageKey);
            if (stored) {
                const parsed = deserializeActions(stored);
                setUndoStack(parsed);
            }
        } catch (error) {
            console.error("Failed to load undo/redo state from session storage:", error);
        }
    }, [storageKey, assetId]);

    // Save to session storage whenever stacks change
    useEffect(() => {
        if (!storageKey) return;

        try {
            sessionStorage.setItem(storageKey, serializeActions(undoStack));
        } catch (error) {
            console.error("Failed to save undo/redo state to session storage:", error);
        }
    }, [storageKey, undoStack]);

    // Push a new action onto the undo stack
    const pushAction = useCallback(
        (action: UndoableAction) => {
            if (isApplyingActionRef.current) return; // Don't record actions we're applying

            setUndoStack((prev) => {
                const newStack = [...prev, action];
                // Limit stack size
                if (newStack.length > MAX_STACK_SIZE) {
                    return newStack.slice(-MAX_STACK_SIZE);
                }
                return newStack;
            });
            // Clear redo stack when new action is pushed
            setRedoStack([]);
        },
        []
    );

    // Undo the last action
    const undo = useCallback(() => {
        if (undoStack.length === 0) return;

        const action = undoStack[undoStack.length - 1];
        isApplyingActionRef.current = true;

        try {
            const newContent = applyUndoAction(content, action);
            setContent(newContent);

            setUndoStack((prev) => prev.slice(0, -1));
            setRedoStack((prev) => [...prev, action]);
        } finally {
            isApplyingActionRef.current = false;
        }
    }, [undoStack, content, setContent]);

    // Redo the last undone action
    const redo = useCallback(() => {
        if (redoStack.length === 0) return;

        const action = redoStack[redoStack.length - 1];
        isApplyingActionRef.current = true;

        try {
            const newContent = applyRedoAction(content, action);
            setContent(newContent);

            setRedoStack((prev) => prev.slice(0, -1));
            setUndoStack((prev) => [...prev, action]);
        } finally {
            isApplyingActionRef.current = false;
        }
    }, [redoStack, content, setContent]);

    const canUndo = undoStack.length > 0;
    const canRedo = redoStack.length > 0;

    return {
        undo,
        redo,
        pushAction,
        canUndo,
        canRedo,
    };
}

