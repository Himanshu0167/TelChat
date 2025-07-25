import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, loginSchema, insertBotSchema } from "@shared/schema";
import { ZodError } from "zod";
import bcrypt from "bcrypt";
import { telegramService } from "./services/telegram";

declare module "express-session" {
  interface SessionData {
    userId?: number;
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Auth routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByUsername(userData.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      const existingEmail = await storage.getUserByEmail(userData.email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email already exists" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      
      const user = await storage.createUser({
        ...userData,
        password: hashedPassword,
      });

      req.session.userId = user.id;
      
      res.json({ user: { id: user.id, username: user.username, email: user.email, firstName: user.firstName, lastName: user.lastName } });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = loginSchema.parse(req.body);
      
      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      req.session.userId = user.id;
      
      res.json({ user: { id: user.id, username: user.username, email: user.email, firstName: user.firstName, lastName: user.lastName } });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Could not log out" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/auth/me", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const user = await storage.getUser(req.session.userId);
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    res.json({ user: { id: user.id, username: user.username, email: user.email, firstName: user.firstName, lastName: user.lastName } });
  });

  // Middleware to check authentication
  const requireAuth = (req: any, res: any, next: any) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Authentication required" });
    }
    next();
  };

  // Bot routes
  app.get("/api/bots", requireAuth, async (req, res) => {
    try {
      const bots = await storage.getUserBots(req.session.userId!);
      res.json(bots);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch bots" });
    }
  });

  app.post("/api/bots", requireAuth, async (req, res) => {
    try {
      console.log("Bot creation request:", req.body);
      
      const botData = insertBotSchema.parse({
        ...req.body,
        userId: req.session.userId,
      });

      console.log("Parsed bot data:", botData);

      // Validate Telegram bot token (skip for development/testing)
      let botUsername = `${botData.name.toLowerCase().replace(/\s+/g, '_')}_bot`;
      
      if (botData.token && botData.token.length > 10) {
        try {
          const botInfo = await telegramService.validateBotToken(botData.token);
          if (botInfo) {
            botUsername = botInfo.username;
            console.log("Bot info from Telegram:", botInfo);
          } else {
            console.log("Token validation failed, using generated username");
          }
        } catch (error) {
          console.log("Token validation error, using generated username:", error);
        }
      } else {
        console.log("No valid token provided, using generated username for testing");
      }

      // Set up webhook automatically
      const webhookUrl = `https://${process.env.REPLIT_DEV_DOMAIN || 'your-app-name.replit.app'}/api/webhook/${botData.token}`;
      
      if (botData.token && botData.token.length > 10) {
        try {
          const webhookSet = await telegramService.setWebhook(botData.token, webhookUrl);
          console.log(`Webhook setup ${webhookSet ? 'successful' : 'failed'} for ${webhookUrl}`);
        } catch (error) {
          console.log("Webhook setup error:", error);
        }
      }
      
      const bot = await storage.createBot({
        ...botData,
        username: botUsername,
        settings: {
          ...(typeof botData.settings === 'object' && botData.settings !== null ? botData.settings : {}),
          webhookUrl,
        },
      });

      console.log("Bot created successfully:", bot);
      res.json(bot);
    } catch (error) {
      console.error("Bot creation error:", error);
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create bot. Please try again." });
    }
  });

  app.get("/api/bots/:id", requireAuth, async (req, res) => {
    try {
      const botId = parseInt(req.params.id);
      const bot = await storage.getBot(botId);
      
      if (!bot || bot.userId !== req.session.userId) {
        return res.status(404).json({ message: "Bot not found" });
      }

      res.json(bot);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch bot" });
    }
  });

  app.put("/api/bots/:id", requireAuth, async (req, res) => {
    try {
      const botId = parseInt(req.params.id);
      const bot = await storage.getBot(botId);
      
      if (!bot || bot.userId !== req.session.userId) {
        return res.status(404).json({ message: "Bot not found" });
      }

      const updatedBot = await storage.updateBot(botId, req.body);
      res.json(updatedBot);
    } catch (error) {
      res.status(500).json({ message: "Failed to update bot" });
    }
  });

  app.delete("/api/bots/:id", requireAuth, async (req, res) => {
    try {
      const botId = parseInt(req.params.id);
      const bot = await storage.getBot(botId);
      
      if (!bot || bot.userId !== req.session.userId) {
        return res.status(404).json({ message: "Bot not found" });
      }

      await storage.deleteBot(botId);
      res.json({ message: "Bot deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete bot" });
    }
  });

  // Analytics routes
  app.get("/api/bots/:id/analytics", requireAuth, async (req, res) => {
    try {
      const botId = parseInt(req.params.id);
      const bot = await storage.getBot(botId);
      
      if (!bot || bot.userId !== req.session.userId) {
        return res.status(404).json({ message: "Bot not found" });
      }

      const analytics = await storage.getBotAnalytics(botId);
      res.json(analytics);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  app.get("/api/dashboard/stats", requireAuth, async (req, res) => {
    try {
      const stats = await storage.getUserDashboardStats(req.session.userId!);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  // Telegram webhook handler
  app.post("/api/webhook/:token", async (req, res) => {
    try {
      const token = req.params.token;
      const update = req.body;
      
      console.log("Received webhook update:", JSON.stringify(update, null, 2));
      
      const bot = await storage.getBotByToken(token);
      
      if (!bot) {
        console.log("Bot not found for token:", token);
        return res.status(404).json({ message: "Bot not found" });
      }
      
      console.log("Processing update for bot:", bot.name);
      await telegramService.handleUpdate(bot, update);
      
      res.status(200).json({ ok: true });
    } catch (error) {
      console.error("Webhook error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
