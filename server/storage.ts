import { users, type User, type InsertUser, projects, type Project, type InsertProject, assets, type Asset, type InsertAsset } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";
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
}

export const storage = new DatabaseStorage();
