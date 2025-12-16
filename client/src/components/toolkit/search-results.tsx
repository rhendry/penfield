import { IconWithBadge } from "./icon-with-badge";
import { cn } from "@/lib/utils";
import { Tool, Toolbelt, Action } from "./toolkit-explorer";

export interface SearchResultsProps {
    results: {
        actions: Action[];
        toolbelts: Toolbelt[];
        tools: Tool[];
    };
    selectedIndex: number;
    flatResults: Array<{ type: "action" | "toolbelt" | "tool"; item: Action | Toolbelt | Tool }>;
    onSelect: (type: "action" | "toolbelt" | "tool", item: Action | Toolbelt | Tool) => void;
}

/**
 * SearchResults component - Displays grouped search results (Actions > Toolbelts > Tools)
 */
export function SearchResults({
    results,
    selectedIndex,
    flatResults,
    onSelect,
}: SearchResultsProps) {
    let currentIndex = 0;

    const isSelected = (type: "action" | "toolbelt" | "tool", item: Action | Toolbelt | Tool): boolean => {
        const index = flatResults.findIndex(
            (r) => r.type === type && r.item.id === item.id
        );
        return index === selectedIndex;
    };

    return (
        <div className="space-y-4">
            {/* Actions */}
            {results.actions.length > 0 && (
                <div>
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 px-2">
                        Actions
                    </h3>
                    <div className="space-y-1">
                        {results.actions.map((action) => {
                            const selected = isSelected("action", action);
                            return (
                                <button
                                    key={action.id}
                                    onClick={() => onSelect("action", action)}
                                    className={cn(
                                        "w-full text-left px-3 py-2 rounded-lg transition-all duration-200",
                                        selected
                                            ? "bg-primary/20 border border-primary/50"
                                            : "hover:bg-background/60 border border-transparent"
                                    )}
                                >
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium text-foreground">
                                            {action.name}
                                        </span>
                                    </div>
                                    {action.description && (
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {action.description}
                                        </p>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Toolbelts */}
            {results.toolbelts.length > 0 && (
                <div>
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 px-2">
                        Toolbelts
                    </h3>
                    <div className="space-y-1">
                        {results.toolbelts.map((toolbelt) => {
                            const selected = isSelected("toolbelt", toolbelt);
                            return (
                                <button
                                    key={toolbelt.id}
                                    onClick={() => onSelect("toolbelt", toolbelt)}
                                    className={cn(
                                        "w-full text-left px-3 py-2 rounded-lg transition-all duration-200",
                                        selected
                                            ? "bg-primary/20 border border-primary/50"
                                            : "hover:bg-background/60 border border-transparent"
                                    )}
                                >
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium text-foreground">
                                            {toolbelt.name}
                                        </span>
                                        {toolbelt.hotkey && (
                                            <span className="text-xs font-mono text-muted-foreground">
                                                [{toolbelt.hotkey}]
                                            </span>
                                        )}
                                    </div>
                                    {toolbelt.description && (
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {toolbelt.description}
                                        </p>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Tools */}
            {results.tools.length > 0 && (
                <div>
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 px-2">
                        Tools
                    </h3>
                    <div className="space-y-1">
                        {results.tools.map((tool) => {
                            const selected = isSelected("tool", tool);
                            return (
                                <button
                                    key={tool.id}
                                    onClick={() => onSelect("tool", tool)}
                                    className={cn(
                                        "w-full text-left px-3 py-2 rounded-lg transition-all duration-200",
                                        selected
                                            ? "bg-primary/20 border border-primary/50"
                                            : "hover:bg-background/60 border border-transparent"
                                    )}
                                >
                                    <div className="flex items-center gap-2">
                                        {tool.iconType && tool.iconName ? (
                                            <IconWithBadge
                                                iconType={tool.iconType}
                                                iconName={tool.iconName}
                                                badgeType={tool.badgeType}
                                                badgeName={tool.badgeName}
                                                badgeAlignment={tool.badgeAlignment}
                                                size={16}
                                                className={cn(
                                                    selected ? "text-primary" : "text-foreground"
                                                )}
                                            />
                                        ) : null}
                                        <span className="text-sm font-medium text-foreground">
                                            {tool.name}
                                        </span>
                                    </div>
                                    {tool.description && (
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {tool.description}
                                        </p>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Empty State */}
            {results.actions.length === 0 &&
                results.toolbelts.length === 0 &&
                results.tools.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                        <p className="text-sm">No results found</p>
                    </div>
                )}
        </div>
    );
}

