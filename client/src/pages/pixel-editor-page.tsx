import { useState, useEffect, useMemo, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Asset } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Link, useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { PixelEditor } from "@/components/editor/pixel-editor";
import { ToolkitProvider, useToolkit } from "@/contexts/toolkit-context";
import { Toolbelt } from "@/components/toolbelt/toolbelt";
import { QuickSelect } from "@/components/toolbelt/quick-select";
import { ToolkitExplorer } from "@/components/toolkit/toolkit-explorer";
import { UtilitiesPanel } from "@/components/utilities/utilities-panel";
import { useToolkitExplorer } from "@/hooks/use-toolkit-explorer";
import { Tool } from "@/components/toolbelt/types";
import { ToolbeltSlot } from "@/components/toolbelt/types";
import { PEN_TOOL, DEFAULT_PIXEL_TOOLBELT } from "@/components/editor/pixel-editor-tools";
import { ColorPicker } from "@/components/utilities/color-picker";
import { ColorPalette } from "@/components/utilities/color-palette";
import { Palette } from "@/components/utilities/palette-selector";
import { ReactNode } from "react";
import { RenderContextProvider, useRenderContext } from "@/components/editor/render-context";
import { migrateLegacyContent } from "@shared/utils/pixel-asset";
import { getTool } from "@/tools";
import type { PixelAssetContent } from "@shared/types/pixel-asset";
import { useFeatureFlag } from "@/hooks/use-feature-flags";
import { useUndoRedo } from "@/hooks/use-undo-redo";

// SaveButton component that accesses RenderContext
function SaveButton({ onSave, isPending }: { onSave: (content: PixelAssetContent) => Promise<void>; isPending: boolean }) {
    const { content } = useRenderContext();

    const handleClick = useCallback(async () => {
        await onSave(content);
    }, [content, onSave]);

    return (
        <Button onClick={handleClick} disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Save className="mr-2 h-4 w-4" />
            Save
        </Button>
    );
}

function PixelEditorContent() {
    const [, params] = useRoute("/assets/:id/edit");
    const id = params?.id;
    const { toast } = useToast();

    const toolkit = useToolkit();
    const {
        toolbeltSlots,
        setToolbeltSlots,
        quickSelectSlots,
        addQuickSelectSlot,
        removeQuickSelectSlot,
        isExplorerOpen,
        setIsExplorerOpen,
        availableTools,
        setAvailableTools,
        availableToolbelts,
        setAvailableToolbelts,
    } = toolkit;

    // Editor state
    const [selectedTool, setSelectedTool] = useState<Tool | null>(null);
    const [leftClickColor, setLeftClickColor] = useState("#000000ff");
    const [rightClickColor, setRightClickColor] = useState("#ffffff00");
    const [currentPaletteId, setCurrentPaletteId] = useState<string>("");
    const [utilitiesPanelExpanded, setUtilitiesPanelExpanded] = useState(false);
    const [utilitiesPanelWidth, setUtilitiesPanelWidth] = useState(420);

    // Load asset
    const { data: asset, isLoading } = useQuery<Asset>({
        queryKey: [`/api/assets/${id}`],
        enabled: !!id,
    });

    // Load palettes
    const { data: palettesData } = useQuery<Array<{ id: number; userId: number; name: string; colors: string[] }>>({
        queryKey: ["/api/palettes"],
        enabled: !!id,
    });

    // Convert palettes to Palette format
    const palettes: Palette[] = useMemo(() => {
        if (!palettesData) return [];
        return palettesData.map((p) => ({
            id: String(p.id),
            name: p.name,
        }));
    }, [palettesData]);

    // Get colors for current palette
    const currentPaletteColors = useMemo(() => {
        if (!currentPaletteId || !palettesData) return [];
        const palette = palettesData.find((p) => String(p.id) === currentPaletteId);
        return palette?.colors || [];
    }, [currentPaletteId, palettesData]);

    // Load tools and toolbelts
    useEffect(() => {
        const loadData = async () => {
            try {
                // Load tools
                const toolsRes = await apiRequest("GET", "/api/tools");
                const toolsData = await toolsRes.json();
                // Convert database tools to frontend Tool format
                const convertedTools: Tool[] = toolsData.map((t: any) => ({
                    id: String(t.id),
                    name: t.name,
                    description: t.description,
                    iconType: t.iconType,
                    iconName: t.iconName,
                    badgeType: t.badgeType,
                    badgeName: t.badgeName,
                    badgeAlignment: t.badgeAlignment,
                }));
                setAvailableTools(convertedTools);

                // Load toolbelts
                const toolbeltsRes = await apiRequest("GET", "/api/toolbelts");
                const toolbeltsData = await toolbeltsRes.json();
                setAvailableToolbelts(toolbeltsData);
            } catch (error) {
                console.error("Failed to load tools/toolbelts:", error);
            }
        };
        loadData();
    }, []);

    // Check if object explorer feature is enabled
    const objectExplorerEnabled = useFeatureFlag("object-explorer");

    // Check if toolkit explorer feature is enabled
    const toolkitExplorerEnabled = useFeatureFlag("toolkit-explorer");

    // Initialize default toolbelt on mount and when feature flag changes
    const [hasInitialized, setHasInitialized] = useState(false);
    useEffect(() => {
        if (!hasInitialized && toolbeltSlots.length === 0) {
            // Filter out object explorer if feature flag is disabled
            const defaultToolbelt = objectExplorerEnabled
                ? DEFAULT_PIXEL_TOOLBELT
                : DEFAULT_PIXEL_TOOLBELT.filter((slot) => slot.tool?.id !== "object-explorer");
            setToolbeltSlots(defaultToolbelt);
            setSelectedTool(PEN_TOOL);
            setHasInitialized(true);
        }
    }, [hasInitialized, toolbeltSlots.length, setToolbeltSlots, objectExplorerEnabled]);

    // Update toolbelt when feature flag changes (after initial load)
    useEffect(() => {
        if (!hasInitialized) return;

        const hasObjectExplorer = toolbeltSlots.some((slot) => slot.tool?.id === "object-explorer");

        if (objectExplorerEnabled && !hasObjectExplorer) {
            // Add object explorer tool
            const objectExplorerSlot = DEFAULT_PIXEL_TOOLBELT.find((slot) => slot.tool?.id === "object-explorer");
            if (objectExplorerSlot) {
                setToolbeltSlots([...toolbeltSlots, objectExplorerSlot]);
            }
        } else if (!objectExplorerEnabled && hasObjectExplorer) {
            // Remove object explorer tool
            setToolbeltSlots(toolbeltSlots.filter((slot) => slot.tool?.id !== "object-explorer"));
            // If currently selected tool is object explorer, switch to pen
            if (selectedTool?.id === "object-explorer") {
                setSelectedTool(PEN_TOOL);
            }
        }
    }, [objectExplorerEnabled, hasInitialized, toolbeltSlots, setToolbeltSlots, selectedTool]);

    // Set initial palette
    useEffect(() => {
        if (palettes.length > 0 && !currentPaletteId) {
            setCurrentPaletteId(palettes[0].id);
        }
    }, [palettes, currentPaletteId]);

    // Removed pixels state - now using content from RenderContext

    // Handle toolbelt slot click
    const handleToolbeltSlotClick = useCallback((slotId: string) => {
        const slot = toolbeltSlots.find((s) => s.id === slotId);
        if (slot?.tool) {
            setSelectedTool(slot.tool);
        }
    }, [toolbeltSlots]);

    // Handle quick-select slot click
    const handleQuickSelectClick = useCallback((slotId: string) => {
        const slot = quickSelectSlots.find((s) => s.id === slotId);
        if (slot?.tool) {
            setSelectedTool(slot.tool);
            // Update lastUsedAt
            addQuickSelectSlot(slot.tool);
        }
    }, [quickSelectSlots, addQuickSelectSlot]);

    // Handle toolkit explorer tool selection
    const handleToolSelect = useCallback((toolId: string) => {
        const tool = availableTools.find((t) => String(t.id) === toolId);
        if (tool) {
            const toolWithUtilities: Tool = {
                ...tool,
                iconType: tool.iconType || "lucide",
                iconName: tool.iconName || "Circle",
            };
            setSelectedTool(toolWithUtilities);
            addQuickSelectSlot(toolWithUtilities);
            setIsExplorerOpen(false);
        }
    }, [availableTools, addQuickSelectSlot, setIsExplorerOpen]);

    // Handle toolkit explorer toolbelt selection
    const handleToolbeltSelect = useCallback((toolbeltId: string) => {
        const toolbelt = availableToolbelts.find((tb) => String(tb.id) === toolbeltId);
        if (toolbelt && "slots" in toolbelt && toolbelt.slots) {
            setToolbeltSlots(toolbelt.slots as ToolbeltSlot[]);
            setIsExplorerOpen(false);
        }
    }, [availableToolbelts, setToolbeltSlots, setIsExplorerOpen]);

    // Create utilities for selected tool
    const toolUtilities = useMemo<ReactNode | ReactNode[] | undefined>(() => {
        if (!selectedTool) return undefined;

        const toolId = selectedTool.id;

        // Get utilities from PixelTool registry for tools that have them
        if (toolId === "object-explorer") {
            // Only show object explorer if feature flag is enabled
            if (!objectExplorerEnabled) {
                return undefined;
            }
            const pixelTool = getTool(toolId);
            return pixelTool?.utilities;
        }

        if (toolId === "sprite-animation") {
            const pixelTool = getTool(toolId);
            return pixelTool?.utilities;
        }

        if (toolId === "pen") {
            return (
                <>
                    <ColorPicker
                        value={leftClickColor}
                        onChange={setLeftClickColor}
                        label="Left Click"
                    />
                    <ColorPicker
                        value={rightClickColor}
                        onChange={setRightClickColor}
                        label="Right Click"
                    />
                    <ColorPalette
                        paletteId={currentPaletteId}
                        palettes={palettes}
                        colors={currentPaletteColors}
                        selectedColor={leftClickColor}
                        onSelectPalette={setCurrentPaletteId}
                        onSelectColor={(color) => setLeftClickColor(color)}
                        onAddColor={async (color) => {
                            if (!currentPaletteId) return;
                            try {
                                await apiRequest("POST", `/api/palettes/${currentPaletteId}/colors`, { color });
                                queryClient.invalidateQueries({ queryKey: ["/api/palettes"] });
                            } catch (error) {
                                console.error("Failed to add color:", error);
                            }
                        }}
                        onRemoveColor={async (colorIndex) => {
                            if (!currentPaletteId) return;
                            try {
                                await apiRequest("DELETE", `/api/palettes/${currentPaletteId}/colors/${colorIndex}`);
                                queryClient.invalidateQueries({ queryKey: ["/api/palettes"] });
                            } catch (error) {
                                console.error("Failed to remove color:", error);
                            }
                        }}
                        onCreatePalette={async () => {
                            try {
                                const res = await apiRequest("POST", "/api/palettes", {
                                    name: `Palette ${palettes.length + 1}`,
                                    colors: [],
                                });
                                const newPalette = await res.json();
                                setCurrentPaletteId(String(newPalette.id));
                                queryClient.invalidateQueries({ queryKey: ["/api/palettes"] });
                            } catch (error) {
                                console.error("Failed to create palette:", error);
                            }
                        }}
                        currentPickerColor={leftClickColor}
                    />
                </>
            );
        } else if (toolId === "fill") {
            return (
                <>
                    <ColorPicker
                        value={leftClickColor}
                        onChange={setLeftClickColor}
                        label="Fill Color"
                    />
                    <ColorPalette
                        paletteId={currentPaletteId}
                        palettes={palettes}
                        colors={currentPaletteColors}
                        selectedColor={leftClickColor}
                        onSelectPalette={setCurrentPaletteId}
                        onSelectColor={(color) => setLeftClickColor(color)}
                        onAddColor={async (color) => {
                            if (!currentPaletteId) return;
                            try {
                                await apiRequest("POST", `/api/palettes/${currentPaletteId}/colors`, { color });
                                queryClient.invalidateQueries({ queryKey: ["/api/palettes"] });
                            } catch (error) {
                                console.error("Failed to add color:", error);
                            }
                        }}
                        onRemoveColor={async (colorIndex) => {
                            if (!currentPaletteId) return;
                            try {
                                await apiRequest("DELETE", `/api/palettes/${currentPaletteId}/colors/${colorIndex}`);
                                queryClient.invalidateQueries({ queryKey: ["/api/palettes"] });
                            } catch (error) {
                                console.error("Failed to remove color:", error);
                            }
                        }}
                        onCreatePalette={async () => {
                            try {
                                const res = await apiRequest("POST", "/api/palettes", {
                                    name: `Palette ${palettes.length + 1}`,
                                    colors: [],
                                });
                                const newPalette = await res.json();
                                setCurrentPaletteId(String(newPalette.id));
                                queryClient.invalidateQueries({ queryKey: ["/api/palettes"] });
                            } catch (error) {
                                console.error("Failed to create palette:", error);
                            }
                        }}
                        currentPickerColor={leftClickColor}
                    />
                </>
            );
        }

        return undefined;
    }, [selectedTool, leftClickColor, rightClickColor, currentPaletteId, palettes, currentPaletteColors, objectExplorerEnabled]);

    // Update selected tool utilities
    const selectedToolWithUtilities = useMemo<Tool | null>(() => {
        if (!selectedTool) return null;
        return {
            ...selectedTool,
            utilities: toolUtilities,
        };
    }, [selectedTool, toolUtilities]);

    // Initialize content from asset
    const initialContent = useMemo(() => {
        if (!asset?.content) return null;
        const content = asset.content as Record<string, unknown>;
        // Check if it's legacy format
        if (content && typeof content === "object" && "grid" in content && !("objects" in content)) {
            return migrateLegacyContent(content as { grid?: Record<string, string> });
        }
        return asset.content as PixelAssetContent;
    }, [asset]);

    // Removed handlePixelsChange - no longer needed

    // Save asset
    const saveAssetMutation = useMutation({
        mutationFn: async (content: any) => {
            const res = await apiRequest("PUT", `/api/assets/${id}`, { content });
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [`/api/assets/${id}`] });
            toast({
                title: "Saved",
                description: "Your artwork has been saved.",
            });
        },
        onError: () => {
            toast({
                title: "Error",
                description: "Failed to save artwork.",
                variant: "destructive",
            });
        },
    });

    // Save handler - receives content from SaveButton component
    const handleSave = useCallback(async (content: PixelAssetContent) => {
        await saveAssetMutation.mutateAsync(content);
    }, [saveAssetMutation]);

    // Handle utilities panel toggle (Ctrl+Space / Cmd+Space) - global hotkey
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ctrl+Space (or Cmd+Space on Mac) is a global hotkey, should work everywhere
            if ((e.ctrlKey || e.metaKey) && (e.key === " " || e.code === "Space")) {
                e.preventDefault();
                e.stopPropagation();
                setUtilitiesPanelExpanded((prev) => !prev);
            }
        };

        // Use capture phase to catch events before they reach inputs
        window.addEventListener("keydown", handleKeyDown, { capture: true });
        return () => window.removeEventListener("keydown", handleKeyDown, { capture: true });
    }, []);

    // Toolkit explorer toggle
    const toggleExplorer = useCallback(() => {
        setIsExplorerOpen((prev: boolean) => !prev);
    }, [setIsExplorerOpen]);

    useToolkitExplorer({
        enabled: toolkitExplorerEnabled,
        onToggle: toggleExplorer,
    });

    if (isLoading) {
        return (
            <div className="flex justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (!asset) {
        return <div>Asset not found</div>;
    }

    if (asset.type !== "pixel") {
        return (
            <div className="min-h-screen bg-background flex flex-col">
                <header className="border-b p-4 flex items-center gap-4">
                    <Link href={`/projects/${asset.projectId}`}>
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-xl font-bold">{asset.name}</h1>
                        <p className="text-xs text-muted-foreground">{asset.type} editor</p>
                    </div>
                </header>
                <main className="flex-1 p-8 flex justify-center">
                    <div className="text-center text-muted-foreground">
                        Editor for {asset.type} not implemented yet.
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background flex flex-col relative">
            {initialContent && (
                <RenderContextProvider initialContent={initialContent}>
                    <PixelEditorWithUndoRedo
                        asset={asset}
                        id={id}
                        selectedTool={selectedTool}
                        leftClickColor={leftClickColor}
                        rightClickColor={rightClickColor}
                        toolbeltSlots={toolbeltSlots}
                        quickSelectSlots={quickSelectSlots}
                        availableTools={availableTools}
                        availableToolbelts={availableToolbelts}
                        palettes={palettes}
                        currentPaletteId={currentPaletteId}
                        currentPaletteColors={currentPaletteColors}
                        utilitiesPanelExpanded={utilitiesPanelExpanded}
                        utilitiesPanelWidth={utilitiesPanelWidth}
                        objectExplorerEnabled={objectExplorerEnabled}
                        toolkitExplorerEnabled={toolkitExplorerEnabled}
                        setSelectedTool={setSelectedTool}
                        setLeftClickColor={setLeftClickColor}
                        setRightClickColor={setRightClickColor}
                        setCurrentPaletteId={setCurrentPaletteId}
                        setUtilitiesPanelExpanded={setUtilitiesPanelExpanded}
                        setUtilitiesPanelWidth={setUtilitiesPanelWidth}
                        handleToolbeltSlotClick={handleToolbeltSlotClick}
                        handleQuickSelectClick={handleQuickSelectClick}
                        handleToolSelect={handleToolSelect}
                        handleToolbeltSelect={handleToolbeltSelect}
                        removeQuickSelectSlot={removeQuickSelectSlot}
                        setIsExplorerOpen={setIsExplorerOpen}
                        isExplorerOpen={isExplorerOpen}
                        toolUtilities={toolUtilities}
                        selectedToolWithUtilities={selectedToolWithUtilities}
                        handleSave={handleSave}
                        saveAssetMutation={saveAssetMutation}
                    />
                </RenderContextProvider>
            )}
        </div>
    );
}

// Component that uses RenderContext and undo/redo
function PixelEditorWithUndoRedo({
    asset,
    id,
    selectedTool,
    leftClickColor,
    rightClickColor,
    toolbeltSlots,
    quickSelectSlots,
    availableTools,
    availableToolbelts,
    palettes,
    currentPaletteId,
    currentPaletteColors,
    utilitiesPanelExpanded,
    utilitiesPanelWidth,
    objectExplorerEnabled,
    toolkitExplorerEnabled,
    setSelectedTool,
    setLeftClickColor,
    setRightClickColor,
    setCurrentPaletteId,
    setUtilitiesPanelExpanded,
    setUtilitiesPanelWidth,
    handleToolbeltSlotClick,
    handleQuickSelectClick,
    handleToolSelect,
    handleToolbeltSelect,
    removeQuickSelectSlot,
    setIsExplorerOpen,
    isExplorerOpen,
    toolUtilities,
    selectedToolWithUtilities,
    handleSave,
    saveAssetMutation,
}: {
    asset: Asset;
    id: string | undefined;
    selectedTool: Tool | null;
    leftClickColor: string;
    rightClickColor: string;
    toolbeltSlots: ToolbeltSlot[];
    quickSelectSlots: any[];
    availableTools: Tool[];
    availableToolbelts: any[];
    palettes: Palette[];
    currentPaletteId: string;
    currentPaletteColors: string[];
    utilitiesPanelExpanded: boolean;
    utilitiesPanelWidth: number;
    objectExplorerEnabled: boolean;
    toolkitExplorerEnabled: boolean;
    setSelectedTool: (tool: Tool | null) => void;
    setLeftClickColor: (color: string) => void;
    setRightClickColor: (color: string) => void;
    setCurrentPaletteId: (id: string) => void;
    setUtilitiesPanelExpanded: (expanded: boolean) => void;
    setUtilitiesPanelWidth: (width: number) => void;
    handleToolbeltSlotClick: (slotId: string) => void;
    handleQuickSelectClick: (slotId: string) => void;
    handleToolSelect: (toolId: string) => void;
    handleToolbeltSelect: (toolbeltId: string) => void;
    removeQuickSelectSlot: (slotId: string) => void;
    setIsExplorerOpen: (open: boolean) => void;
    isExplorerOpen: boolean;
    toolUtilities: ReactNode | ReactNode[] | undefined;
    selectedToolWithUtilities: Tool | null;
    handleSave: (content: PixelAssetContent) => Promise<void>;
    saveAssetMutation: any;
}) {
    const { content, setContent } = useRenderContext();
    const { undo, redo, pushAction, canUndo, canRedo } = useUndoRedo(id, content, setContent);

    // Toolkit explorer toggle - only enabled if feature flag is on
    const toggleExplorer = useCallback(() => {
        setIsExplorerOpen(!isExplorerOpen);
    }, [setIsExplorerOpen, isExplorerOpen]);

    useToolkitExplorer({
        enabled: toolkitExplorerEnabled,
        onToggle: toggleExplorer,
    });

    // Handle undo/redo keyboard shortcuts (Ctrl+Z / Ctrl+Y)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Don't intercept if user is typing in an input
            const target = e.target as HTMLElement;
            if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) {
                return;
            }

            // Ctrl+Z (or Cmd+Z on Mac) for undo
            if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
                e.preventDefault();
                e.stopPropagation();
                if (canUndo) {
                    undo();
                }
            }
            // Ctrl+Y (or Cmd+Y on Mac) for redo, or Ctrl+Shift+Z
            else if (
                ((e.ctrlKey || e.metaKey) && e.key === "y") ||
                ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "z")
            ) {
                e.preventDefault();
                e.stopPropagation();
                if (canRedo) {
                    redo();
                }
            }
        };

        // Use capture phase to catch events before they reach other handlers
        window.addEventListener("keydown", handleKeyDown, { capture: true });
        return () => window.removeEventListener("keydown", handleKeyDown, { capture: true });
    }, [undo, redo, canUndo, canRedo]);

    return (
        <>
            <header className="border-b p-4 flex items-center gap-4 z-50">
                <Link href={`/projects/${asset.projectId}`}>
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div className="flex-1">
                    <h1 className="text-xl font-bold">{asset.name}</h1>
                    <p className="text-xs text-muted-foreground">{asset.type} editor</p>
                </div>
                <SaveButton onSave={handleSave} isPending={saveAssetMutation.isPending} />
            </header>

            <main className="flex-1 relative overflow-hidden">
                {/* Pixel Canvas - fills entire space */}
                <div className="absolute inset-0">
                    <PixelEditor
                        initialContent={asset.content}
                        selectedTool={selectedTool}
                        leftClickColor={leftClickColor}
                        rightClickColor={rightClickColor}
                        onAction={pushAction}
                        onUndo={undo}
                        onRedo={redo}
                        canUndo={canUndo}
                        canRedo={canRedo}
                    />
                </div>

                {/* Utilities Panel - right side */}
                <UtilitiesPanel
                    isExpanded={utilitiesPanelExpanded}
                    onToggle={() => setUtilitiesPanelExpanded(!utilitiesPanelExpanded)}
                    selectedTool={selectedToolWithUtilities || undefined}
                    width={utilitiesPanelWidth}
                    onWidthChange={setUtilitiesPanelWidth}
                />

                {/* Toolbelt - bottom left */}
                <Toolbelt
                    slots={toolbeltSlots}
                    onSlotClick={handleToolbeltSlotClick}
                    selectedToolId={selectedTool?.id}
                />

                {/* Quick Select - to right of toolbelt */}
                <QuickSelect
                    slots={quickSelectSlots}
                    onSelect={handleQuickSelectClick}
                    onRemove={removeQuickSelectSlot}
                />

                {/* Toolkit Explorer - modal */}
                {toolkitExplorerEnabled && (
                    <ToolkitExplorer
                        isOpen={isExplorerOpen}
                        onClose={() => setIsExplorerOpen(false)}
                        onSelectTool={handleToolSelect}
                        onSelectToolbelt={handleToolbeltSelect}
                        onAction={() => { }}
                        tools={availableTools.map((t) => ({
                            id: String(t.id),
                            name: t.name,
                            description: t.description,
                            iconType: t.iconType,
                            iconName: t.iconName,
                            badgeType: t.badgeType,
                            badgeName: t.badgeName,
                            badgeAlignment: t.badgeAlignment,
                        }))}
                        toolbelts={availableToolbelts.map((tb) => ({
                            id: String(tb.id),
                            name: tb.name,
                            description: tb.description,
                            hotkey: tb.hotkey,
                        }))}
                    />
                )}
            </main>
        </>
    );
}

export default function PixelEditorPage() {
    return (
        <ToolkitProvider>
            <PixelEditorContent />
        </ToolkitProvider>
    );
}
