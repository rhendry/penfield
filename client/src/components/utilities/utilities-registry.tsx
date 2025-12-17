import { ReactNode } from "react";
import { Tool } from "../toolbelt/types";

/**
 * Registry for tool utilities.
 * Maps tool IDs to their utility components.
 */
export class UtilitiesRegistry {
    private registry: Map<string, ReactNode | ReactNode[]> = new Map();

    /**
     * Register utilities for a tool.
     */
    register(toolId: string, utilities: ReactNode | ReactNode[]): void {
        this.registry.set(toolId, utilities);
    }

    /**
     * Get utilities for a tool.
     */
    get(toolId: string): ReactNode | ReactNode[] | undefined {
        return this.registry.get(toolId);
    }

    /**
     * Check if a tool has registered utilities.
     */
    has(toolId: string): boolean {
        return this.registry.has(toolId);
    }

    /**
     * Remove utilities for a tool.
     */
    unregister(toolId: string): void {
        this.registry.delete(toolId);
    }

    /**
     * Clear all registered utilities.
     */
    clear(): void {
        this.registry.clear();
    }
}

export const utilitiesRegistry = new UtilitiesRegistry();

/**
 * Helper to get utilities for a tool, checking both the registry and the tool's utilities property.
 */
export function getToolUtilities(tool: Tool | undefined): ReactNode | ReactNode[] | undefined {
    if (!tool) return undefined;
    
    // Check tool's utilities property first
    if (tool.utilities) {
        return tool.utilities;
    }
    
    // Fall back to registry
    return utilitiesRegistry.get(tool.id);
}

