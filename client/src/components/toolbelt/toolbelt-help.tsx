import { ToolbeltSlot } from "./types";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { KeyboardKey } from "@/components/ui/keyboard-key";

export interface ToolbeltHelpProps {
    slots: ToolbeltSlot[];
    className?: string;
    /**
     * Whether the help docs are visible. If not provided, manages its own state.
     */
    isVisible?: boolean;
    /**
     * Callback when visibility changes. If not provided, manages its own state.
     */
    onVisibilityChange?: (visible: boolean) => void;
}

export function ToolbeltHelp({
    slots,
    className,
    isVisible: controlledIsVisible,
    onVisibilityChange,
}: ToolbeltHelpProps) {
    const [internalIsVisible, setInternalIsVisible] = useState(true);
    const isVisible =
        controlledIsVisible !== undefined ? controlledIsVisible : internalIsVisible;
    
    const setIsVisible = (visible: boolean) => {
        if (onVisibilityChange) {
            onVisibilityChange(visible);
        } else {
            setInternalIsVisible(visible);
        }
    };

    // Handle ~ key to toggle visibility
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            // Don't toggle if user is typing in an input/textarea
            if (
                event.target instanceof HTMLInputElement ||
                event.target instanceof HTMLTextAreaElement ||
                event.target instanceof HTMLSelectElement
            ) {
                return;
            }

            if (event.key === "~" || event.key === "`" || event.code === "Backquote") {
                event.preventDefault();
                event.stopPropagation();
                setIsVisible(!isVisible);
            }
        };

        window.addEventListener("keydown", handleKeyDown, { capture: true });
        return () => {
            window.removeEventListener("keydown", handleKeyDown, { capture: true });
        };
    }, [isVisible, setIsVisible]);

    // Find the active tool
    const activeSlot = slots.find((slot) => slot.isActive && slot.tool);

    // Get all slots with tools (excluding empty slots)
    const slotsWithTools = slots.filter((slot) => slot.tool);

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                    className={cn(
                        "fixed left-8 w-[56rem] flex flex-col rounded-2xl border backdrop-blur-xl z-50",
                        "border-white/10 overflow-hidden",
                        className
                    )}
                    style={{
                        bottom: "calc(2rem + 18rem + 0.5rem)", // bottom-8 (2rem) + toolbelt height (~18rem) + gap (0.5rem)
                        maxHeight: "calc(100vh - 22rem)",
                        backgroundColor: "transparent",
                    }}
                >
            <div className="p-3 border-b border-white/10">
                <h2 className="text-base font-semibold text-foreground">Toolbelt Help</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                    Press hotkeys to switch tools
                </p>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-3">
                {/* Active Tool Showcase */}
                {activeSlot?.tool && (() => {
                    const ActiveIcon = activeSlot.tool.icon;
                    return (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.2 }}
                            className="p-3 rounded-lg border border-primary/30 bg-primary/10 mb-4"
                        >
                            <div className="flex items-center gap-3">
                                <ActiveIcon className="w-5 h-5 text-primary flex-shrink-0" />
                                <div className="flex items-center gap-2">
                                    <h3 className="font-semibold text-foreground text-sm">
                                        {activeSlot.tool.name}
                                    </h3>
                                    <KeyboardKey size="sm">
                                        {activeSlot.hotkey}
                                    </KeyboardKey>
                                </div>
                                {activeSlot.tool.description && (
                                    <p className="text-xs text-foreground/90 ml-4 flex-1">
                                        {activeSlot.tool.description}
                                    </p>
                                )}
                            </div>
                        </motion.div>
                    );
                })()}

                {/* All Tools List */}
                <div className="space-y-1.5">
                    <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                        All Tools
                    </h3>
                    {slotsWithTools.map((slot) => {
                        const isActive = slot.isActive;
                        const ToolIcon = slot.tool!.icon;
                        return (
                            <motion.div
                                key={slot.id}
                                className={cn(
                                    "p-2 rounded-lg border transition-all duration-200",
                                    isActive
                                        ? "border-primary/50 bg-primary/10"
                                        : "border-white/10 bg-background/40 hover:border-white/20 hover:bg-background/60"
                                )}
                            >
                                <div className="flex items-center gap-2.5">
                                    <ToolIcon
                                        className={cn(
                                            "w-4 h-4 flex-shrink-0",
                                            isActive
                                                ? "text-primary"
                                                : "text-muted-foreground"
                                        )}
                                    />
                                    <div className="flex items-center gap-2">
                                        <span
                                            className={cn(
                                                "text-xs font-medium",
                                                isActive
                                                    ? "text-foreground"
                                                    : "text-foreground/80"
                                            )}
                                        >
                                            {slot.tool!.name}
                                        </span>
                                        <KeyboardKey size="sm">
                                            {slot.hotkey}
                                        </KeyboardKey>
                                    </div>
                                    {slot.tool!.description && (
                                        <p
                                            className={cn(
                                                "text-xs ml-3 flex-1",
                                                isActive
                                                    ? "text-foreground/90"
                                                    : "text-muted-foreground"
                                            )}
                                        >
                                            {slot.tool!.description}
                                        </p>
                                    )}
                                </div>
                            </motion.div>
                        );
                    })}
                </div>

                {/* Empty State */}
                {slotsWithTools.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                        <p className="text-sm">No tools assigned</p>
                    </div>
                )}
            </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

