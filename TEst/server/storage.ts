import { users, bots, botAnalytics, botInteractions, type User, type InsertUser, type Bot, type InsertBot, type BotAnalytics, type BotInteraction, insertBotInteractionSchema, insertBotAnalyticsSchema } from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, sum, count } from "drizzle-orm";
import type { z } from "zod";

// Storage interface defining all required methods
export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(insertUser: InsertUser): Promise<User>;

  // Bot methods
  getUserBots(userId: number): Promise<Bot[]>;
  getBot(id: number): Promise<Bot | undefined>;
  getBotByToken(token: string): Promise<Bot | undefined>;
  createBot(insertBot: InsertBot): Promise<Bot>;
  updateBot(id: number, updates: Partial<InsertBot>): Promise<Bot | undefined>;
  deleteBot(id: number): Promise<boolean>;

  // Analytics methods
  getBotAnalytics(botId: number): Promise<BotAnalytics[]>;
  getUserDashboardStats(userId: number): Promise<{
    totalBots: number;
    activeBots: number;
    totalMessages: number;
    totalUsers: number;
  }>;
  
  // Interaction methods
  createBotInteraction(interaction: z.infer<typeof insertBotInteractionSchema>): Promise<BotInteraction>;
  
  // Analytics update methods
  updateBotAnalytics(botId: number, updates: { messagesReceived?: number; messagesSent?: number; activeUsers?: number }): Promise<void>;
}

// Database implementation of storage interface
export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async getUserBots(userId: number): Promise<Bot[]> {
    return await db.select().from(bots).where(eq(bots.userId, userId)).orderBy(desc(bots.createdAt));
  }

  async getBot(id: number): Promise<Bot | undefined> {
    const [bot] = await db.select().from(bots).where(eq(bots.id, id));
    return bot || undefined;
  }

  async getBotByToken(token: string): Promise<Bot | undefined> {
    const [bot] = await db.select().from(bots).where(eq(bots.token, token));
    return bot || undefined;
  }

  async createBot(insertBot: InsertBot): Promise<Bot> {
    const [bot] = await db
      .insert(bots)
      .values(insertBot)
      .returning();
    return bot;
  }

  async updateBot(id: number, updates: Partial<InsertBot>): Promise<Bot | undefined> {
    const [bot] = await db
      .update(bots)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(bots.id, id))
      .returning();
    return bot || undefined;
  }

  async deleteBot(id: number): Promise<boolean> {
    const result = await db.delete(bots).where(eq(bots.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async getBotAnalytics(botId: number): Promise<BotAnalytics[]> {
    return await db.select().from(botAnalytics).where(eq(botAnalytics.botId, botId)).orderBy(desc(botAnalytics.date));
  }

  async getUserDashboardStats(userId: number): Promise<{
    totalBots: number;
    activeBots: number;
    totalMessages: number;
    totalUsers: number;
  }> {
    const userBots = await db.select().from(bots).where(eq(bots.userId, userId));
    const totalBots = userBots.length;
    const activeBots = userBots.filter(bot => bot.isActive).length;

    // For now, return basic stats - can be enhanced with actual analytics data
    return {
      totalBots,
      activeBots,
      totalMessages: 0,
      totalUsers: 0,
    };
  }

  async createBotInteraction(interaction: z.infer<typeof insertBotInteractionSchema>): Promise<BotInteraction> {
    const [result] = await db
      .insert(botInteractions)
      .values(interaction)
      .returning();
    return result;
  }

  async updateBotAnalytics(botId: number, updates: { messagesReceived?: number; messagesSent?: number; activeUsers?: number }): Promise<void> {
    // Check if analytics record exists for today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const [existing] = await db
      .select()
      .from(botAnalytics)
      .where(and(
        eq(botAnalytics.botId, botId),
        eq(botAnalytics.date, today)
      ));

    if (existing) {
      // Update existing record
      await db
        .update(botAnalytics)
        .set({
          messagesReceived: existing.messagesReceived + (updates.messagesReceived || 0),
          messagesSent: existing.messagesSent + (updates.messagesSent || 0),
          activeUsers: Math.max(existing.activeUsers, updates.activeUsers || 0),
        })
        .where(eq(botAnalytics.id, existing.id));
    } else {
      // Create new record
      await db
        .insert(botAnalytics)
        .values({
          botId,
          date: today,
          messagesReceived: updates.messagesReceived || 0,
          messagesSent: updates.messagesSent || 0,
          activeUsers: updates.activeUsers || 0,
        });
    }
  }
}

export const storage = new DatabaseStorage();