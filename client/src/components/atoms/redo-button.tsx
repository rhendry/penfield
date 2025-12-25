import { Button } from "@/components/ui/button";
import { Redo2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface RedoButtonProps {
    onClick: () => void;
    disabled?: boolean;
    className?: string;
}

/**
 * RedoButton - Atom component for redoing the last undone action
 */
export function RedoButton({ onClick, disabled = false, className }: RedoButtonProps) {
    return (
        <Button
            variant="outline"
            size="icon"
            onClick={onClick}
            disabled={disabled}
            className={cn("relative", className)}
            title="Redo (Ctrl+Y)"
        >
            <Redo2 className="h-4 w-4" />
        </Button>
    );
}

