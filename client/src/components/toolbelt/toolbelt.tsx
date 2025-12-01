import { ToolbeltProps } from "./types";
import { ToolSlot } from "./tool-slot";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export function Toolbelt({ slots, onSlotClick, className }: ToolbeltProps) {
    return (
        <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className={cn(
                "fixed bottom-8 left-8 flex gap-3 p-3 rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl shadow-2xl",
                className
            )}
        >
            {slots.map((slot) => (
                <ToolSlot
                    key={slot.id}
                    {...slot}
                    onClick={() => onSlotClick(slot.id)}
                />
            ))}
        </motion.div>
    );
}
