import crypto from "crypto";
import { 
  users, 
  apiKeys,
  conversions,
  payments,
  type User, 
  type InsertUser,
  type ApiKey,
  type InsertApiKey,
  type Conversion,
  type InsertConversion,
  type Payment,
  type InsertPayment,
  type ToolConfig,
  ToolType,
  ToolCategory,
  PLAN_LIMITS,
  type PlanType
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, gte, lte, count } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUserById(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;
  updateUserUsage(id: string, dailyUsage: number, monthlyUsage: number): Promise<User | undefined>;
  resetUserUsage(id: string, resetType: 'daily' | 'monthly' | 'both'): Promise<User | undefined>;
  
  // API Key methods
  createApiKey(apiKey: InsertApiKey): Promise<ApiKey>;
  getApiKeyByKey(key: string): Promise<ApiKey | undefined>;
  getUserApiKeys(userId: string): Promise<ApiKey[]>;
  updateApiKeyUsage(id: string): Promise<ApiKey | undefined>;
  deactivateApiKey(id: string): Promise<ApiKey | undefined>;
  
  // Conversion methods
  createConversion(conversion: InsertConversion): Promise<Conversion>;
  getConversion(id: string): Promise<Conversion | undefined>;
  getUserConversions(userId: string, limit?: number): Promise<Conversion[]>;
  updateConversionStatus(id: string, status: string, outputFilename?: string, downloadUrl?: string, errorMessage?: string, processingTime?: number): Promise<Conversion | undefined>;
  
  // Payment methods
  createPayment(payment: InsertPayment): Promise<Payment>;
  getPaymentBySessionId(sessionId: string): Promise<Payment | undefined>;
  updatePayment(id: string, updates: Partial<Payment>): Promise<Payment | undefined>;
  
  // Usage tracking methods
  getUserUsageStats(userId: string): Promise<{ dailyUsage: number; monthlyUsage: number; dailyLimit: number; monthlyLimit: number; plan: string }>;
  
  // Tool configuration methods
  getAllTools(): Promise<ToolConfig[]>;
  getToolByType(type: ToolType): Promise<ToolConfig | undefined>;
  getToolsByCategory(category: ToolCategory): Promise<ToolConfig[]>;
}

export class DatabaseStorage implements IStorage {
  private tools: ToolConfig[] = [];

  constructor() {
    this.initializeTools();
  }

  private initializeTools() {
    this.tools = [
      // PDF Conversion Tools (1-7)
      {
        id: 1,
        name: "PDF to Word",
        type: ToolType.PDF_TO_WORD,
        category: ToolCategory.PDF_CONVERSION,
        description: "Convert PDF documents to editable Word format",
        inputFormats: ["pdf"],
        outputFormat: "docx",
        maxFileSize: 50,
        processingTimeEstimate: 30
      },
      {
        id: 2,
        name: "PDF to Excel",
        type: ToolType.PDF_TO_EXCEL,
        category: ToolCategory.PDF_CONVERSION,
        description: "Convert PDF documents to Excel spreadsheets",
        inputFormats: ["pdf"],
        outputFormat: "xlsx",
        maxFileSize: 50,
        processingTimeEstimate: 45
      },
      {
        id: 3,
        name: "PDF to PowerPoint",
        type: ToolType.PDF_TO_POWERPOINT,
        category: ToolCategory.PDF_CONVERSION,
        description: "Convert PDF documents to PowerPoint presentations",
        inputFormats: ["pdf"],
        outputFormat: "pptx",
        maxFileSize: 50,
        processingTimeEstimate: 60
      },
      {
        id: 4,
        name: "Word to PDF",
        type: ToolType.WORD_TO_PDF,
        category: ToolCategory.PDF_CONVERSION,
        description: "Convert Word documents to PDF format",
        inputFormats: ["doc", "docx"],
        outputFormat: "pdf",
        maxFileSize: 100,
        processingTimeEstimate: 20
      },
      {
        id: 5,
        name: "Excel to PDF",
        type: ToolType.EXCEL_TO_PDF,
        category: ToolCategory.PDF_CONVERSION,
        description: "Convert Excel spreadsheets to PDF format",
        inputFormats: ["xls", "xlsx"],
        outputFormat: "pdf",
        maxFileSize: 100,
        processingTimeEstimate: 25
      },
      {
        id: 6,
        name: "PowerPoint to PDF",
        type: ToolType.POWERPOINT_TO_PDF,
        category: ToolCategory.PDF_CONVERSION,
        description: "Convert PowerPoint presentations to PDF format",
        inputFormats: ["ppt", "pptx"],
        outputFormat: "pdf",
        maxFileSize: 100,
        processingTimeEstimate: 30
      },
      {
        id: 7,
        name: "HTML to PDF",
        type: ToolType.HTML_TO_PDF,
        category: ToolCategory.PDF_CONVERSION,
        description: "Convert HTML pages to PDF documents",
        inputFormats: ["html", "htm", "url"],
        outputFormat: "pdf",
        maxFileSize: 10,
        processingTimeEstimate: 15
      },

      // Image Processing Tools (8-16)
      {
        id: 8,
        name: "Images to PDF",
        type: ToolType.IMAGES_TO_PDF,
        category: ToolCategory.IMAGE_TOOLS,
        description: "Combine multiple images into a single PDF document",
        inputFormats: ["jpg", "jpeg", "png", "gif", "bmp", "tiff", "webp"],
        outputFormat: "pdf",
        maxFileSize: 200,
        processingTimeEstimate: 25
      },
      {
        id: 9,
        name: "PDF to Images",
        type: ToolType.PDF_TO_IMAGES,
        category: ToolCategory.IMAGE_TOOLS,
        description: "Extract images from PDF documents",
        inputFormats: ["pdf"],
        outputFormat: "zip",
        maxFileSize: 100,
        processingTimeEstimate: 40
      },
      {
        id: 10,
        name: "Compress Image",
        type: ToolType.COMPRESS_IMAGE,
        category: ToolCategory.IMAGE_TOOLS,
        description: "Reduce image file size while maintaining quality",
        inputFormats: ["jpg", "jpeg", "png", "webp"],
        outputFormat: "original",
        maxFileSize: 50,
        processingTimeEstimate: 10
      },
      {
        id: 11,
        name: "Convert Image Format",
        type: ToolType.CONVERT_IMAGE_FORMAT,
        category: ToolCategory.IMAGE_TOOLS,
        description: "Convert images between different formats",
        inputFormats: ["jpg", "jpeg", "png", "gif", "bmp", "tiff", "webp"],
        outputFormat: "various",
        maxFileSize: 50,
        processingTimeEstimate: 8
      },
      {
        id: 12,
        name: "Crop Image",
        type: ToolType.CROP_IMAGE,
        category: ToolCategory.IMAGE_TOOLS,
        description: "Crop images to specified dimensions",
        inputFormats: ["jpg", "jpeg", "png", "gif", "bmp", "tiff", "webp"],
        outputFormat: "original",
        maxFileSize: 50,
        processingTimeEstimate: 5
      },
      {
        id: 13,
        name: "Resize Image",
        type: ToolType.RESIZE_IMAGE,
        category: ToolCategory.IMAGE_TOOLS,
        description: "Resize images to custom dimensions",
        inputFormats: ["jpg", "jpeg", "png", "gif", "bmp", "tiff", "webp"],
        outputFormat: "original",
        maxFileSize: 50,
        processingTimeEstimate: 6
      },
      {
        id: 14,
        name: "Rotate Image",
        type: ToolType.ROTATE_IMAGE,
        category: ToolCategory.IMAGE_TOOLS,
        description: "Rotate images by specified degrees",
        inputFormats: ["jpg", "jpeg", "png", "gif", "bmp", "tiff", "webp"],
        outputFormat: "original",
        maxFileSize: 50,
        processingTimeEstimate: 4
      },
      {
        id: 15,
        name: "Upscale Image",
        type: ToolType.UPSCALE_IMAGE,
        category: ToolCategory.IMAGE_TOOLS,
        description: "Increase image resolution using AI algorithms",
        inputFormats: ["jpg", "jpeg", "png"],
        outputFormat: "original",
        maxFileSize: 25,
        processingTimeEstimate: 120
      },
      {
        id: 16,
        name: "Remove Background",
        type: ToolType.REMOVE_BACKGROUND,
        category: ToolCategory.IMAGE_TOOLS,
        description: "Remove background from images automatically",
        inputFormats: ["jpg", "jpeg", "png"],
        outputFormat: "png",
        maxFileSize: 25,
        processingTimeEstimate: 45
      },

      // PDF Management Tools (17-20)
      {
        id: 17,
        name: "Merge PDFs",
        type: ToolType.MERGE_PDFS,
        category: ToolCategory.PDF_MANAGEMENT,
        description: "Combine multiple PDF files into one document",
        inputFormats: ["pdf"],
        outputFormat: "pdf",
        maxFileSize: 500,
        processingTimeEstimate: 20
      },
      {
        id: 18,
        name: "Split PDF",
        type: ToolType.SPLIT_PDF,
        category: ToolCategory.PDF_MANAGEMENT,
        description: "Split PDF into separate pages or page ranges",
        inputFormats: ["pdf"],
        outputFormat: "zip",
        maxFileSize: 200,
        processingTimeEstimate: 30
      },
      {
        id: 19,
        name: "Compress PDF",
        type: ToolType.COMPRESS_PDF,
        category: ToolCategory.PDF_MANAGEMENT,
        description: "Reduce PDF file size while maintaining readability",
        inputFormats: ["pdf"],
        outputFormat: "pdf",
        maxFileSize: 200,
        processingTimeEstimate: 35
      },
      {
        id: 20,
        name: "Rotate PDF",
        type: ToolType.ROTATE_PDF,
        category: ToolCategory.PDF_MANAGEMENT,
        description: "Rotate PDF pages by 90, 180, or 270 degrees",
        inputFormats: ["pdf"],
        outputFormat: "pdf",
        maxFileSize: 100,
        processingTimeEstimate: 15
      }
    ];
  }

  // User methods
  async getUserById(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    const planLimits = PLAN_LIMITS[user.plan as PlanType] || PLAN_LIMITS.free;
    
    const [newUser] = await db
      .insert(users)
      .values({
        ...user,
        dailyLimit: planLimits.daily,
        monthlyLimit: planLimits.monthly,
      })
      .returning();
    return newUser;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

  async updateUserUsage(id: string, dailyUsage: number, monthlyUsage: number): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set({ 
        dailyUsage, 
        monthlyUsage, 
        updatedAt: new Date() 
      })
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

  async resetUserUsage(id: string, resetType: 'daily' | 'monthly' | 'both'): Promise<User | undefined> {
    const updates: Partial<User> = { updatedAt: new Date() };
    
    if (resetType === 'daily' || resetType === 'both') {
      updates.dailyUsage = 0;
    }
    if (resetType === 'monthly' || resetType === 'both') {
      updates.monthlyUsage = 0;
    }
    if (resetType === 'both') {
      updates.lastUsageReset = new Date();
    }

    const [updatedUser] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

  // API Key methods
  async createApiKey(apiKey: InsertApiKey): Promise<ApiKey> {
    const [newApiKey] = await db
      .insert(apiKeys)
      .values(apiKey)
      .returning();
    return newApiKey;
  }

  async getApiKeyByKey(key: string): Promise<ApiKey | undefined> {
    const [apiKey] = await db
      .select()
      .from(apiKeys)
      .where(and(eq(apiKeys.apiKey, key), eq(apiKeys.isActive, true)));
    return apiKey;
  }

  async getUserApiKeys(userId: string): Promise<ApiKey[]> {
    return await db
      .select()
      .from(apiKeys)
      .where(eq(apiKeys.userId, userId))
      .orderBy(desc(apiKeys.createdAt));
  }

  async updateApiKeyUsage(id: string): Promise<ApiKey | undefined> {
    const [updatedApiKey] = await db
      .update(apiKeys)
      .set({ 
        lastUsed: new Date(),
        usageCount: db.select({ count: count() }).from(apiKeys).where(eq(apiKeys.id, id))
      })
      .where(eq(apiKeys.id, id))
      .returning();
    return updatedApiKey;
  }

  async deactivateApiKey(id: string): Promise<ApiKey | undefined> {
    const [updatedApiKey] = await db
      .update(apiKeys)
      .set({ isActive: false })
      .where(eq(apiKeys.id, id))
      .returning();
    return updatedApiKey;
  }

  // Conversion methods
  async createConversion(conversion: InsertConversion): Promise<Conversion> {
    const [newConversion] = await db
      .insert(conversions)
      .values(conversion)
      .returning();
    return newConversion;
  }

  async getConversion(id: string): Promise<Conversion | undefined> {
    const [conversion] = await db
      .select()
      .from(conversions)
      .where(eq(conversions.id, id));
    return conversion;
  }

  async getUserConversions(userId: string, limit: number = 50): Promise<Conversion[]> {
    return await db
      .select()
      .from(conversions)
      .where(eq(conversions.userId, userId))
      .orderBy(desc(conversions.createdAt))
      .limit(limit);
  }

  async updateConversionStatus(
    id: string, 
    status: string, 
    outputFilename?: string, 
    downloadUrl?: string, 
    errorMessage?: string, 
    processingTime?: number
  ): Promise<Conversion | undefined> {
    const updates: Partial<Conversion> = { 
      status, 
      updatedAt: new Date() 
    };
    
    if (outputFilename) updates.outputFilename = outputFilename;
    if (downloadUrl) updates.downloadUrl = downloadUrl;
    if (errorMessage) updates.errorMessage = errorMessage;
    if (processingTime) updates.processingTime = processingTime;

    const [updatedConversion] = await db
      .update(conversions)
      .set(updates)
      .where(eq(conversions.id, id))
      .returning();
    return updatedConversion;
  }

  // Payment methods
  async createPayment(payment: InsertPayment): Promise<Payment> {
    const [newPayment] = await db
      .insert(payments)
      .values(payment)
      .returning();
    return newPayment;
  }

  async getPaymentBySessionId(sessionId: string): Promise<Payment | undefined> {
    const [payment] = await db
      .select()
      .from(payments)
      .where(eq(payments.stripeSessionId, sessionId));
    return payment;
  }

  async updatePayment(id: string, updates: Partial<Payment>): Promise<Payment | undefined> {
    const [updatedPayment] = await db
      .update(payments)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(payments.id, id))
      .returning();
    return updatedPayment;
  }

  // Usage tracking methods
  async getUserUsageStats(userId: string): Promise<{ 
    dailyUsage: number; 
    monthlyUsage: number; 
    dailyLimit: number; 
    monthlyLimit: number; 
    plan: string;
  }> {
    const user = await this.getUserById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    return {
      dailyUsage: user.dailyUsage,
      monthlyUsage: user.monthlyUsage,
      dailyLimit: user.dailyLimit,
      monthlyLimit: user.monthlyLimit,
      plan: user.plan,
    };
  }

  // Tool configuration methods
  async getAllTools(): Promise<ToolConfig[]> {
    return this.tools;
  }

  async getToolByType(type: ToolType): Promise<ToolConfig | undefined> {
    return this.tools.find(tool => tool.type === type);
  }

  async getToolsByCategory(category: ToolCategory): Promise<ToolConfig[]> {
    return this.tools.filter(tool => tool.category === category);
  }
}

export const storage = new DatabaseStorage();