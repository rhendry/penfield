import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { hashPassword, comparePasswords } from "./auth";
import { insertUserSchema, insertProjectSchema, insertAssetSchema, insertFeatureFlagSchema, updateFeatureFlagSchema } from "@shared/schema";
import { registerToolkitRoutes } from "./toolkit-routes";
import { registerPaletteRoutes } from "./palette-routes";

export async function registerRoutes(app: Express): Promise<Server> {
    // Auth Routes
    app.post("/api/login", (req, _res, next) => {
        // @ts-ignore
        const passport = req._passport;
        if (!passport) {
            return next(new Error("Passport not initialized"));
        }
        next();
    }, (req, res, next) => {
        // @ts-ignore
        import("passport").then((passport) => {
            passport.default.authenticate("local", (err: any, user: any, _info: any) => {
                if (err) {
                    return next(err);
                }
                if (!user) {
                    return res.status(401).json({ message: "Invalid username or password" });
                }
                req.logIn(user, (err) => {
                    if (err) {
                        return next(err);
                    }
                    return res.json(user);
                });
            })(req, res, next);
        });
    });

    app.post("/api/logout", (req, res, next) => {
        req.logout((err) => {
            if (err) return next(err);
            res.sendStatus(200);
        });
    });

    app.get("/api/user", (req, res) => {
        if (req.isAuthenticated()) {
            return res.json(req.user);
        }
        res.status(401).json({ message: "Not authenticated" });
    });

    app.post("/api/user/password", async (req, res) => {
        if (!req.isAuthenticated()) {
            return res.status(401).json({ message: "Not authenticated" });
        }

        const { oldPassword, newPassword } = req.body;
        // @ts-ignore
        const user = await storage.getUser(req.user.id);

        if (!user || !(await comparePasswords(oldPassword, user.password))) {
            return res.status(400).json({ message: "Invalid old password" });
        }

        const hashedPassword = await hashPassword(newPassword);
        // @ts-ignore
        await storage.updateUser(req.user.id, { password: hashedPassword });
        res.sendStatus(200);
    });

    // Admin Routes
    app.get("/api/admin/users", async (req, res) => {
        if (!req.isAuthenticated() || (req.user as any).role !== "admin") {
            return res.status(403).json({ message: "Forbidden" });
        }
        // TODO: Implement getAllUsers in storage if needed, for now just returning empty or implementing it
        // For now let's just return 501 Not Implemented or add getAllUsers to storage
        // Adding getAllUsers to storage is better.
        // But wait, I didn't add getAllUsers to interface. Let's skip list for now or add it.
        // Let's stick to creating users for now as per plan.
        res.status(501).json({ message: "Not implemented yet" });
    });

    app.post("/api/admin/users", async (req, res) => {
        if (!req.isAuthenticated() || (req.user as any).role !== "admin") {
            return res.status(403).json({ message: "Forbidden" });
        }

        const parsed = insertUserSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json(parsed.error);
        }

        const existing = await storage.getUserByUsername(parsed.data.username);
        if (existing) {
            return res.status(400).json({ message: "Username already exists" });
        }

        const hashedPassword = await hashPassword(parsed.data.password);
        const user = await storage.createUser({
            ...parsed.data,
            password: hashedPassword,
        });

        res.status(201).json(user);
    });

    // Feature Flags (Admin only)
    app.get("/api/admin/feature-flags", async (req, res) => {
        if (!req.isAuthenticated() || (req.user as any).role !== "admin") {
            return res.status(403).json({ message: "Forbidden" });
        }
        const flags = await storage.getFeatureFlags_async();
        // Convert enabled from "true"/"false" string to boolean for frontend
        const convertedFlags = flags.map((flag) => ({
            ...flag,
            enabled: flag.enabled === "true",
        }));
        res.json(convertedFlags);
    });

    app.get("/api/feature-flags/:name", async (req, res) => {
        // Public endpoint - anyone can check if a feature is enabled
        const flag = await storage.getFeatureFlag_async(req.params.name);
        if (!flag) {
            return res.json({ name: req.params.name, enabled: false });
        }
        res.json({ name: flag.name, enabled: flag.enabled === "true" });
    });

    app.put("/api/admin/feature-flags/:name", async (req, res) => {
        if (!req.isAuthenticated() || (req.user as any).role !== "admin") {
            return res.status(403).json({ message: "Forbidden" });
        }

        const parsed = updateFeatureFlagSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json(parsed.error);
        }

        try {
            const flag = await storage.updateFeatureFlag_async(req.params.name, parsed.data);
            // Convert enabled from "true"/"false" string to boolean for frontend
            res.json({
                ...flag,
                enabled: flag.enabled === "true",
            });
        } catch (error: any) {
            if (error.message.includes("not found")) {
                return res.status(404).json({ message: error.message });
            }
            return res.status(500).json({ message: error.message });
        }
    });

    app.post("/api/admin/feature-flags", async (req, res) => {
        if (!req.isAuthenticated() || (req.user as any).role !== "admin") {
            return res.status(403).json({ message: "Forbidden" });
        }

        const parsed = insertFeatureFlagSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json(parsed.error);
        }

        const existing = await storage.getFeatureFlag_async(parsed.data.name);
        if (existing) {
            return res.status(400).json({ message: "Feature flag already exists" });
        }

        const flag = await storage.createFeatureFlag_async(parsed.data);
        res.status(201).json(flag);
    });

    // Projects
    app.get("/api/projects", async (req, res) => {
        if (!req.isAuthenticated()) return res.sendStatus(401);
        // @ts-ignore
        const projects = await storage.getProjects(req.user.id);
        res.json(projects);
    });

    app.post("/api/projects", async (req, res) => {
        if (!req.isAuthenticated()) return res.sendStatus(401);
        const parsed = insertProjectSchema.safeParse(req.body);
        if (!parsed.success) return res.status(400).json(parsed.error);
        // @ts-ignore
        const project = await storage.createProject(req.user.id, parsed.data);
        res.status(201).json(project);
    });

    app.get("/api/projects/:id", async (req, res) => {
        if (!req.isAuthenticated()) return res.sendStatus(401);
        const id = parseInt(req.params.id);
        if (isNaN(id)) return res.sendStatus(400);
        const project = await storage.getProject(id);
        if (!project) return res.sendStatus(404);
        // Ideally check if user owns project or has access
        // @ts-ignore
        if (project.userId !== req.user.id && req.user.role !== "admin") return res.sendStatus(403);
        res.json(project);
    });

    // Assets
    app.get("/api/projects/:id/assets", async (req, res) => {
        if (!req.isAuthenticated()) return res.sendStatus(401);
        const projectId = parseInt(req.params.id);
        if (isNaN(projectId)) return res.sendStatus(400);
        // Check project access
        const project = await storage.getProject(projectId);
        if (!project) return res.sendStatus(404);
        // @ts-ignore
        if (project.userId !== req.user.id && req.user.role !== "admin") return res.sendStatus(403);

        const assets = await storage.getAssets(projectId);
        res.json(assets);
    });

    app.post("/api/projects/:id/assets", async (req, res) => {
        if (!req.isAuthenticated()) return res.sendStatus(401);
        const projectId = parseInt(req.params.id);
        if (isNaN(projectId)) return res.sendStatus(400);
        // Check project access
        const project = await storage.getProject(projectId);
        if (!project) return res.sendStatus(404);
        // @ts-ignore
        if (project.userId !== req.user.id && req.user.role !== "admin") return res.sendStatus(403);

        const parsed = insertAssetSchema.safeParse({ ...req.body, projectId });
        if (!parsed.success) return res.status(400).json(parsed.error);
        const asset = await storage.createAsset(parsed.data);
        res.status(201).json(asset);
    });

    app.get("/api/assets/:id", async (req, res) => {
        if (!req.isAuthenticated()) return res.sendStatus(401);
        const id = parseInt(req.params.id);
        if (isNaN(id)) return res.sendStatus(400);
        const asset = await storage.getAsset(id);
        if (!asset) return res.sendStatus(404);

        // Check project access for this asset
        const project = await storage.getProject(asset.projectId);
        // @ts-ignore
        if (!project || (project.userId !== req.user.id && req.user.role !== "admin")) return res.sendStatus(403);

        // Migrate legacy content format if needed
        if (asset.type === "pixel" && asset.content) {
            const { migrateAssetContent } = await import("./migrations/migrate-assets");
            const migratedAsset = migrateAssetContent(asset);
            if (migratedAsset !== asset) {
                // Save migrated content
                await storage.updateAsset(id, migratedAsset.content);
                res.json(migratedAsset);
                return;
            }
        }

        res.json(asset);
    });

    app.put("/api/assets/:id", async (req, res) => {
        if (!req.isAuthenticated()) return res.sendStatus(401);
        const id = parseInt(req.params.id);
        if (isNaN(id)) return res.sendStatus(400);

        const asset = await storage.getAsset(id);
        if (!asset) return res.sendStatus(404);

        const project = await storage.getProject(asset.projectId);
        // @ts-ignore
        if (!project || (project.userId !== req.user.id && req.user.role !== "admin")) return res.sendStatus(403);

        // Validate content format if it's a pixel asset
        if (asset.type === "pixel" && req.body.content) {
            const { pixelAssetContentSchema } = await import("@shared/types/pixel-asset");
            const result = pixelAssetContentSchema.safeParse(req.body.content);
            if (!result.success) {
                return res.status(400).json({
                    message: "Invalid pixel asset content format",
                    errors: result.error.errors,
                });
            }
        }

        const updatedAsset = await storage.updateAsset(id, req.body.content);
        res.json(updatedAsset);
    });

    // Toolkit Routes
    registerToolkitRoutes(app);

    // Palette Routes
    registerPaletteRoutes(app);

    const httpServer = createServer(app);
    return httpServer;
}
