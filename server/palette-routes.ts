import type { Express, Request, Response } from "express";
import { storage } from "./storage";
import { insertColorPaletteSchema } from "@shared/schema";

export function registerPaletteRoutes(app: Express): void {
    // Helper to get authenticated user ID
    const getUserId = (req: Request): number | null => {
        if (!req.isAuthenticated()) return null;
        // @ts-ignore
        return req.user?.id ?? null;
    };

    // Get all palettes for current user
    app.get("/api/palettes", async (req: Request, res: Response) => {
        const userId = getUserId(req);
        if (!userId) return res.sendStatus(401);
        const palettes = await storage.getPalettes_async(userId);
        res.json(palettes);
    });

    // Get specific palette
    app.get("/api/palettes/:id", async (req: Request, res: Response) => {
        const userId = getUserId(req);
        if (!userId) return res.sendStatus(401);
        const id = parseInt(req.params.id);
        if (isNaN(id)) return res.sendStatus(400);
        const palette = await storage.getPalette_async(id);
        if (!palette) return res.sendStatus(404);
        // Check ownership
        if (palette.userId !== userId) return res.sendStatus(403);
        res.json(palette);
    });

    // Create new palette
    app.post("/api/palettes", async (req: Request, res: Response) => {
        const userId = getUserId(req);
        if (!userId) return res.sendStatus(401);
        const result = insertColorPaletteSchema.safeParse(req.body);
        if (!result.success) {
            return res.status(400).json({ message: "Invalid palette data", errors: result.error.errors });
        }
        const palette = await storage.createPalette_async(userId, result.data);
        res.status(201).json(palette);
    });

    // Update palette
    app.put("/api/palettes/:id", async (req: Request, res: Response) => {
        const userId = getUserId(req);
        if (!userId) return res.sendStatus(401);
        const id = parseInt(req.params.id);
        if (isNaN(id)) return res.sendStatus(400);
        const existingPalette = await storage.getPalette_async(id);
        if (!existingPalette) return res.sendStatus(404);
        if (existingPalette.userId !== userId) return res.sendStatus(403);
        
        const result = insertColorPaletteSchema.partial().safeParse(req.body);
        if (!result.success) {
            return res.status(400).json({ message: "Invalid palette data", errors: result.error.errors });
        }
        const palette = await storage.updatePalette_async(id, result.data);
        res.json(palette);
    });

    // Delete palette
    app.delete("/api/palettes/:id", async (req: Request, res: Response) => {
        const userId = getUserId(req);
        if (!userId) return res.sendStatus(401);
        const id = parseInt(req.params.id);
        if (isNaN(id)) return res.sendStatus(400);
        const palette = await storage.getPalette_async(id);
        if (!palette) return res.sendStatus(404);
        if (palette.userId !== userId) return res.sendStatus(403);
        await storage.deletePalette_async(id);
        res.sendStatus(204);
    });

    // Add color to palette
    app.post("/api/palettes/:id/colors", async (req: Request, res: Response) => {
        const userId = getUserId(req);
        if (!userId) return res.sendStatus(401);
        const id = parseInt(req.params.id);
        if (isNaN(id)) return res.sendStatus(400);
        const palette = await storage.getPalette_async(id);
        if (!palette) return res.sendStatus(404);
        if (palette.userId !== userId) return res.sendStatus(403);
        
        const { color } = req.body;
        if (typeof color !== "string") {
            return res.status(400).json({ message: "Color must be a string" });
        }
        const updatedPalette = await storage.addPaletteColor_async(id, color);
        res.json(updatedPalette);
    });

    // Remove color from palette
    app.delete("/api/palettes/:id/colors/:colorIndex", async (req: Request, res: Response) => {
        const userId = getUserId(req);
        if (!userId) return res.sendStatus(401);
        const id = parseInt(req.params.id);
        if (isNaN(id)) return res.sendStatus(400);
        const colorIndex = parseInt(req.params.colorIndex);
        if (isNaN(colorIndex)) return res.sendStatus(400);
        const palette = await storage.getPalette_async(id);
        if (!palette) return res.sendStatus(404);
        if (palette.userId !== userId) return res.sendStatus(403);
        
        const updatedPalette = await storage.removePaletteColor_async(id, colorIndex);
        res.json(updatedPalette);
    });
}

