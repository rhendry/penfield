import { Button } from "@/components/ui/button";
import { Undo2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface UndoButtonProps {
    onClick: () => void;
    disabled?: boolean;
    className?: string;
}

/**
 * UndoButton - Atom component for undoing the last action
 */
export function UndoButton({ onClick, disabled = false, className }: UndoButtonProps) {
    return (
        <Button
            variant="outline"
            size="icon"
            onClick={onClick}
            disabled={disabled}
            className={cn("relative", className)}
            title="Undo (Ctrl+Z)"
        >
            <Undo2 className="h-4 w-4" />
        </Button>
    );
}

