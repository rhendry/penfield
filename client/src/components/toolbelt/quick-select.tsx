import { QuickSelectSlot } from "./types";
import { IconWithBadge } from "../toolkit/icon-with-badge";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

export interface QuickSelectProps {
    slots: QuickSelectSlot[];
    onSelect: (slotId: string) => void;
    activeSlotId?: string;
    className?: string;
}

/**
 * QuickSelect component - up to 5 circular slots positioned to the right of the toolbelt.
 * Tab key cycles through slots.
 */
export function QuickSelect({
    slots,
    onSelect,
    activeSlotId,
    className,
}: QuickSelectProps) {
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

    // Handle Tab key to cycle through slots
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (
                event.target instanceof HTMLInputElement ||
                event.target instanceof HTMLTextAreaElement ||
                event.target instanceof HTMLSelectElement
            ) {
                return;
            }

            if (event.key === "Tab" && slots.length > 0) {
                event.preventDefault();
                event.stopPropagation();

                const currentIndex = selectedIndex ?? -1;
                const nextIndex = (currentIndex + 1) % slots.length;
                setSelectedIndex(nextIndex);
                onSelect(slots[nextIndex].id);
            }
        };

        window.addEventListener("keydown", handleKeyDown, { capture: true });
        return () => {
            window.removeEventListener("keydown", handleKeyDown, { capture: true });
        };
    }, [slots, selectedIndex, onSelect]);

    // Sync selectedIndex with activeSlotId
    useEffect(() => {
        if (activeSlotId) {
            const index = slots.findIndex((slot) => slot.id === activeSlotId);
            if (index !== -1) {
                setSelectedIndex(index);
            }
        } else {
            setSelectedIndex(null);
        }
    }, [activeSlotId, slots]);

    if (slots.length === 0) {
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
            {slots.map((slot, index) => {
                const isActive = slot.id === activeSlotId || index === selectedIndex;
                return (
                    <motion.button
                        key={slot.id}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
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
                        ) : (
                            <div className="w-6 h-6 rounded-full border-2 border-dashed border-muted-foreground/20" />
                        )}

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
                );
            })}
        </motion.div>
    );
}

