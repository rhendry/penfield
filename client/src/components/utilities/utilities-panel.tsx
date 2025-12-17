import { ReactNode, useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { ChevronRight, ChevronLeft } from "lucide-react";
import { Tool } from "../toolbelt/types";
import { getToolUtilities } from "./utilities-registry";

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
    
    // Normalize utilities to array
    const utilitiesArray = utilities
        ? Array.isArray(utilities)
            ? utilities
            : [utilities]
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
                    "w-8 h-16 flex items-center justify-center",
                    "bg-background/90 border border-l-0 border-white/10 rounded-l-lg",
                    "backdrop-blur-md",
                    isExpanded ? "" : "shadow-lg",
                    "hover:bg-background transition-colors",
                    "group"
                )}
                title={isExpanded ? "Collapse utilities (Ctrl+Space)" : "Expand utilities (Ctrl+Space)"}
            >
                {isExpanded ? (
                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                ) : (
                    <ChevronLeft className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
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
                        <div className="p-4 border-b border-white/10">
                            <h2 className="text-lg font-semibold text-foreground">Utilities</h2>
                            {selectedTool && (
                                <p className="text-xs text-muted-foreground mt-1">
                                    {selectedTool.name}
                                </p>
                            )}
                            <p className="text-xs text-muted-foreground mt-1">
                                Press Ctrl+Space to toggle
                            </p>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {utilitiesArray.length > 0 ? (
                                utilitiesArray.map((utility, index) => (
                                    <div key={index}>{utility}</div>
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

