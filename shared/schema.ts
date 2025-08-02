import { pgTable, text, serial, integer, boolean, timestamp, uuid, bigint } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table with authentication system
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  plan: text("plan").notNull().default("free"), // free, starter, pro, enterprise
  dailyUsage: integer("daily_usage").notNull().default(0),
  monthlyUsage: integer("monthly_usage").notNull().default(0),
  dailyLimit: integer("daily_limit").notNull().default(10),
  monthlyLimit: integer("monthly_limit").notNull().default(100),
  lastUsageReset: timestamp("last_usage_reset").defaultNow(),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  subscriptionStatus: text("subscription_status").default("inactive"), // active, inactive, cancelled, past_due
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// API Keys table
export const apiKeys = pgTable("api_keys", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  apiKey: text("api_key").unique().notNull(),
  name: text("name").notNull().default("Default API Key"),
  isActive: boolean("is_active").notNull().default(true),
  lastUsed: timestamp("last_used"),
  usageCount: integer("usage_count").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// Payments table for Stripe tracking
export const payments = pgTable("payments", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  stripeSessionId: text("stripe_session_id"),
  stripePaymentIntentId: text("stripe_payment_intent_id"),
  amount: integer("amount").notNull(), // in cents
  currency: text("currency").notNull().default("usd"),
  status: text("status").notNull(), // pending, succeeded, failed, cancelled
  planType: text("plan_type").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});


// User schemas
export const insertUserSchema = createInsertSchema(users, {
  email: z.string().email("Invalid email format")
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastUsageReset: true,
  dailyUsage: true,
  monthlyUsage: true,
});

export const registerUserSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const loginUserSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
});

// API Key schemas
export const insertApiKeySchema = createInsertSchema(apiKeys).omit({
  id: true,
  createdAt: true,
  lastUsed: true,
  usageCount: true,
});

export const createApiKeySchema = z.object({
  name: z.string().min(1, "API key name is required").max(100, "Name too long"),
});

// Payment schemas
export const insertPaymentSchema = createInsertSchema(payments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const createPaymentSchema = z.object({
  planType: z.enum(["starter", "pro", "enterprise"]),
  billingPeriod: z.enum(["monthly", "yearly"]).default("monthly"),
});

// Forward declaration moved down after conversions is defined

// Usage tracking schemas
export const usageStatsSchema = z.object({
  dailyUsage: z.number(),
  monthlyUsage: z.number(),
  dailyLimit: z.number(),
  monthlyLimit: z.number(),
  plan: z.string(),
  remainingDaily: z.number(),
  remainingMonthly: z.number(),
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type RegisterUser = z.infer<typeof registerUserSchema>;
export type LoginUser = z.infer<typeof loginUserSchema>;
export type InsertApiKey = z.infer<typeof insertApiKeySchema>;
export type ApiKey = typeof apiKeys.$inferSelect;
export type CreateApiKey = z.infer<typeof createApiKeySchema>;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type Payment = typeof payments.$inferSelect;
export type CreatePayment = z.infer<typeof createPaymentSchema>;
export type InsertConversion = z.infer<typeof insertConversionSchema>;
export type Conversion = typeof conversions.$inferSelect;
export type UsageStats = z.infer<typeof usageStatsSchema>;

// Tool categories and types
export enum ToolCategory {
  PDF_CONVERSION = "pdf_conversion",
  IMAGE_TOOLS = "image_tools", 
  PDF_MANAGEMENT = "pdf_management"
}

export enum ToolType {
  // PDF Conversion Tools
  PDF_TO_WORD = "pdf_to_word",
  PDF_TO_EXCEL = "pdf_to_excel",
  PDF_TO_POWERPOINT = "pdf_to_powerpoint",
  WORD_TO_PDF = "word_to_pdf",
  EXCEL_TO_PDF = "excel_to_pdf",
  POWERPOINT_TO_PDF = "powerpoint_to_pdf",
  HTML_TO_PDF = "html_to_pdf",
  
  // Image Tools
  IMAGES_TO_PDF = "images_to_pdf",
  PDF_TO_IMAGES = "pdf_to_images",
  COMPRESS_IMAGE = "compress_image",
  CONVERT_IMAGE_FORMAT = "convert_image_format",
  CROP_IMAGE = "crop_image",
  RESIZE_IMAGE = "resize_image",
  ROTATE_IMAGE = "rotate_image",
  UPSCALE_IMAGE = "upscale_image",
  REMOVE_BACKGROUND = "remove_background",
  
  // PDF Management Tools
  MERGE_PDFS = "merge_pdfs",
  SPLIT_PDF = "split_pdf",
  COMPRESS_PDF = "compress_pdf",
  ROTATE_PDF = "rotate_pdf"
}

// Conversion jobs table (renamed to conversions for better API consistency)
export const conversions = pgTable("conversions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  apiKeyId: uuid("api_key_id").references(() => apiKeys.id),
  toolType: text("tool_type").notNull(),
  status: text("status").notNull().default("pending"), // pending, processing, completed, failed
  inputFilename: text("input_filename").notNull(),
  outputFilename: text("output_filename"),
  downloadUrl: text("download_url"),
  inputFileSize: bigint("input_file_size", { mode: "number" }),
  outputFileSize: bigint("output_file_size", { mode: "number" }),
  processingTime: integer("processing_time"), // in milliseconds
  errorMessage: text("error_message"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Legacy table alias for backward compatibility
export const conversionJobs = conversions;

// Conversion schemas (moved here after conversions is defined)  
export const insertConversionSchema = createInsertSchema(conversions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Plan configurations
export const PLAN_LIMITS = {
  free: { daily: 5, monthly: 20, price: 0 },
  starter: { daily: 50, monthly: 500, price: 999 }, // $9.99/month
  pro: { daily: 200, monthly: 2000, price: 2999 }, // $29.99/month
  enterprise: { daily: 1000, monthly: 10000, price: 9999 }, // $99.99/month
} as const;

export type PlanType = keyof typeof PLAN_LIMITS;

// Tool configuration
export interface ToolConfig {
  id: number;
  name: string;
  type: ToolType;
  category: ToolCategory;
  description: string;
  inputFormats: string[];
  outputFormat: string;
  maxFileSize: number; // in MB
  processingTimeEstimate: number; // in seconds
}

// File conversion request/response schemas
export const fileConversionRequestSchema = z.object({
  toolType: z.nativeEnum(ToolType),
  fileName: z.string().min(1),
  fileSize: z.number().positive(),
  options: z.record(z.any()).optional(), // Additional conversion options
});

export const fileConversionResponseSchema = z.object({
  jobId: z.number(),
  status: z.string(),
  message: z.string(),
  downloadUrl: z.string().optional(),
  processingTime: z.number().optional(),
});

export type FileConversionRequest = z.infer<typeof fileConversionRequestSchema>;
export type FileConversionResponse = z.infer<typeof fileConversionResponseSchema>;

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  apiKeys: many(apiKeys),
  conversions: many(conversions),
  payments: many(payments),
}));

export const apiKeysRelations = relations(apiKeys, ({ one, many }) => ({
  user: one(users, {
    fields: [apiKeys.userId],
    references: [users.id],
  }),
  conversions: many(conversions),
}));

export const conversionsRelations = relations(conversions, ({ one }) => ({
  user: one(users, {
    fields: [conversions.userId],
    references: [users.id],
  }),
  apiKey: one(apiKeys, {
    fields: [conversions.apiKeyId],
    references: [apiKeys.id],
  }),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  user: one(users, {
    fields: [payments.userId],
    references: [users.id],
  }),
}));

// Backward compatibility
export const conversionJobsRelations = conversionsRelations;
