import { createContext, useContext, useState, ReactNode } from "react";
import { ToolbeltSlot, QuickSelectSlot, Tool } from "@/components/toolbelt/types";
import { Toolbelt as ToolbeltType } from "@/components/toolbelt/toolbelt-selector";

export interface ToolkitContextValue {
    // Current equipped toolbelt
    equippedToolbelt: ToolbeltType | null;
    setEquippedToolbelt: (toolbelt: ToolbeltType | null) => void;

    // Toolbelt slots
    toolbeltSlots: ToolbeltSlot[];
    setToolbeltSlots: (slots: ToolbeltSlot[]) => void;

    // Quick-select slots
    quickSelectSlots: QuickSelectSlot[];
    setQuickSelectSlots: (slots: QuickSelectSlot[]) => void;
    addQuickSelectSlot: (tool: Tool) => void;
    removeQuickSelectSlot: (slotId: string) => void;

    // Toolkit explorer state
    isExplorerOpen: boolean;
    setIsExplorerOpen: React.Dispatch<React.SetStateAction<boolean>>;

    // Available toolkits/tools (loaded on mount)
    availableTools: Tool[];
    setAvailableTools: (tools: Tool[]) => void;
    availableToolbelts: ToolbeltType[];
    setAvailableToolbelts: (toolbelts: ToolbeltType[]) => void;
}

const ToolkitContext = createContext<ToolkitContextValue | undefined>(undefined);

export interface ToolkitProviderProps {
    children: ReactNode;
}

export function ToolkitProvider({ children }: ToolkitProviderProps) {
    const [equippedToolbelt, setEquippedToolbelt] = useState<ToolbeltType | null>(null);
    const [toolbeltSlots, setToolbeltSlots] = useState<ToolbeltSlot[]>([]);
    const [quickSelectSlots, setQuickSelectSlots] = useState<QuickSelectSlot[]>([]);
    const [isExplorerOpen, setIsExplorerOpen] = useState(false);
    const [availableTools, setAvailableTools] = useState<Tool[]>([]);
    const [availableToolbelts, setAvailableToolbelts] = useState<ToolbeltType[]>([]);

    // LRU policy for quick-select slots
    const addQuickSelectSlot = (tool: Tool) => {
        setQuickSelectSlots((current) => {
            // Check if tool already exists
            const existingIndex = current.findIndex((slot) => slot.tool.id === tool.id);
            if (existingIndex !== -1) {
                // Move to end (most recently used)
                const updated = [...current];
                const [existing] = updated.splice(existingIndex, 1);
                updated.push({ ...existing, lastUsedAt: new Date() });
                return updated;
            }

            // If full (5 slots), remove LRU (oldest lastUsedAt)
            if (current.length >= 5) {
                const sorted = [...current].sort(
                    (a, b) =>
                        (a.lastUsedAt?.getTime() ?? 0) - (b.lastUsedAt?.getTime() ?? 0)
                );
                const updated = sorted.slice(1);
                updated.push({
                    id: `quick-select-${Date.now()}`,
                    tool,
                    position: updated.length,
                    lastUsedAt: new Date(),
                });
                return updated;
            }

            // Add new slot
            return [
                ...current,
                {
                    id: `quick-select-${Date.now()}`,
                    tool,
                    position: current.length,
                    lastUsedAt: new Date(),
                },
            ];
        });
    };

    const removeQuickSelectSlot = (slotId: string) => {
        setQuickSelectSlots((current) => {
            const filtered = current.filter((slot) => slot.id !== slotId);
            // Reassign positions
            return filtered.map((slot, index) => ({
                ...slot,
                position: index,
            }));
        });
    };

    const value: ToolkitContextValue = {
        equippedToolbelt,
        setEquippedToolbelt,
        toolbeltSlots,
        setToolbeltSlots,
        quickSelectSlots,
        setQuickSelectSlots,
        addQuickSelectSlot,
        removeQuickSelectSlot,
        isExplorerOpen,
        setIsExplorerOpen,
        availableTools,
        setAvailableTools,
        availableToolbelts,
        setAvailableToolbelts,
    };

    return <ToolkitContext.Provider value={value}>{children}</ToolkitContext.Provider>;
}

export function useToolkit(): ToolkitContextValue {
    const context = useContext(ToolkitContext);
    if (context === undefined) {
        throw new Error("useToolkit must be used within a ToolkitProvider");
    }
    return context;
}

