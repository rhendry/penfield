import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { SearchResults } from "./search-results";
import { cn } from "@/lib/utils";

export interface Tool {
    id: string;
    name: string;
    description?: string;
    iconType?: "lucide" | "custom";
    iconName?: string;
    badgeType?: "lucide" | "custom";
    badgeName?: string;
    badgeAlignment?: "top-right" | "top-left" | "bottom-right" | "bottom-left" | "center";
}

export interface Toolbelt {
    id: string;
    name: string;
    description?: string;
    hotkey?: string;
}

export interface Action {
    id: string;
    name: string;
    description?: string;
    action: string; // e.g., "create-toolbelt", "delete-toolbelt"
}

export interface ToolkitExplorerProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectTool: (toolId: string) => void;
    onSelectToolbelt: (toolbeltId: string) => void;
    onAction: (action: string) => void;
    tools?: Tool[];
    toolbelts?: Toolbelt[];
    actions?: Action[];
}

/**
 * ToolkitExplorer - Modal component for browsing and selecting tools, toolbelts, and actions.
 * Opens with [space] key, features unified search and keyboard navigation.
 */
export function ToolkitExplorer({
    isOpen,
    onClose,
    onSelectTool,
    onSelectToolbelt,
    onAction,
    tools = [],
    toolbelts = [],
    actions = [],
}: ToolkitExplorerProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedIndex, setSelectedIndex] = useState(0);

    // Reset search and selection when modal opens/closes
    useEffect(() => {
        if (isOpen) {
            setSearchQuery("");
            setSelectedIndex(0);
        }
    }, [isOpen]);

    // Filter and group results
    const filteredResults = useMemo(() => {
        const query = searchQuery.toLowerCase().trim();
        
        if (!query) {
            return {
                actions: actions,
                toolbelts: toolbelts,
                tools: tools,
            };
        }

        const filteredActions = actions.filter(
            (action) =>
                action.name.toLowerCase().includes(query) ||
                action.description?.toLowerCase().includes(query)
        );

        const filteredToolbelts = toolbelts.filter(
            (toolbelt) =>
                toolbelt.name.toLowerCase().includes(query) ||
                toolbelt.description?.toLowerCase().includes(query)
        );

        const filteredTools = tools.filter(
            (tool) =>
                tool.name.toLowerCase().includes(query) ||
                tool.description?.toLowerCase().includes(query)
        );

        return {
            actions: filteredActions,
            toolbelts: filteredToolbelts,
            tools: filteredTools,
        };
    }, [searchQuery, actions, toolbelts, tools]);

    // Flatten results for keyboard navigation
    const flatResults = useMemo(() => {
        const results: Array<{ type: "action" | "toolbelt" | "tool"; item: Action | Toolbelt | Tool }> = [];
        
        filteredResults.actions.forEach((action) => {
            results.push({ type: "action", item: action });
        });
        filteredResults.toolbelts.forEach((toolbelt) => {
            results.push({ type: "toolbelt", item: toolbelt });
        });
        filteredResults.tools.forEach((tool) => {
            results.push({ type: "tool", item: tool });
        });

        return results;
    }, [filteredResults]);

    // Handle keyboard navigation
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (event: KeyboardEvent) => {
            if (
                event.target instanceof HTMLInputElement ||
                event.target instanceof HTMLTextAreaElement ||
                event.target instanceof HTMLSelectElement
            ) {
                // Allow typing in search input
                if (event.key === "ArrowDown" || event.key === "ArrowUp" || event.key === "Enter") {
                    event.preventDefault();
                }
                return;
            }

            if (event.key === "ArrowDown") {
                event.preventDefault();
                setSelectedIndex((prev) => Math.min(prev + 1, flatResults.length - 1));
            } else if (event.key === "ArrowUp") {
                event.preventDefault();
                setSelectedIndex((prev) => Math.max(prev - 1, 0));
            } else if (event.key === "Enter") {
                event.preventDefault();
                const selected = flatResults[selectedIndex];
                if (selected) {
                    handleSelect(selected.type, selected.item);
                }
            } else if (event.key === "Escape") {
                event.preventDefault();
                onClose();
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [isOpen, flatResults, selectedIndex, onClose]);

    const handleSelect = (type: "action" | "toolbelt" | "tool", item: Action | Toolbelt | Tool) => {
        if (type === "action") {
            onAction((item as Action).action);
        } else if (type === "toolbelt") {
            onSelectToolbelt((item as Toolbelt).id);
        } else {
            onSelectTool((item as Tool).id);
        }
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Toolkit Explorer</DialogTitle>
                </DialogHeader>
                <div className="flex-1 flex flex-col gap-4 overflow-hidden">
                    <Input
                        type="text"
                        placeholder="Search tools, toolbelts, actions..."
                        value={searchQuery}
                        onChange={(e) => {
                            setSearchQuery(e.target.value);
                            setSelectedIndex(0);
                        }}
                        className="w-full"
                        autoFocus
                    />
                    <div className="flex-1 overflow-y-auto">
                        <SearchResults
                            results={filteredResults}
                            selectedIndex={selectedIndex}
                            flatResults={flatResults}
                            onSelect={handleSelect}
                        />
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

