import { cn } from "@/lib/utils";
import { ToolSlotProps } from "./types";
import { motion } from "framer-motion";
import { IconWithBadge } from "../toolkit/icon-with-badge";

export function ToolSlot({
    hotkey,
    tool,
    isActive,
    onClick,
}: ToolSlotProps) {
    return (
        <motion.button
            whileHover={tool ? { scale: 1.05 } : {}}
            whileTap={tool ? { scale: 0.95 } : {}}
            onClick={tool ? onClick : undefined}
            disabled={!tool}
            className={cn(
                "relative group flex flex-col items-center justify-center w-16 h-16 rounded-xl border transition-all duration-200",
                "backdrop-blur-md shadow-lg",
                tool || isActive
                    ? "bg-background border-white/20"
                    : "bg-background/40 border-white/10",
                isActive
                    ? "border-primary shadow-[0_0_15px_rgba(var(--primary),0.3)]"
                    : tool
                        ? "hover:border-white/30 hover:bg-background/95 cursor-pointer"
                        : "cursor-not-allowed opacity-60"
            )}
        >
            {/* Hotkey Indicator */}
            <span className="absolute top-1 left-1.5 text-[10px] font-mono text-muted-foreground font-bold opacity-70 group-hover:opacity-100 transition-opacity">
                {hotkey}
            </span>

            {/* Tool Icon */}
            {tool ? (
                <div className="flex flex-col items-center gap-1">
                    {tool.iconType && tool.iconName ? (
                        <IconWithBadge
                            iconType={tool.iconType}
                            iconName={tool.iconName}
                            badgeType={tool.badgeType}
                            badgeName={tool.badgeName}
                            badgeAlignment={tool.badgeAlignment}
                            size={24}
                            className={cn(
                                "transition-colors",
                                isActive ? "text-primary" : "text-foreground group-hover:text-primary/80"
                            )}
                        />
                    ) : tool.icon ? (
                        <tool.icon
                            className={cn(
                                "w-6 h-6 transition-colors",
                                isActive ? "text-primary" : "text-foreground group-hover:text-primary/80"
                            )}
                        />
                    ) : (
                        <div className="w-6 h-6 rounded-full border-2 border-dashed border-muted-foreground/20" />
                    )}
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
