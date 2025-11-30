import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { hashPassword, comparePasswords } from "./auth";
import { insertUserSchema } from "@shared/schema";

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

    const httpServer = createServer(app);
    return httpServer;
}
