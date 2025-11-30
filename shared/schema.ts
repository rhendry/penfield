import { pgTable, text, serial, integer, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
    id: serial("id").primaryKey(),
    username: text("username").notNull().unique(),
    password: text("password").notNull(),
    role: text("role", { enum: ["admin", "user"] }).notNull().default("user"),
});

export const projects = pgTable("projects", {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    description: text("description"),
    userId: integer("user_id").notNull(), // Removed foreign key constraint for simplicity in this environment, or ensure users table exists and is referenced correctly if using real FKs. Ideally: .references(() => users.id)
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const assets = pgTable("assets", {
    id: serial("id").primaryKey(),
    projectId: integer("project_id").notNull(), // .references(() => projects.id),
    name: text("name").notNull(),
    type: text("type").notNull(), // 'pixel', 'voxel'
    content: jsonb("content").notNull(), // Pixel data
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
    username: true,
    password: true,
    role: true,
});

export const insertProjectSchema = createInsertSchema(projects).pick({
    name: true,
    description: true,
});

export const insertAssetSchema = createInsertSchema(assets).pick({
    projectId: true,
    name: true,
    type: true,
    content: true,
});

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Project = typeof projects.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;

export type Asset = typeof assets.$inferSelect;
export type InsertAsset = z.infer<typeof insertAssetSchema>;
