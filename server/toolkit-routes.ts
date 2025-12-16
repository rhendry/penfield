import type { Express, Request, Response } from "express";
import { storage } from "./storage";
import {
    insertToolkitSchema,
    insertToolSchema,
    insertToolbeltSchema,
    insertQuickSelectSlotSchema,
} from "@shared/schema";

export function registerToolkitRoutes(app: Express): void {
    // Helper to get authenticated user ID
    const getUserId = (req: Request): number | null => {
        if (!req.isAuthenticated()) return null;
        // @ts-ignore
        return req.user?.id ?? null;
    };

    // Toolkits
    app.get("/api/toolkits", async (req: Request, res: Response) => {
        const editorType = req.query.editorType as string | undefined;
        const toolkits = await storage.getToolkits_async(editorType);
        res.json(toolkits);
    });

    app.get("/api/toolkits/:id", async (req: Request, res: Response) => {
        const id = parseInt(req.params.id);
        if (isNaN(id)) return res.sendStatus(400);
        const toolkit = await storage.getToolkit_async(id);
        if (!toolkit) return res.sendStatus(404);
        res.json(toolkit);
    });

    app.get("/api/toolkits/:id/tools", async (req: Request, res: Response) => {
        const id = parseInt(req.params.id);
        if (isNaN(id)) return res.sendStatus(400);
        const toolkit = await storage.getToolkit_async(id);
        if (!toolkit) return res.sendStatus(404);
        const tools = await storage.getToolsByToolkit_async(id);
        res.json(tools);
    });

    // Tools
    app.get("/api/tools", async (req: Request, res: Response) => {
        const toolkitId = req.query.toolkitId
            ? parseInt(req.query.toolkitId as string)
            : undefined;
        if (toolkitId !== undefined && isNaN(toolkitId)) {
            return res.status(400).json({ message: "Invalid toolkitId" });
        }
        const tools = await storage.getTools_async(toolkitId);
        res.json(tools);
    });

    app.get("/api/tools/:id", async (req: Request, res: Response) => {
        const id = parseInt(req.params.id);
        if (isNaN(id)) return res.sendStatus(400);
        const tool = await storage.getTool_async(id);
        if (!tool) return res.sendStatus(404);
        res.json(tool);
    });

    // Toolbelts
    app.get("/api/toolbelts", async (req: Request, res: Response) => {
        const userId = getUserId(req);
        if (!userId) return res.sendStatus(401);
        const toolbelts = await storage.getToolbelts_async(userId);
        res.json(toolbelts);
    });

    app.get("/api/toolbelts/:id", async (req: Request, res: Response) => {
        const userId = getUserId(req);
        if (!userId) return res.sendStatus(401);
        const id = parseInt(req.params.id);
        if (isNaN(id)) return res.sendStatus(400);
        const toolbelt = await storage.getToolbelt_async(id);
        if (!toolbelt) return res.sendStatus(404);
        // Check ownership
        if (toolbelt.userId !== userId) return res.sendStatus(403);
        res.json(toolbelt);
    });

    app.post("/api/toolbelts", async (req: Request, res: Response) => {
        const userId = getUserId(req);
        if (!userId) return res.sendStatus(401);
        const parsed = insertToolbeltSchema.safeParse(req.body);
        if (!parsed.success) return res.status(400).json(parsed.error);
        const toolbelt = await storage.createToolbelt_async(userId, parsed.data);
        res.status(201).json(toolbelt);
    });

    app.put("/api/toolbelts/:id", async (req: Request, res: Response) => {
        const userId = getUserId(req);
        if (!userId) return res.sendStatus(401);
        const id = parseInt(req.params.id);
        if (isNaN(id)) return res.sendStatus(400);
        const existing = await storage.getToolbelt_async(id);
        if (!existing) return res.sendStatus(404);
        if (existing.userId !== userId) return res.sendStatus(403);
        const parsed = insertToolbeltSchema.partial().safeParse(req.body);
        if (!parsed.success) return res.status(400).json(parsed.error);
        const toolbelt = await storage.updateToolbelt_async(id, parsed.data);
        res.json(toolbelt);
    });

    app.delete("/api/toolbelts/:id", async (req: Request, res: Response) => {
        const userId = getUserId(req);
        if (!userId) return res.sendStatus(401);
        const id = parseInt(req.params.id);
        if (isNaN(id)) return res.sendStatus(400);
        const existing = await storage.getToolbelt_async(id);
        if (!existing) return res.sendStatus(404);
        if (existing.userId !== userId) return res.sendStatus(403);
        await storage.deleteToolbelt_async(id);
        res.sendStatus(204);
    });

    // Quick Select Slots
    app.get("/api/quick-select", async (req: Request, res: Response) => {
        const userId = getUserId(req);
        if (!userId) return res.sendStatus(401);
        const slots = await storage.getQuickSelectSlots_async(userId);
        res.json(slots);
    });

    app.post("/api/quick-select", async (req: Request, res: Response) => {
        const userId = getUserId(req);
        if (!userId) return res.sendStatus(401);
        const parsed = insertQuickSelectSlotSchema.safeParse(req.body);
        if (!parsed.success) return res.status(400).json(parsed.error);
        const slot = await storage.addQuickSelectSlot_async(userId, parsed.data);
        res.status(201).json(slot);
    });

    app.delete("/api/quick-select/:id", async (req: Request, res: Response) => {
        const userId = getUserId(req);
        if (!userId) return res.sendStatus(401);
        const id = parseInt(req.params.id);
        if (isNaN(id)) return res.sendStatus(400);
        const slots = await storage.getQuickSelectSlots_async(userId);
        const slot = slots.find((s) => s.id === id);
        if (!slot) return res.sendStatus(404);
        await storage.removeQuickSelectSlot_async(id);
        res.sendStatus(204);
    });

    app.put("/api/quick-select/:id/position", async (req: Request, res: Response) => {
        const userId = getUserId(req);
        if (!userId) return res.sendStatus(401);
        const id = parseInt(req.params.id);
        if (isNaN(id)) return res.sendStatus(400);
        const { position } = req.body;
        if (typeof position !== "number" || position < 0 || position > 4) {
            return res.status(400).json({ message: "Position must be between 0 and 4" });
        }
        const slots = await storage.getQuickSelectSlots_async(userId);
        const slot = slots.find((s) => s.id === id);
        if (!slot) return res.sendStatus(404);
        const updatedSlot = await storage.updateQuickSelectSlotPosition_async(id, position);
        res.json(updatedSlot);
    });
}

