import { pgTable, text, serial, integer, boolean, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table with authentication system
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  plan: text("plan").notNull().default("free"),
  createdAt: timestamp("created_at").defaultNow(),
});

// API Keys table
export const apiKeys = pgTable("api_keys", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  apiKey: text("api_key").unique().notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// User schemas
export const insertUserSchema = createInsertSchema(users, {
  email: z.string().email("Invalid email format")
}).pick({
  email: true,
  passwordHash: true,
  plan: true,
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
export const insertApiKeySchema = createInsertSchema(apiKeys).pick({
  userId: true,
  apiKey: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type RegisterUser = z.infer<typeof registerUserSchema>;
export type LoginUser = z.infer<typeof loginUserSchema>;
export type InsertApiKey = z.infer<typeof insertApiKeySchema>;
export type ApiKey = typeof apiKeys.$inferSelect;

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

// Conversion jobs table  
export const conversionJobs = pgTable("conversion_jobs", {
  id: serial("id").primaryKey(),
  userId: uuid("user_id").references(() => users.id),
  toolType: text("tool_type").notNull(),
  status: text("status").notNull().default("pending"), // pending, processing, completed, failed
  inputFilename: text("input_filename").notNull(),
  outputFilename: text("output_filename"),
  inputFileSize: integer("input_file_size"),
  outputFileSize: integer("output_file_size"),
  processingTime: integer("processing_time"), // in milliseconds
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertConversionJobSchema = createInsertSchema(conversionJobs).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertConversionJob = z.infer<typeof insertConversionJobSchema>;
export type ConversionJob = typeof conversionJobs.$inferSelect;

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
