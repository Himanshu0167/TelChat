import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp, jsonb, serial } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 50 }).notNull().unique(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: text("password").notNull(),
  firstName: varchar("first_name", { length: 100 }),
  lastName: varchar("last_name", { length: 100 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const bots = pgTable("bots", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 100 }).notNull(),
  username: varchar("username", { length: 100 }).notNull().unique(),
  token: text("token").notNull(),
  description: text("description"),
  isActive: boolean("is_active").default(true).notNull(),
  profilePicture: text("profile_picture"),
  menuStructure: jsonb("menu_structure").default({}).notNull(),
  settings: jsonb("settings").default({}).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const botAnalytics = pgTable("bot_analytics", {
  id: serial("id").primaryKey(),
  botId: integer("bot_id").notNull().references(() => bots.id, { onDelete: "cascade" }),
  date: timestamp("date").defaultNow().notNull(),
  activeUsers: integer("active_users").default(0).notNull(),
  messagesReceived: integer("messages_received").default(0).notNull(),
  messagesSent: integer("messages_sent").default(0).notNull(),
});

export const botInteractions = pgTable("bot_interactions", {
  id: serial("id").primaryKey(),
  botId: integer("bot_id").notNull().references(() => bots.id, { onDelete: "cascade" }),
  telegramUserId: varchar("telegram_user_id", { length: 50 }).notNull(),
  messageText: text("message_text"),
  response: text("response"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  bots: many(bots),
}));

export const botsRelations = relations(bots, ({ one, many }) => ({
  user: one(users, {
    fields: [bots.userId],
    references: [users.id],
  }),
  analytics: many(botAnalytics),
  interactions: many(botInteractions),
}));

export const botAnalyticsRelations = relations(botAnalytics, ({ one }) => ({
  bot: one(bots, {
    fields: [botAnalytics.botId],
    references: [bots.id],
  }),
}));

export const botInteractionsRelations = relations(botInteractions, ({ one }) => ({
  bot: one(bots, {
    fields: [botInteractions.botId],
    references: [bots.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertBotSchema = createInsertSchema(bots).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  username: true,
});

export const insertBotAnalyticsSchema = createInsertSchema(botAnalytics).omit({
  id: true,
  date: true,
});

export const insertBotInteractionSchema = createInsertSchema(botInteractions).omit({
  id: true,
  timestamp: true,
});

// Login schema
export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertBot = z.infer<typeof insertBotSchema>;
export type Bot = typeof bots.$inferSelect;
export type BotAnalytics = typeof botAnalytics.$inferSelect;
export type BotInteraction = typeof botInteractions.$inferSelect;
export type LoginRequest = z.infer<typeof loginSchema>;
