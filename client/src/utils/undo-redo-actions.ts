import type { PixelAssetContent, PixelObject } from "@shared/types/pixel-asset";

/**
 * Types of undoable actions
 */
export type UndoableActionType = "PIXEL_CHANGE" | "OBJECT_PROPERTY_CHANGE";

/**
 * Represents a single undoable action
 */
export interface UndoableAction {
    type: UndoableActionType;
    objectId: string;
    before: Partial<PixelObject>;
    after: Partial<PixelObject>;
    timestamp: number;
}

/**
 * Serialize an action for session storage
 */
export function serializeAction(action: UndoableAction): string {
    return JSON.stringify(action);
}

/**
 * Deserialize an action from session storage
 */
export function deserializeAction(serialized: string): UndoableAction {
    return JSON.parse(serialized);
}

/**
 * Serialize actions array for session storage
 */
export function serializeActions(actions: UndoableAction[]): string {
    return JSON.stringify(actions);
}

/**
 * Deserialize actions array from session storage
 */
export function deserializeActions(serialized: string): UndoableAction[] {
    return JSON.parse(serialized);
}

/**
 * Apply an undo action to content (restore before state)
 */
export function applyUndoAction(content: PixelAssetContent, action: UndoableAction): PixelAssetContent {
    return applyActionToContent(content, action, "before");
}

/**
 * Apply a redo action to content (restore after state)
 */
export function applyRedoAction(content: PixelAssetContent, action: UndoableAction): PixelAssetContent {
    return applyActionToContent(content, action, "after");
}

/**
 * Internal helper to apply action state to content
 */
function applyActionToContent(
    content: PixelAssetContent,
    action: UndoableAction,
    state: "before" | "after"
): PixelAssetContent {
    const stateToApply = state === "before" ? action.before : action.after;

    const updateObject = (obj: PixelObject): PixelObject => {
        if (obj.id === action.objectId) {
            return {
                ...obj,
                ...stateToApply,
                // Deep merge pixels if they exist
                pixels: stateToApply.pixels ? { ...stateToApply.pixels } : obj.pixels,
            };
        }
        return {
            ...obj,
            children: obj.children.map(updateObject),
        };
    };

    return {
        ...content,
        objects: content.objects.map(updateObject),
    };
}

/**
 * Create a pixel change action
 */
export function createPixelChangeAction(
    objectId: string,
    beforePixels: Record<string, string>,
    afterPixels: Record<string, string>
): UndoableAction {
    return {
        type: "PIXEL_CHANGE",
        objectId,
        before: { pixels: beforePixels },
        after: { pixels: afterPixels },
        timestamp: Date.now(),
    };
}

/**
 * Merge multiple pixel changes into a single action
 * Used for batching operations (e.g., entire pen stroke)
 */
export function mergePixelChangeActions(actions: UndoableAction[]): UndoableAction | null {
    if (actions.length === 0) return null;
    if (actions.length === 1) return actions[0];

    // All actions must be pixel changes for the same object
    const firstAction = actions[0];
    if (firstAction.type !== "PIXEL_CHANGE") return null;

    const allSameObject = actions.every(
        (a) => a.type === "PIXEL_CHANGE" && a.objectId === firstAction.objectId
    );
    if (!allSameObject) return null;

    // Merge pixels: start with first before, end with last after
    const mergedBefore = { ...(firstAction.before.pixels as Record<string, string>) };
    let mergedAfter = { ...(firstAction.after.pixels as Record<string, string>) };

    // Apply each subsequent action's changes
    for (let i = 1; i < actions.length; i++) {
        const action = actions[i];
        const afterPixels = action.after.pixels as Record<string, string>;
        mergedAfter = { ...mergedAfter, ...afterPixels };
    }

    return {
        type: "PIXEL_CHANGE",
        objectId: firstAction.objectId,
        before: { pixels: mergedBefore },
        after: { pixels: mergedAfter },
        timestamp: actions[actions.length - 1].timestamp,
    };
}

