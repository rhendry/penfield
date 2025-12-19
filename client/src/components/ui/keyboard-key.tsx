import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const keyboardKeyVariants = cva(
    "inline-flex items-center justify-center font-mono font-medium rounded-md border-2 transition-all",
    {
        variants: {
            size: {
                sm: "h-4 px-1 text-[9px] min-w-[16px]",
                md: "h-5 px-1.5 text-[10px] min-w-[20px]",
                lg: "h-6 px-2 text-xs min-w-[24px]",
            },
            variant: {
                default: "bg-gray-700/90 dark:bg-gray-700/90 border-gray-600/80 dark:border-gray-600/80 text-gray-100 dark:text-gray-100 shadow-[0_2px_0_0_rgba(0,0,0,0.3),inset_0_1px_0_0_rgba(255,255,255,0.15)]",
                ghost: "bg-gray-600/60 dark:bg-gray-600/60 border-gray-500/50 dark:border-gray-500/50 text-gray-300 dark:text-gray-300 shadow-[0_1px_0_0_rgba(0,0,0,0.2)]",
            },
        },
        defaultVariants: {
            size: "md",
            variant: "default",
        },
    }
);

export interface KeyboardKeyProps
    extends React.HTMLAttributes<HTMLSpanElement>,
        VariantProps<typeof keyboardKeyVariants> {
    children: React.ReactNode;
}

/**
 * KeyboardKey - A small component that renders a keyboard key.
 * Used to display hotkeys and keyboard shortcuts throughout the app.
 */
export function KeyboardKey({
    className,
    size,
    variant,
    children,
    ...props
}: KeyboardKeyProps) {
    return (
        <span
            className={cn(keyboardKeyVariants({ size, variant, className }))}
            {...props}
        >
            {children}
        </span>
    );
}

