import { QuickSelectSlot } from "./types";
import { IconWithBadge } from "../toolkit/icon-with-badge";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";

export interface QuickSelectProps {
    slots: QuickSelectSlot[];
    onSelect: (slotId: string) => void;
    onRemove?: (slotId: string) => void;
    activeSlotId?: string;
    className?: string;
}

/**
 * QuickSelect component - up to 5 circular slots positioned to the right of the toolbelt.
 * Tab key cycles through assigned slots only. Never shows empty slots.
 */
export function QuickSelect({
    slots,
    onSelect,
    onRemove,
    activeSlotId,
    className,
}: QuickSelectProps) {
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

    // Filter out empty slots - only show slots with assigned tools
    const assignedSlots = slots.filter((slot) => slot.tool);

    // Handle Tab key to cycle through assigned slots only
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (
                event.target instanceof HTMLInputElement ||
                event.target instanceof HTMLTextAreaElement ||
                event.target instanceof HTMLSelectElement
            ) {
                return;
            }

            if (event.key === "Tab" && assignedSlots.length > 0) {
                event.preventDefault();
                event.stopPropagation();

                const currentIndex = selectedIndex ?? -1;
                const nextIndex = (currentIndex + 1) % assignedSlots.length;
                setSelectedIndex(nextIndex);
                onSelect(assignedSlots[nextIndex].id);
            }
        };

        window.addEventListener("keydown", handleKeyDown, { capture: true });
        return () => {
            window.removeEventListener("keydown", handleKeyDown, { capture: true });
        };
    }, [assignedSlots, selectedIndex, onSelect]);

    // Sync selectedIndex with activeSlotId
    useEffect(() => {
        if (activeSlotId) {
            const index = assignedSlots.findIndex((slot) => slot.id === activeSlotId);
            if (index !== -1) {
                setSelectedIndex(index);
            }
        } else {
            setSelectedIndex(null);
        }
    }, [activeSlotId, assignedSlots]);

    if (assignedSlots.length === 0) {
        return null;
    }

    return (
        <motion.div
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className={cn(
                "fixed bottom-8 left-[calc(2rem+18rem+1rem)] flex gap-2 z-40",
                className
            )}
        >
            {assignedSlots.map((slot, index) => {
                const isActive = slot.id === activeSlotId || index === selectedIndex;
                return (
                    <motion.div
                        key={slot.id}
                        className="relative"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <motion.button
                            onClick={() => {
                                setSelectedIndex(index);
                                onSelect(slot.id);
                            }}
                            className={cn(
                                "relative flex items-center justify-center w-14 h-14 rounded-full border transition-all duration-200",
                                "backdrop-blur-md shadow-lg",
                                isActive
                                    ? "bg-background border-primary shadow-[0_0_15px_rgba(var(--primary),0.3)]"
                                    : "bg-background/40 border-white/20 hover:border-white/30 hover:bg-background/60 cursor-pointer"
                            )}
                            title={slot.tool.name}
                        >
                            {/* Tool Icon */}
                            {slot.tool.iconType && slot.tool.iconName ? (
                                <IconWithBadge
                                    iconType={slot.tool.iconType}
                                    iconName={slot.tool.iconName}
                                    badgeType={slot.tool.badgeType}
                                    badgeName={slot.tool.badgeName}
                                    badgeAlignment={slot.tool.badgeAlignment}
                                    size={24}
                                    className={cn(
                                        "transition-colors",
                                        isActive ? "text-primary" : "text-foreground"
                                    )}
                                />
                            ) : slot.tool.icon ? (
                                <slot.tool.icon
                                    size={24}
                                    className={cn(
                                        "transition-colors",
                                        isActive ? "text-primary" : "text-foreground"
                                    )}
                                />
                            ) : null}

                            {/* Active Indicator Glow */}
                            {isActive && (
                                <motion.div
                                    layoutId="quick-select-active-glow"
                                    className="absolute inset-0 rounded-full bg-primary/10 blur-sm -z-10"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                />
                            )}
                        </motion.button>

                        {/* Trash Icon - shown when active */}
                        {isActive && onRemove && (
                            <motion.button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onRemove(slot.id);
                                }}
                                className={cn(
                                    "absolute -top-1 -right-1 w-5 h-5 rounded-full bg-destructive",
                                    "flex items-center justify-center border-2 border-background",
                                    "hover:bg-destructive/90 transition-colors z-10",
                                    "shadow-lg"
                                )}
                                title="Remove from quick select"
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                            >
                                <Trash2 size={10} className="text-destructive-foreground" />
                            </motion.button>
                        )}
                    </motion.div>
                );
            })}
        </motion.div>
    );
}

