import { pgTable, text, serial, integer, boolean, timestamp, varchar } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  fullName: text("full_name").notNull(),
  telegramUsername: text("telegram_username").notNull(),
  telegramId: text("telegram_id").notNull().unique(),
  isPro: boolean("is_pro").default(false).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  isBanned: boolean("is_banned").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  verificationCode: varchar("verification_code", { length: 6 }),
  isVerified: boolean("is_verified").default(false).notNull(),
});

export const emails = pgTable("emails", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  email: text("email").notNull().unique(),
  domain: text("domain").notNull().default("kalanaagpur.com"),
  type: text("type", { enum: ["permanent", "temporary"] }).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at"),
});

export const domains = pgTable("domains", {
  id: serial("id").primaryKey(),
  domain: text("domain").notNull().unique(),
  isPremium: boolean("is_premium").default(false).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const usageStats = pgTable("usage_stats", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  date: text("date").notNull(), // YYYY-MM-DD format
  tempEmailsCreated: integer("temp_emails_created").default(0).notNull(),
  permanentEmailsCreated: integer("permanent_emails_created").default(0).notNull(),
});

export const receivedEmails = pgTable("received_emails", {
  id: serial("id").primaryKey(),
  emailId: integer("email_id").references(() => emails.id).notNull(),
  fromAddress: text("from_address").notNull(),
  subject: text("subject").notNull(),
  body: text("body").notNull(),
  receivedAt: timestamp("received_at").defaultNow().notNull(),
  forwardedToTelegram: boolean("forwarded_to_telegram").default(false).notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  emails: many(emails),
  usageStats: many(usageStats),
}));

export const emailsRelations = relations(emails, ({ one, many }) => ({
  user: one(users, {
    fields: [emails.userId],
    references: [users.id],
  }),
  domain: one(domains, {
    fields: [emails.domain],
    references: [domains.domain],
  }),
  receivedEmails: many(receivedEmails),
}));

export const domainsRelations = relations(domains, ({ many }) => ({
  emails: many(emails),
}));

export const usageStatsRelations = relations(usageStats, ({ one }) => ({
  user: one(users, {
    fields: [usageStats.userId],
    references: [users.id],
  }),
}));

export const receivedEmailsRelations = relations(receivedEmails, ({ one }) => ({
  email: one(emails, {
    fields: [receivedEmails.emailId],
    references: [emails.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  fullName: true,
  telegramUsername: true,
  telegramId: true,
});

export const insertEmailSchema = createInsertSchema(emails).pick({
  userId: true,
  email: true,
  domain: true,
  type: true,
  expiresAt: true,
});

export const insertDomainSchema = createInsertSchema(domains).pick({
  domain: true,
  isPremium: true,
});

export const insertUsageStatsSchema = createInsertSchema(usageStats).pick({
  userId: true,
  date: true,
  tempEmailsCreated: true,
  permanentEmailsCreated: true,
});

export const insertReceivedEmailSchema = createInsertSchema(receivedEmails).pick({
  emailId: true,
  fromAddress: true,
  subject: true,
  body: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertEmail = z.infer<typeof insertEmailSchema>;
export type Email = typeof emails.$inferSelect;
export type InsertDomain = z.infer<typeof insertDomainSchema>;
export type Domain = typeof domains.$inferSelect;
export type InsertUsageStats = z.infer<typeof insertUsageStatsSchema>;
export type UsageStats = typeof usageStats.$inferSelect;
export type InsertReceivedEmail = z.infer<typeof insertReceivedEmailSchema>;
export type ReceivedEmail = typeof receivedEmails.$inferSelect;
