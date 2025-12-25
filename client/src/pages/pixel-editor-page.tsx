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
import { RenderContextProvider } from "@/components/editor/render-context";
import { migrateLegacyContent } from "@shared/utils/pixel-asset";
import { getTool } from "@/tools";
import type { PixelAssetContent } from "@shared/types/pixel-asset";

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
    const [pixels, setPixels] = useState<Record<string, string>>({});
    const [utilitiesPanelExpanded, setUtilitiesPanelExpanded] = useState(false);
    const [utilitiesPanelWidth, setUtilitiesPanelWidth] = useState(320);

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

    // Initialize default toolbelt on mount (only once)
    const [hasInitialized, setHasInitialized] = useState(false);
    useEffect(() => {
        if (!hasInitialized && toolbeltSlots.length === 0) {
            setToolbeltSlots(DEFAULT_PIXEL_TOOLBELT);
            setSelectedTool(PEN_TOOL);
            setHasInitialized(true);
        }
    }, [hasInitialized, toolbeltSlots.length, setToolbeltSlots]);

    // Set initial palette
    useEffect(() => {
        if (palettes.length > 0 && !currentPaletteId) {
            setCurrentPaletteId(palettes[0].id);
        }
    }, [palettes, currentPaletteId]);

    // Initialize pixels from asset content
    useEffect(() => {
        if (asset?.content && typeof asset.content === "object" && "grid" in asset.content) {
            const grid = (asset.content as { grid?: Record<string, string> }).grid;
            if (grid) {
                setPixels(grid);
            }
        }
    }, [asset]);

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
    }, [selectedTool, leftClickColor, rightClickColor, currentPaletteId, palettes, currentPaletteColors]);

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

    // Handle pixels change (legacy support)
    const handlePixelsChange = useCallback((newPixels: Record<string, string>) => {
        setPixels(newPixels);
    }, []);

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

    const handleSave = useCallback(async () => {
        // For now, save legacy format for backward compatibility
        // TODO: Update to save full PixelAssetContent when server supports it
        await saveAssetMutation.mutateAsync({ grid: pixels });
    }, [pixels, saveAssetMutation]);

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
        enabled: true,
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
                <Button onClick={handleSave} disabled={saveAssetMutation.isPending}>
                    {saveAssetMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    <Save className="mr-2 h-4 w-4" />
                    Save
                </Button>
            </header>

            <main className="flex-1 relative overflow-hidden">
                {/* Pixel Canvas - fills entire space */}
                {initialContent && (
                    <RenderContextProvider initialContent={initialContent}>
                        <div className="absolute inset-0">
                            <PixelEditor
                                initialContent={asset.content}
                                selectedTool={selectedTool}
                                leftClickColor={leftClickColor}
                                rightClickColor={rightClickColor}
                                onPixelsChange={handlePixelsChange}
                            />
                        </div>

                        {/* Utilities Panel - right side */}
                        <UtilitiesPanel
                            isExpanded={utilitiesPanelExpanded}
                            onToggle={() => setUtilitiesPanelExpanded((prev) => !prev)}
                            selectedTool={selectedToolWithUtilities || undefined}
                            width={utilitiesPanelWidth}
                            onWidthChange={setUtilitiesPanelWidth}
                        />
                    </RenderContextProvider>
                )}

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
            </main>
        </div>
    );
}

export default function PixelEditorPage() {
    return (
        <ToolkitProvider>
            <PixelEditorContent />
        </ToolkitProvider>
    );
}
