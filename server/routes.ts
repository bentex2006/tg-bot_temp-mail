import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { body, validationResult } from "express-validator";
import { storage } from "./storage";
import { insertUserSchema, insertEmailSchema, insertDomainSchema, users } from "@shared/schema";
import { db } from "./db";
import { eq, and, sql } from "drizzle-orm";
import { z } from "zod";
import { telegramBot } from "./services/telegram-bot";
import { emailHandler } from "./services/email-handler";
import { CryptoUtils } from "./utils/crypto";

const registrationSchema = insertUserSchema.extend({
  telegramUsername: z.string()
    .min(1)
    .max(32)
    .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores")
    .transform(val => CryptoUtils.sanitizeString(val.replace('@', ''))),
  fullName: z.string()
    .min(1)
    .max(100)
    .transform(val => CryptoUtils.sanitizeString(val)),
  telegramId: z.string()
    .regex(/^\d+$/, "Telegram ID must be numeric")
    .transform(val => CryptoUtils.sanitizeString(val)),
});

const emailCreationSchema = insertEmailSchema.omit({ userId: true });

const verificationSchema = z.object({
  telegramId: z.string().regex(/^\d+$/, "Invalid Telegram ID"),
  code: z.string().length(6).regex(/^\d{6}$/, "Code must be 6 digits"),
});

// Validation middleware
const validateRegistration = [
  body('fullName').isLength({ min: 1, max: 100 }).escape(),
  body('telegramUsername').isLength({ min: 1, max: 32 }).matches(/^[a-zA-Z0-9_]+$/),
  body('telegramId').isNumeric(),
];

export async function registerRoutes(app: Express): Promise<Server> {
  // User registration
  app.post("/api/register", validateRegistration, async (req: Request, res: Response) => {
    try {
      // Check validation results
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          message: "Invalid input data", 
          errors: errors.array() 
        });
      }

      // Additional SQL injection validation
      const { fullName, telegramUsername, telegramId } = req.body;
      if (!CryptoUtils.validateInput(fullName) || 
          !CryptoUtils.validateInput(telegramUsername) || 
          !CryptoUtils.validateInput(telegramId)) {
        return res.status(400).json({ message: "Invalid characters detected in input" });
      }

      const userData = registrationSchema.parse(req.body);
      const clientIp = req.ip || req.connection.remoteAddress || 'unknown';
      
      // Check if user already exists by Telegram ID
      const existingUserById = await storage.getUserByTelegramId(userData.telegramId);
      if (existingUserById) {
        return res.status(400).json({ message: "User with this Telegram ID already exists" });
      }

      // Check if username already exists (anti-multi-account)
      const existingUserByUsername = await storage.getUserByTelegramUsername(userData.telegramUsername);
      if (existingUserByUsername) {
        return res.status(400).json({ message: "Username already registered" });
      }

      // Rate limiting: Check for recent registrations from same IP (anti-spam)
      const recentRegistrations = await db
        .select()
        .from(users)
        .where(and(
          eq(users.registrationIp, clientIp),
          sql`${users.createdAt} > NOW() - INTERVAL '1 hour'`
        ));

      if (recentRegistrations.length >= 3) {
        return res.status(429).json({ 
          message: "Too many registrations from this IP. Please try again later." 
        });
      }

      // Generate secure verification code
      const verificationCode = CryptoUtils.generateVerificationCode();
      const hashedCode = await CryptoUtils.hashVerificationCode(verificationCode);
      const codeExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
      
      // Create user with IP tracking
      const userDataWithIp = {
        ...userData,
        registrationIp: clientIp
      };
      
      const user = await storage.createUser(userDataWithIp);
      await storage.setUserVerificationCode(userData.telegramId, hashedCode, codeExpiry);

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
      if (error instanceof Error && error.message === "Username already exists") {
        return res.status(400).json({ message: "Username already registered" });
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

  // Get available domains
  app.get("/api/domains/:telegramId", async (req, res) => {
    try {
      const { telegramId } = req.params;
      
      const user = await storage.getUserByTelegramId(telegramId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const domains = await storage.getAvailableDomainsForUser(user.isPro);
      res.json({ domains });
    } catch (error) {
      console.error("Get domains error:", error);
      res.status(500).json({ message: "Failed to get domains" });
    }
  });

  // Create email
  app.post("/api/emails", async (req, res) => {
    try {
      const { telegramId, type, customPrefix, domain } = req.body;
      
      const user = await storage.getUserByTelegramId(telegramId);
      if (!user || !user.isVerified) {
        return res.status(401).json({ message: "User not found or not verified" });
      }

      if (user.isBanned) {
        return res.status(403).json({ message: "User is banned" });
      }

      // For now, only allow kalanaagpur.com
      const allowedDomain = 'kalanaagpur.com';
      if (domain !== allowedDomain) {
        return res.status(403).json({ message: "Only kalanaagpur.com domain is available. Other domains coming soon!" });
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
        emailAddress = `${customPrefix}@${domain}`;
      } else {
        const prefix = type === 'permanent' 
          ? `${user.telegramUsername}_${Date.now()}`
          : `temp_${Math.random().toString(36).substring(2, 8)}`;
        emailAddress = `${prefix}@${domain}`;
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
        domain,
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

  // Email webhook endpoint for Cloudflare Email Routing
  app.post("/api/webhook/email", async (req, res) => {
    try {
      const { to, from, subject, text, html } = req.body;
      
      // Process the incoming email
      await emailHandler.processIncomingEmail({
        to,
        from,
        subject,
        body: text || html || '',
      });
      
      res.status(200).json({ success: true });
    } catch (error) {
      console.error("Email webhook error:", error);
      res.status(500).json({ error: "Failed to process email" });
    }
  });

  const httpServer = createServer(app);

  // Initialize Telegram bot
  telegramBot.initialize(storage);

  // Seed initial domains
  const seedDomains = async () => {
    try {
      const existingDomains = await storage.getAllDomains();
      if (existingDomains.length === 0) {
        // Only kalanaagpur.com for now
        await storage.createDomain({ domain: 'kalanaagpur.com', isPremium: false });
        console.log("Seeded kalanaagpur.com domain");
      }
    } catch (error) {
      console.error("Domain seeding error:", error);
    }
  };

  // Run initial setup
  seedDomains();

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
