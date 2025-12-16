import { pgTable, text, serial, integer, timestamp, jsonb, unique } from "drizzle-orm/pg-core";
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

// Toolkit tables
export const toolkits = pgTable("toolkits", {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    description: text("description"),
    editorType: text("editor_type").notNull(), // e.g., "pixel", "voxel"
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const tools = pgTable("tools", {
    id: serial("id").primaryKey(),
    toolkitId: integer("toolkit_id").notNull(), // .references(() => toolkits.id)
    name: text("name").notNull(),
    description: text("description"),
    iconType: text("icon_type", { enum: ["lucide", "custom"] }).notNull(),
    iconName: text("icon_name").notNull(),
    badgeType: text("badge_type", { enum: ["lucide", "custom"] }),
    badgeName: text("badge_name"),
    badgeAlignment: text("badge_alignment"), // e.g., "top-right", "bottom-left", "center"
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
    iconBadgeUnique: unique("tools_icon_badge_unique").on(table.iconName, table.badgeName),
}));

export const toolbelts = pgTable("toolbelts", {
    id: serial("id").primaryKey(),
    userId: integer("user_id").notNull(), // .references(() => users.id)
    name: text("name").notNull(),
    description: text("description"),
    hotkey: text("hotkey"), // Number key (1-4) for equipping via toolbelt selector
    config: jsonb("config").notNull().default({ rows: 3, cols: 4 }), // ToolbeltConfig
    slots: jsonb("slots").notNull().default([]), // Array of ToolbeltSlot data
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const quickSelectSlots = pgTable("quick_select_slots", {
    id: serial("id").primaryKey(),
    userId: integer("user_id").notNull(), // .references(() => users.id)
    toolId: integer("tool_id").notNull(), // .references(() => tools.id)
    position: integer("position").notNull(), // 0-4
    lastUsedAt: timestamp("last_used_at").defaultNow().notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Zod schemas
export const insertToolkitSchema = createInsertSchema(toolkits).pick({
    name: true,
    description: true,
    editorType: true,
});

export const insertToolSchema = createInsertSchema(tools).pick({
    toolkitId: true,
    name: true,
    description: true,
    iconType: true,
    iconName: true,
    badgeType: true,
    badgeName: true,
    badgeAlignment: true,
    metadata: true,
});

export const insertToolbeltSchema = createInsertSchema(toolbelts).pick({
    name: true,
    description: true,
    hotkey: true,
    config: true,
    slots: true,
});

export const insertQuickSelectSlotSchema = createInsertSchema(quickSelectSlots).pick({
    toolId: true,
    position: true,
});

// TypeScript types
export type Toolkit = typeof toolkits.$inferSelect;
export type InsertToolkit = z.infer<typeof insertToolkitSchema>;

export type Tool = typeof tools.$inferSelect;
export type InsertTool = z.infer<typeof insertToolSchema>;

export type Toolbelt = typeof toolbelts.$inferSelect;
export type InsertToolbelt = z.infer<typeof insertToolbeltSchema>;

export type QuickSelectSlot = typeof quickSelectSlots.$inferSelect;
export type InsertQuickSelectSlot = z.infer<typeof insertQuickSelectSlotSchema>;
