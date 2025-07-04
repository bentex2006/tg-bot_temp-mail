import { users, emails, domains, usageStats, receivedEmails, type User, type InsertUser, type Email, type InsertEmail, type Domain, type InsertDomain, type UsageStats, type InsertUsageStats, type ReceivedEmail, type InsertReceivedEmail } from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, sql } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByTelegramId(telegramId: string): Promise<User | undefined>;
  getUserByTelegramUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<User>): Promise<User | undefined>;
  setUserVerificationCode(telegramId: string, hashedCode: string, expiry: Date): Promise<void>;
  verifyUser(telegramId: string, code: string): Promise<boolean>;
  
  // Domain operations
  getAllDomains(): Promise<Domain[]>;
  getAvailableDomainsForUser(isPro: boolean): Promise<Domain[]>;
  createDomain(domain: InsertDomain): Promise<Domain>;
  
  // Email operations
  createEmail(email: InsertEmail): Promise<Email>;
  getUserEmails(userId: number): Promise<Email[]>;
  getEmailByAddress(email: string): Promise<Email | undefined>;
  deleteEmail(id: number): Promise<void>;
  cleanupExpiredEmails(): Promise<void>;
  
  // Usage tracking
  getTodayUsage(userId: number): Promise<UsageStats | undefined>;
  incrementUsage(userId: number, type: 'temp' | 'permanent'): Promise<void>;
  
  // Received emails
  saveReceivedEmail(email: InsertReceivedEmail): Promise<ReceivedEmail>;
  markEmailForwarded(id: number): Promise<void>;
  
  // Admin operations
  getAllUsers(): Promise<User[]>;
  getUserStats(username: string): Promise<{ user: User; emailCount: number; todayUsage: UsageStats | null } | undefined>;
  banUser(username: string): Promise<boolean>;
  promoteUser(username: string): Promise<boolean>;
  deleteUserAccount(username: string): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByTelegramId(telegramId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.telegramId, telegramId));
    return user || undefined;
  }

  async getUserByTelegramUsername(username: string): Promise<User | undefined> {
    const cleanUsername = username.replace('@', '');
    const [user] = await db.select().from(users).where(eq(users.telegramUsername, cleanUsername));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    // Check for existing username (case-insensitive)
    const existingByUsername = await db
      .select()
      .from(users)
      .where(sql`LOWER(${users.telegramUsername}) = LOWER(${insertUser.telegramUsername})`);
    
    if (existingByUsername.length > 0) {
      throw new Error("Username already exists");
    }

    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning();
    return user || undefined;
  }

  async setUserVerificationCode(telegramId: string, hashedCode: string, expiry: Date): Promise<void> {
    await db
      .update(users)
      .set({ 
        verificationCode: hashedCode,
        verificationCodeExpiry: expiry 
      })
      .where(eq(users.telegramId, telegramId));
  }

  async verifyUser(telegramId: string, code: string): Promise<boolean> {
    // First get the user with their verification code and expiry
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.telegramId, telegramId));

    if (!user || !user.verificationCode || !user.verificationCodeExpiry) {
      return false;
    }

    // Check if code has expired
    if (new Date() > user.verificationCodeExpiry) {
      // Clear expired code
      await db
        .update(users)
        .set({ verificationCode: null, verificationCodeExpiry: null })
        .where(eq(users.telegramId, telegramId));
      return false;
    }

    // Import crypto utils here to avoid circular dependencies
    const { CryptoUtils } = await import('./utils/crypto');
    
    // Verify the code
    const isValidCode = await CryptoUtils.verifyVerificationCode(code, user.verificationCode);
    
    if (isValidCode) {
      // Update user as verified and clear verification code
      await db
        .update(users)
        .set({ 
          isVerified: true, 
          verificationCode: null, 
          verificationCodeExpiry: null,
          lastLoginAt: new Date()
        })
        .where(eq(users.telegramId, telegramId));
      return true;
    }

    return false;
  }

  async getAllDomains(): Promise<Domain[]> {
    return await db
      .select()
      .from(domains)
      .where(eq(domains.isActive, true))
      .orderBy(domains.domain);
  }

  async getAvailableDomainsForUser(isPro: boolean): Promise<Domain[]> {
    if (isPro) {
      return await this.getAllDomains();
    } else {
      return await db
        .select()
        .from(domains)
        .where(and(eq(domains.isActive, true), eq(domains.isPremium, false)))
        .orderBy(domains.domain);
    }
  }

  async createDomain(insertDomain: InsertDomain): Promise<Domain> {
    const [domain] = await db
      .insert(domains)
      .values(insertDomain)
      .returning();
    return domain;
  }

  async createEmail(insertEmail: InsertEmail): Promise<Email> {
    const [email] = await db
      .insert(emails)
      .values(insertEmail)
      .returning();
    return email;
  }

  async getUserEmails(userId: number): Promise<Email[]> {
    return await db
      .select()
      .from(emails)
      .where(and(eq(emails.userId, userId), eq(emails.isActive, true)))
      .orderBy(desc(emails.createdAt));
  }

  async getEmailByAddress(email: string): Promise<Email | undefined> {
    const [emailRecord] = await db
      .select()
      .from(emails)
      .where(and(eq(emails.email, email), eq(emails.isActive, true)));
    return emailRecord || undefined;
  }

  async deleteEmail(id: number): Promise<void> {
    await db
      .update(emails)
      .set({ isActive: false })
      .where(eq(emails.id, id));
  }

  async cleanupExpiredEmails(): Promise<void> {
    await db
      .update(emails)
      .set({ isActive: false })
      .where(and(
        eq(emails.type, 'temporary'),
        sql`${emails.expiresAt} < NOW()`
      ));
  }

  async getTodayUsage(userId: number): Promise<UsageStats | undefined> {
    const today = new Date().toISOString().split('T')[0];
    const [usage] = await db
      .select()
      .from(usageStats)
      .where(and(eq(usageStats.userId, userId), eq(usageStats.date, today)));
    return usage || undefined;
  }

  async incrementUsage(userId: number, type: 'temp' | 'permanent'): Promise<void> {
    const today = new Date().toISOString().split('T')[0];
    const existing = await this.getTodayUsage(userId);
    
    if (existing) {
      const updateField = type === 'temp' ? 'tempEmailsCreated' : 'permanentEmailsCreated';
      await db
        .update(usageStats)
        .set({
          [updateField]: type === 'temp' 
            ? existing.tempEmailsCreated + 1 
            : existing.permanentEmailsCreated + 1
        })
        .where(eq(usageStats.id, existing.id));
    } else {
      await db
        .insert(usageStats)
        .values({
          userId,
          date: today,
          tempEmailsCreated: type === 'temp' ? 1 : 0,
          permanentEmailsCreated: type === 'permanent' ? 1 : 0,
        });
    }
  }

  async saveReceivedEmail(insertEmail: InsertReceivedEmail): Promise<ReceivedEmail> {
    const [email] = await db
      .insert(receivedEmails)
      .values(insertEmail)
      .returning();
    return email;
  }

  async markEmailForwarded(id: number): Promise<void> {
    await db
      .update(receivedEmails)
      .set({ forwardedToTelegram: true })
      .where(eq(receivedEmails.id, id));
  }

  async getAllUsers(): Promise<User[]> {
    return await db
      .select()
      .from(users)
      .orderBy(desc(users.createdAt));
  }

  async getUserStats(username: string): Promise<{ user: User; emailCount: number; todayUsage: UsageStats | null } | undefined> {
    const user = await this.getUserByTelegramUsername(username);
    if (!user) return undefined;

    const userEmails = await this.getUserEmails(user.id);
    const todayUsage = await this.getTodayUsage(user.id);

    return {
      user,
      emailCount: userEmails.length,
      todayUsage: todayUsage || null,
    };
  }

  async banUser(username: string): Promise<boolean> {
    const user = await this.getUserByTelegramUsername(username);
    if (!user) return false;

    const [updated] = await db
      .update(users)
      .set({ isBanned: true, isActive: false })
      .where(eq(users.id, user.id))
      .returning();
    
    return !!updated;
  }

  async promoteUser(username: string): Promise<boolean> {
    const user = await this.getUserByTelegramUsername(username);
    if (!user) return false;

    const [updated] = await db
      .update(users)
      .set({ isPro: true })
      .where(eq(users.id, user.id))
      .returning();
    
    return !!updated;
  }

  async deleteUserAccount(username: string): Promise<boolean> {
    const user = await this.getUserByTelegramUsername(username);
    if (!user) return false;

    // Deactivate all user emails
    await db
      .update(emails)
      .set({ isActive: false })
      .where(eq(emails.userId, user.id));

    // Deactivate user account
    const [updated] = await db
      .update(users)
      .set({ isActive: false })
      .where(eq(users.id, user.id))
      .returning();
    
    return !!updated;
  }
}

export const storage = new DatabaseStorage();
