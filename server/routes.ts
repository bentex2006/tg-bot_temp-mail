import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertEmailSchema } from "@shared/schema";
import { z } from "zod";
import { telegramBot } from "./services/telegram-bot";

const registrationSchema = insertUserSchema.extend({
  telegramUsername: z.string().min(1).transform(val => val.replace('@', '')),
});

const emailCreationSchema = insertEmailSchema.omit({ userId: true });

const verificationSchema = z.object({
  telegramId: z.string(),
  code: z.string().length(6),
});

export async function registerRoutes(app: Express): Promise<Server> {
  // User registration
  app.post("/api/register", async (req, res) => {
    try {
      const userData = registrationSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByTelegramId(userData.telegramId);
      if (existingUser) {
        return res.status(400).json({ message: "User with this Telegram ID already exists" });
      }

      // Generate verification code
      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Create user
      const user = await storage.createUser(userData);
      await storage.setUserVerificationCode(userData.telegramId, verificationCode);

      // Send verification code via Telegram
      await telegramBot.sendVerificationCode(userData.telegramId, verificationCode);

      res.json({ 
        message: "Registration successful. Please check your Telegram for verification code.",
        userId: user.id 
      });
    } catch (error) {
      console.error("Registration error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input data", errors: error.errors });
      }
      res.status(500).json({ message: "Registration failed" });
    }
  });

  // Verify user
  app.post("/api/verify", async (req, res) => {
    try {
      const { telegramId, code } = verificationSchema.parse(req.body);
      
      const verified = await storage.verifyUser(telegramId, code);
      if (!verified) {
        return res.status(400).json({ message: "Invalid verification code" });
      }

      const user = await storage.getUserByTelegramId(telegramId);
      res.json({ message: "Verification successful", user });
    } catch (error) {
      console.error("Verification error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input data", errors: error.errors });
      }
      res.status(500).json({ message: "Verification failed" });
    }
  });

  // Get user by Telegram ID
  app.get("/api/user/:telegramId", async (req, res) => {
    try {
      const { telegramId } = req.params;
      const user = await storage.getUserByTelegramId(telegramId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({ user });
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ message: "Failed to get user" });
    }
  });

  // Create email
  app.post("/api/emails", async (req, res) => {
    try {
      const { telegramId, type, customPrefix } = req.body;
      
      const user = await storage.getUserByTelegramId(telegramId);
      if (!user || !user.isVerified) {
        return res.status(401).json({ message: "User not found or not verified" });
      }

      if (user.isBanned) {
        return res.status(403).json({ message: "User is banned" });
      }

      // Check usage limits
      const todayUsage = await storage.getTodayUsage(user.id);
      const currentPermanent = todayUsage?.permanentEmailsCreated || 0;
      const currentTemp = todayUsage?.tempEmailsCreated || 0;

      const maxPermanent = user.isPro ? 20 : 2;
      const maxTemp = user.isPro ? Infinity : 5;

      if (type === 'permanent' && currentPermanent >= maxPermanent) {
        return res.status(429).json({ 
          message: `Permanent email limit reached. Limit: ${maxPermanent}` 
        });
      }

      if (type === 'temporary' && currentTemp >= maxTemp) {
        return res.status(429).json({ 
          message: `Temporary email limit reached. Limit: ${maxTemp} per day` 
        });
      }

      // Generate email address
      let emailAddress: string;
      if (type === 'permanent' && customPrefix) {
        emailAddress = `${customPrefix}@kalanaagpur.com`;
      } else {
        const prefix = type === 'permanent' 
          ? `${user.telegramUsername}_${Date.now()}`
          : `temp_${Math.random().toString(36).substring(2, 8)}`;
        emailAddress = `${prefix}@kalanaagpur.com`;
      }

      // Check if email already exists
      const existingEmail = await storage.getEmailByAddress(emailAddress);
      if (existingEmail) {
        return res.status(400).json({ message: "Email address already exists" });
      }

      // Set expiration for temporary emails (24 hours)
      const expiresAt = type === 'temporary' 
        ? new Date(Date.now() + 24 * 60 * 60 * 1000)
        : null;

      const email = await storage.createEmail({
        userId: user.id,
        email: emailAddress,
        type,
        expiresAt,
      });

      // Update usage stats
      await storage.incrementUsage(user.id, type === 'temporary' ? 'temp' : 'permanent');

      res.json({ email });
    } catch (error) {
      console.error("Email creation error:", error);
      res.status(500).json({ message: "Failed to create email" });
    }
  });

  // Get user emails
  app.get("/api/emails/:telegramId", async (req, res) => {
    try {
      const { telegramId } = req.params;
      
      const user = await storage.getUserByTelegramId(telegramId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const emails = await storage.getUserEmails(user.id);
      const todayUsage = await storage.getTodayUsage(user.id);

      res.json({ 
        emails, 
        usage: todayUsage,
        limits: {
          permanent: user.isPro ? 20 : 2,
          temporary: user.isPro ? Infinity : 5,
        }
      });
    } catch (error) {
      console.error("Get emails error:", error);
      res.status(500).json({ message: "Failed to get emails" });
    }
  });

  // Delete email
  app.delete("/api/emails/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteEmail(parseInt(id));
      res.json({ message: "Email deleted successfully" });
    } catch (error) {
      console.error("Delete email error:", error);
      res.status(500).json({ message: "Failed to delete email" });
    }
  });

  // Cleanup expired emails (cron endpoint)
  app.post("/api/cleanup", async (req, res) => {
    try {
      await storage.cleanupExpiredEmails();
      res.json({ message: "Cleanup completed" });
    } catch (error) {
      console.error("Cleanup error:", error);
      res.status(500).json({ message: "Cleanup failed" });
    }
  });

  const httpServer = createServer(app);

  // Initialize Telegram bot
  telegramBot.initialize(storage);

  // Cleanup expired emails every hour
  setInterval(async () => {
    try {
      await storage.cleanupExpiredEmails();
      console.log("Cleaned up expired emails");
    } catch (error) {
      console.error("Cleanup job error:", error);
    }
  }, 60 * 60 * 1000);

  return httpServer;
}
