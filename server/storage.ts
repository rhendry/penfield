import {
    users,
    type User,
    type InsertUser,
    projects,
    type Project,
    type InsertProject,
    assets,
    type Asset,
    type InsertAsset,
    toolkits,
    type Toolkit,
    type InsertToolkit,
    tools,
    type Tool,
    type InsertTool,
    toolbelts,
    type Toolbelt,
    type InsertToolbelt,
    quickSelectSlots,
    type QuickSelectSlot,
    type InsertQuickSelectSlot,
    colorPalettes,
    type ColorPalette,
    type InsertColorPalette,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc } from "drizzle-orm";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
    sessionStore: session.Store;
    getUser(id: number): Promise<User | undefined>;
    getUserByUsername(username: string): Promise<User | undefined>;
    createUser(user: InsertUser): Promise<User>;
    updateUser(id: number, user: Partial<User>): Promise<User>;

    // Projects
    getProjects(userId: number): Promise<Project[]>;
    getProject(id: number): Promise<Project | undefined>;
    createProject(userId: number, project: InsertProject): Promise<Project>;

    // Assets
    getAssets(projectId: number): Promise<Asset[]>;
    getAsset(id: number): Promise<Asset | undefined>;
    createAsset(asset: InsertAsset): Promise<Asset>;
    updateAsset(id: number, content: unknown): Promise<Asset>;

    // Toolkits
    getToolkits_async(editorType?: string): Promise<Toolkit[]>;
    getToolkit_async(id: number): Promise<Toolkit | undefined>;

    // Tools
    getTools_async(toolkitId?: number): Promise<Tool[]>;
    getTool_async(id: number): Promise<Tool | undefined>;
    getToolsByToolkit_async(toolkitId: number): Promise<Tool[]>;

    // Toolbelts
    getToolbelts_async(userId: number): Promise<Toolbelt[]>;
    getToolbelt_async(id: number): Promise<Toolbelt | undefined>;
    createToolbelt_async(userId: number, toolbelt: InsertToolbelt): Promise<Toolbelt>;
    updateToolbelt_async(id: number, toolbelt: Partial<InsertToolbelt>): Promise<Toolbelt>;
    deleteToolbelt_async(id: number): Promise<void>;

    // Quick Select Slots
    getQuickSelectSlots_async(userId: number): Promise<QuickSelectSlot[]>;
    addQuickSelectSlot_async(userId: number, slot: InsertQuickSelectSlot): Promise<QuickSelectSlot>;
    removeQuickSelectSlot_async(id: number): Promise<void>;
    updateQuickSelectSlotPosition_async(id: number, position: number): Promise<QuickSelectSlot>;

    // Color Palettes
    getPalettes_async(userId: number): Promise<ColorPalette[]>;
    getPalette_async(id: number): Promise<ColorPalette | undefined>;
    createPalette_async(userId: number, palette: InsertColorPalette): Promise<ColorPalette>;
    updatePalette_async(id: number, palette: Partial<InsertColorPalette>): Promise<ColorPalette>;
    deletePalette_async(id: number): Promise<void>;
    addPaletteColor_async(id: number, color: string): Promise<ColorPalette>;
    removePaletteColor_async(id: number, colorIndex: number): Promise<ColorPalette>;
}

export class DatabaseStorage implements IStorage {
    sessionStore: session.Store;

    constructor() {
        this.sessionStore = new MemoryStore({
            checkPeriod: 86400000,
        });
    }

    async getUser(id: number): Promise<User | undefined> {
        const [user] = await db.select().from(users).where(eq(users.id, id));
        return user;
    }

    async getUserByUsername(username: string): Promise<User | undefined> {
        const [user] = await db.select().from(users).where(eq(users.username, username));
        return user;
    }

    async createUser(insertUser: InsertUser): Promise<User> {
        const [user] = await db.insert(users).values(insertUser).returning();
        return user;
    }

    async updateUser(id: number, userUpdate: Partial<User>): Promise<User> {
        const [user] = await db
            .update(users)
            .set(userUpdate)
            .where(eq(users.id, id))
            .returning();
        return user;
    }

    async getProjects(userId: number): Promise<Project[]> {
        return await db.select().from(projects).where(eq(projects.userId, userId));
    }

    async getProject(id: number): Promise<Project | undefined> {
        const [project] = await db.select().from(projects).where(eq(projects.id, id));
        return project;
    }

    async createProject(userId: number, insertProject: InsertProject): Promise<Project> {
        const [project] = await db
            .insert(projects)
            .values({ ...insertProject, userId })
            .returning();
        return project;
    }

    async getAssets(projectId: number): Promise<Asset[]> {
        return await db.select().from(assets).where(eq(assets.projectId, projectId));
    }

    async getAsset(id: number): Promise<Asset | undefined> {
        const [asset] = await db.select().from(assets).where(eq(assets.id, id));
        return asset;
    }

    async createAsset(insertAsset: InsertAsset): Promise<Asset> {
        const [asset] = await db.insert(assets).values(insertAsset).returning();
        return asset;
    }

    async updateAsset(id: number, content: unknown): Promise<Asset> {
        const [asset] = await db
            .update(assets)
            .set({ content, updatedAt: new Date() })
            .where(eq(assets.id, id))
            .returning();
        return asset;
    }

    // Toolkits
    async getToolkits_async(editorType?: string): Promise<Toolkit[]> {
        if (editorType) {
            return await db
                .select()
                .from(toolkits)
                .where(eq(toolkits.editorType, editorType));
        }
        return await db.select().from(toolkits);
    }

    async getToolkit_async(id: number): Promise<Toolkit | undefined> {
        const [toolkit] = await db.select().from(toolkits).where(eq(toolkits.id, id));
        return toolkit;
    }

    // Tools
    async getTools_async(toolkitId?: number): Promise<Tool[]> {
        if (toolkitId) {
            return await db.select().from(tools).where(eq(tools.toolkitId, toolkitId));
        }
        return await db.select().from(tools);
    }

    async getTool_async(id: number): Promise<Tool | undefined> {
        const [tool] = await db.select().from(tools).where(eq(tools.id, id));
        return tool;
    }

    async getToolsByToolkit_async(toolkitId: number): Promise<Tool[]> {
        return await db.select().from(tools).where(eq(tools.toolkitId, toolkitId));
    }

    // Toolbelts
    async getToolbelts_async(userId: number): Promise<Toolbelt[]> {
        return await db
            .select()
            .from(toolbelts)
            .where(eq(toolbelts.userId, userId))
            .orderBy(desc(toolbelts.updatedAt));
    }

    async getToolbelt_async(id: number): Promise<Toolbelt | undefined> {
        const [toolbelt] = await db.select().from(toolbelts).where(eq(toolbelts.id, id));
        return toolbelt;
    }

    async createToolbelt_async(userId: number, insertToolbelt: InsertToolbelt): Promise<Toolbelt> {
        const [toolbelt] = await db
            .insert(toolbelts)
            .values({ ...insertToolbelt, userId })
            .returning();
        return toolbelt;
    }

    async updateToolbelt_async(id: number, toolbeltUpdate: Partial<InsertToolbelt>): Promise<Toolbelt> {
        const [toolbelt] = await db
            .update(toolbelts)
            .set({ ...toolbeltUpdate, updatedAt: new Date() })
            .where(eq(toolbelts.id, id))
            .returning();
        return toolbelt;
    }

    async deleteToolbelt_async(id: number): Promise<void> {
        await db.delete(toolbelts).where(eq(toolbelts.id, id));
    }

    // Quick Select Slots
    async getQuickSelectSlots_async(userId: number): Promise<QuickSelectSlot[]> {
        return await db
            .select()
            .from(quickSelectSlots)
            .where(eq(quickSelectSlots.userId, userId))
            .orderBy(quickSelectSlots.position);
    }

    async addQuickSelectSlot_async(userId: number, insertSlot: InsertQuickSelectSlot): Promise<QuickSelectSlot> {
        // Check if position is already taken
        const existingSlots = await this.getQuickSelectSlots_async(userId);
        const maxPosition = Math.max(...existingSlots.map((s) => s.position), -1);

        // If adding to a full quick-select (5 slots), use LRU policy
        if (existingSlots.length >= 5) {
            // Find the least recently used slot (oldest lastUsedAt)
            const lruSlot = existingSlots.reduce((oldest, current) =>
                current.lastUsedAt < oldest.lastUsedAt ? current : oldest
            );
            // Update the LRU slot with new tool
            const [updatedSlot] = await db
                .update(quickSelectSlots)
                .set({
                    toolId: insertSlot.toolId,
                    lastUsedAt: new Date(),
                })
                .where(eq(quickSelectSlots.id, lruSlot.id))
                .returning();
            return updatedSlot;
        }

        // Otherwise, add to the next available position
        const position = insertSlot.position ?? maxPosition + 1;
        const [slot] = await db
            .insert(quickSelectSlots)
            .values({ ...insertSlot, userId, position })
            .returning();
        return slot;
    }

    async removeQuickSelectSlot_async(id: number): Promise<void> {
        await db.delete(quickSelectSlots).where(eq(quickSelectSlots.id, id));
    }

    async updateQuickSelectSlotPosition_async(id: number, position: number): Promise<QuickSelectSlot> {
        const [slot] = await db
            .update(quickSelectSlots)
            .set({ position, lastUsedAt: new Date() })
            .where(eq(quickSelectSlots.id, id))
            .returning();
        return slot;
    }

    // Color Palettes
    async getPalettes_async(userId: number): Promise<ColorPalette[]> {
        return await db
            .select()
            .from(colorPalettes)
            .where(eq(colorPalettes.userId, userId))
            .orderBy(desc(colorPalettes.updatedAt));
    }

    async getPalette_async(id: number): Promise<ColorPalette | undefined> {
        const [palette] = await db
            .select()
            .from(colorPalettes)
            .where(eq(colorPalettes.id, id));
        return palette;
    }

    async createPalette_async(userId: number, insertPalette: InsertColorPalette): Promise<ColorPalette> {
        const [palette] = await db
            .insert(colorPalettes)
            .values({ ...insertPalette, userId })
            .returning();
        return palette;
    }

    async updatePalette_async(id: number, paletteUpdate: Partial<InsertColorPalette>): Promise<ColorPalette> {
        const [palette] = await db
            .update(colorPalettes)
            .set({ ...paletteUpdate, updatedAt: new Date() })
            .where(eq(colorPalettes.id, id))
            .returning();
        return palette;
    }

    async deletePalette_async(id: number): Promise<void> {
        await db.delete(colorPalettes).where(eq(colorPalettes.id, id));
    }

    async addPaletteColor_async(id: number, color: string): Promise<ColorPalette> {
        const palette = await this.getPalette_async(id);
        if (!palette) {
            throw new Error("Palette not found");
        }
        const colors = (palette.colors as string[]) || [];
        const updatedColors = [...colors, color];
        return await this.updatePalette_async(id, { colors: updatedColors });
    }

    async removePaletteColor_async(id: number, colorIndex: number): Promise<ColorPalette> {
        const palette = await this.getPalette_async(id);
        if (!palette) {
            throw new Error("Palette not found");
        }
        const colors = (palette.colors as string[]) || [];
        if (colorIndex < 0 || colorIndex >= colors.length) {
            throw new Error("Invalid color index");
        }
        const updatedColors = colors.filter((_, i) => i !== colorIndex);
        return await this.updatePalette_async(id, { colors: updatedColors });
    }
}

export const storage = new DatabaseStorage();
