import { cn } from "@/lib/utils";
import { ToolSlotProps } from "./types";
import { motion } from "framer-motion";

export function ToolSlot({
    hotkey,
    tool,
    isActive,
    onClick,
}: ToolSlotProps) {
    return (
        <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onClick}
            className={cn(
                "relative group flex flex-col items-center justify-center w-16 h-16 rounded-xl border transition-all duration-200",
                "bg-background/40 backdrop-blur-md shadow-lg",
                isActive
                    ? "border-primary bg-primary/20 shadow-[0_0_15px_rgba(var(--primary),0.3)]"
                    : "border-white/10 hover:border-white/20 hover:bg-white/5"
            )}
        >
            {/* Hotkey Indicator */}
            <span className="absolute top-1 left-1.5 text-[10px] font-mono text-muted-foreground font-bold opacity-70 group-hover:opacity-100 transition-opacity">
                {hotkey}
            </span>

            {/* Tool Icon */}
            {tool ? (
                <div className="flex flex-col items-center gap-1">
                    <tool.icon
                        className={cn(
                            "w-6 h-6 transition-colors",
                            isActive ? "text-primary" : "text-foreground group-hover:text-primary/80"
                        )}
                    />
                    <span className="text-[10px] font-medium opacity-0 group-hover:opacity-100 transition-opacity absolute -bottom-4 whitespace-nowrap bg-black/80 px-2 py-0.5 rounded text-white pointer-events-none">
                        {tool.name}
                    </span>
                </div>
            ) : (
                <div className="w-6 h-6 rounded-full border-2 border-dashed border-muted-foreground/20" />
            )}

            {/* Active Indicator Glow */}
            {isActive && (
                <motion.div
                    layoutId="active-glow"
                    className="absolute inset-0 rounded-xl bg-primary/10 blur-sm -z-10"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                />
            )}
        </motion.button>
    );
}
