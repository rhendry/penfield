import React, { ReactNode, useState, useRef, useEffect, Children, isValidElement } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { ChevronRight, ChevronLeft } from "lucide-react";
import { Tool } from "../toolbelt/types";
import { getToolUtilities } from "./utilities-registry";
import { HotkeyTip } from "@/components/ui/hotkey-tip";
import { KeyboardKey } from "@/components/ui/keyboard-key";

export interface UtilitiesPanelProps {
    isExpanded: boolean;
    onToggle: () => void;
    selectedTool?: Tool;
    className?: string;
    width?: number; // Width when expanded in pixels
    onWidthChange?: (width: number) => void;
}

const DEFAULT_WIDTH = 320;
const MIN_WIDTH = 200;
const MAX_WIDTH = 800;

/**
 * UtilitiesPanel - Right-hand collapsible sidebar for tool utilities.
 * Press Control+Space to toggle. Drag left edge to resize.
 */
export function UtilitiesPanel({
    isExpanded,
    onToggle,
    selectedTool,
    className,
    width: controlledWidth = DEFAULT_WIDTH,
    onWidthChange,
}: UtilitiesPanelProps) {
    const [internalWidth, setInternalWidth] = useState(controlledWidth);
    const width = onWidthChange ? controlledWidth : internalWidth;
    const setWidth = onWidthChange || setInternalWidth;
    
    const resizeRef = useRef<HTMLDivElement>(null);
    const isResizingRef = useRef(false);

    // Get utilities for the selected tool
    const utilities = selectedTool ? getToolUtilities(selectedTool) : undefined;
    
    // Normalize utilities to array, extracting children from fragments
    const utilitiesArray = utilities
        ? Array.isArray(utilities)
            ? utilities.flatMap(util => {
                // If it's a fragment, extract its children
                if (isValidElement(util) && util.type === React.Fragment) {
                    return Children.toArray(util.props.children);
                }
                return [util];
            })
            : (() => {
                // If it's a fragment, extract its children
                if (isValidElement(utilities) && utilities.type === React.Fragment) {
                    return Children.toArray(utilities.props.children);
                }
                return [utilities];
            })()
        : [];

    // Handle resize drag
    useEffect(() => {
        if (!isExpanded) return;

        const handleMouseDown = (e: MouseEvent) => {
            if (resizeRef.current?.contains(e.target as Node)) {
                isResizingRef.current = true;
                e.preventDefault();
            }
        };

        const handleMouseMove = (e: MouseEvent) => {
            if (!isResizingRef.current) return;
            
            const newWidth = window.innerWidth - e.clientX;
            const clampedWidth = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, newWidth));
            setWidth(clampedWidth);
        };

        const handleMouseUp = () => {
            isResizingRef.current = false;
        };

        window.addEventListener("mousedown", handleMouseDown);
        window.addEventListener("mousemove", handleMouseMove);
        window.addEventListener("mouseup", handleMouseUp);

        return () => {
            window.removeEventListener("mousedown", handleMouseDown);
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseup", handleMouseUp);
        };
    }, [isExpanded, setWidth]);

    return (
        <>
            {/* Toggle Button - Always visible */}
            <motion.button
                initial={false}
                animate={{
                    x: isExpanded ? -width : 0,
                }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                onClick={onToggle}
                className={cn(
                    "fixed right-0 top-1/2 -translate-y-1/2 z-50",
                    "flex items-center gap-2",
                    "bg-background/90 border border-l-0 border-white/10 rounded-l-lg",
                    "backdrop-blur-md",
                    isExpanded ? "w-8 h-16 px-0" : "px-3 py-2 h-auto min-w-[120px] shadow-lg",
                    "hover:bg-background transition-colors",
                    "group"
                )}
                title={isExpanded ? "Collapse utilities (Ctrl+Space)" : "Expand utilities (Ctrl+Space)"}
            >
                {isExpanded ? (
                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                ) : (
                    <>
                        <ChevronLeft className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors flex-shrink-0" />
                        <div className="flex items-center gap-1 flex-shrink-0">
                            <KeyboardKey size="sm">Ctrl</KeyboardKey>
                            <span className="text-muted-foreground/60 text-[10px]">+</span>
                            <KeyboardKey size="sm">Space</KeyboardKey>
                        </div>
                    </>
                )}
            </motion.button>

            {/* Panel Content */}
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ x: width }}
                        animate={{ x: 0 }}
                        exit={{ x: width }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        className={cn(
                            "fixed right-0 top-0 bottom-0 z-40",
                            "flex flex-col",
                            "bg-background/95 border-l border-white/10",
                            "backdrop-blur-xl shadow-2xl",
                            className
                        )}
                        style={{ width }}
                    >
                        {/* Resize Handle */}
                        <div
                            ref={resizeRef}
                            className={cn(
                                "absolute left-0 top-0 bottom-0 w-1",
                                "cursor-col-resize hover:bg-primary/50 transition-colors",
                                "group/resize"
                            )}
                            title="Drag to resize"
                        >
                            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-0.5 h-12 bg-muted-foreground/30 group-hover/resize:bg-primary rounded-full" />
                        </div>

                        {/* Header */}
                        <div className="px-4 py-3 border-b border-white/10 space-y-2">
                            <div>
                                <h2 className="text-base font-semibold text-foreground">Utilities</h2>
                                {selectedTool && (
                                    <p className="text-sm text-muted-foreground mt-0.5">
                                        {selectedTool.name}
                                    </p>
                                )}
                            </div>
                            <HotkeyTip
                                label="Toggle panel"
                                keys={[["Ctrl", "Space"]]}
                                size="sm"
                            />
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 min-w-0">
                            {utilitiesArray.length > 0 ? (
                                utilitiesArray.map((utility, index) => (
                                    <div 
                                        key={index} 
                                        className={index > 0 ? "pt-4 mt-4 border-t border-gray-500/60" : ""}
                                    >
                                        {utility}
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-8 text-muted-foreground">
                                    <p className="text-sm">No utilities available</p>
                                    <p className="text-xs mt-1">Select a tool to see its utilities</p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}

