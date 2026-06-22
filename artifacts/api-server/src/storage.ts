import crypto from "crypto";
import { 
  users, 
  apiKeys,
  conversionJobs,
  passwordResetCodes,
  type User, 
  type InsertUser,
  type ApiKey,
  type InsertApiKey,
  type ConversionJob,
  type InsertConversionJob,
  type PasswordResetCode,
  type ToolConfig,
  ToolType,
  ToolCategory
} from "@workspace/db";
import { db } from "./db";
import { and, desc, eq, gt, isNull, sql } from "drizzle-orm";
import { hashApiKey } from "./utils/generateApiKey";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  // User methods
  getUserById(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserProfile(id: string, updates: { name?: string; email?: string }): Promise<User | undefined>;
  updateUserProfilePicture(id: string, profilePictureUrl: string): Promise<User | undefined>;
  updateUserPassword(id: string, passwordHash: string): Promise<void>;

  // Password reset methods
  createPasswordResetCode(userId: string, codeHash: string, expiresAt: Date): Promise<void>;
  getLatestActiveResetCode(userId: string): Promise<PasswordResetCode | undefined>;
  consumeResetCode(id: string): Promise<void>;
  incrementResetAttempts(id: string): Promise<number>;
  
  // API Key methods
  createApiKey(apiKey: InsertApiKey): Promise<ApiKey>;
  getApiKeyByKey(key: string): Promise<ApiKey | undefined>; // accepts the RAW key; hashes internally
  getApiKeyById(id: string): Promise<ApiKey | undefined>;
  getUserApiKeys(userId: string): Promise<ApiKey[]>;
  deleteApiKey(id: string): Promise<boolean>;
  updateApiKeyLastUsed(id: string): Promise<void>;
  
  // Conversion job methods
  createConversionJob(job: InsertConversionJob): Promise<ConversionJob>;
  getConversionJob(id: number): Promise<ConversionJob | undefined>;
  getUserConversionJobs(userId: string): Promise<ConversionJob[]>;
  updateConversionJobStatus(id: number, status: string, outputFilename?: string, errorMessage?: string, processingTime?: number, outputFileSize?: number): Promise<ConversionJob | undefined>;
  
  // Tool configuration methods
  getAllTools(): Promise<ToolConfig[]>;
  getToolByType(type: ToolType): Promise<ToolConfig | undefined>;
  getToolsByCategory(category: ToolCategory): Promise<ToolConfig[]>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private apiKeys: Map<string, ApiKey>;
  private conversionJobs: Map<number, ConversionJob>;
  private resetCodes: Map<string, PasswordResetCode>;
  private tools: ToolConfig[] = [];
  private currentJobId: number;

  constructor() {
    this.users = new Map();
    this.apiKeys = new Map();
    this.conversionJobs = new Map();
    this.resetCodes = new Map();
    this.currentJobId = 1;
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
        maxFileSize: 200,
        processingTimeEstimate: 30
      },
      {
        id: 7,
        name: "HTML to PDF",
        type: ToolType.HTML_TO_PDF,
        category: ToolCategory.PDF_CONVERSION,
        description: "Convert HTML pages to PDF documents",
        inputFormats: ["html", "htm"],
        outputFormat: "pdf",
        maxFileSize: 10,
        processingTimeEstimate: 15
      },
      
      // Image Tools (8-16)
      {
        id: 8,
        name: "Images to PDF",
        type: ToolType.IMAGES_TO_PDF,
        category: ToolCategory.IMAGE_TOOLS,
        description: "Combine multiple images into a single PDF document",
        inputFormats: ["jpg", "jpeg", "png", "gif", "bmp", "tiff"],
        outputFormat: "pdf",
        maxFileSize: 100,
        processingTimeEstimate: 20
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
        inputFormats: ["jpg", "jpeg", "png", "gif", "bmp"],
        outputFormat: "same",
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
        processingTimeEstimate: 15
      },
      {
        id: 12,
        name: "Crop Image",
        type: ToolType.CROP_IMAGE,
        category: ToolCategory.IMAGE_TOOLS,
        description: "Crop images to specific dimensions or ratios",
        inputFormats: ["jpg", "jpeg", "png", "gif", "bmp"],
        outputFormat: "same",
        maxFileSize: 50,
        processingTimeEstimate: 5
      },
      {
        id: 13,
        name: "Resize Image",
        type: ToolType.RESIZE_IMAGE,
        category: ToolCategory.IMAGE_TOOLS,
        description: "Resize images to specific dimensions",
        inputFormats: ["jpg", "jpeg", "png", "gif", "bmp"],
        outputFormat: "same",
        maxFileSize: 50,
        processingTimeEstimate: 8
      },
      {
        id: 14,
        name: "Rotate Image",
        type: ToolType.ROTATE_IMAGE,
        category: ToolCategory.IMAGE_TOOLS,
        description: "Rotate images by specified angles",
        inputFormats: ["jpg", "jpeg", "png", "gif", "bmp"],
        outputFormat: "same",
        maxFileSize: 50,
        processingTimeEstimate: 5
      },
      {
        id: 15,
        name: "Upscale Image",
        type: ToolType.UPSCALE_IMAGE,
        category: ToolCategory.IMAGE_TOOLS,
        description: "Enhance image resolution using AI upscaling",
        inputFormats: ["jpg", "jpeg", "png", "webp"],
        outputFormat: "same",
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
        processingTimeEstimate: 30
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
        maxFileSize: 200,
        processingTimeEstimate: 25
      },
      {
        id: 18,
        name: "Split PDF",
        type: ToolType.SPLIT_PDF,
        category: ToolCategory.PDF_MANAGEMENT,
        description: "Split PDF documents into separate pages or ranges",
        inputFormats: ["pdf"],
        outputFormat: "zip",
        maxFileSize: 100,
        processingTimeEstimate: 20
      },
      {
        id: 19,
        name: "Compress PDF",
        type: ToolType.COMPRESS_PDF,
        category: ToolCategory.PDF_MANAGEMENT,
        description: "Reduce PDF file size while maintaining quality",
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
        description: "Rotate PDF pages by specified angles",
        inputFormats: ["pdf"],
        outputFormat: "pdf",
        maxFileSize: 100,
        processingTimeEstimate: 15
      },
      {
        id: 21,
        name: "OCR PDF",
        type: ToolType.OCR_PDF,
        category: ToolCategory.PDF_MANAGEMENT,
        description: "Recognise text in scanned PDFs and export a searchable PDF",
        inputFormats: ["pdf"],
        outputFormat: "pdf",
        maxFileSize: 100,
        processingTimeEstimate: 60
      }
    ];
  }

  // User methods
  async getUserById(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = crypto.randomUUID();
    const now = new Date();
    const user: User = { 
      id,
      email: insertUser.email!,
      name: insertUser.name ?? null,
      passwordHash: insertUser.passwordHash!,
      plan: insertUser.plan || "free",
      profilePictureUrl: null,
      createdAt: now
    };
    this.users.set(id, user);
    return user;
  }

  async updateUserProfile(
    id: string,
    updates: { name?: string; email?: string },
  ): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    const next: User = {
      ...user,
      name: updates.name !== undefined ? updates.name : user.name,
      email: updates.email !== undefined ? updates.email : user.email,
    };
    this.users.set(id, next);
    return next;
  }

  async updateUserProfilePicture(
    id: string,
    profilePictureUrl: string,
  ): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    const next: User = { ...user, profilePictureUrl };
    this.users.set(id, next);
    return next;
  }

  async updateUserPassword(id: string, passwordHash: string): Promise<void> {
    const user = this.users.get(id);
    if (!user) return;
    this.users.set(id, { ...user, passwordHash });
  }

  // Password reset methods
  async createPasswordResetCode(
    userId: string,
    codeHash: string,
    expiresAt: Date,
  ): Promise<void> {
    // Invalidate any previous codes for this user so only the newest works.
    for (const [key, code] of this.resetCodes) {
      if (code.userId === userId) this.resetCodes.delete(key);
    }
    const id = crypto.randomUUID();
    this.resetCodes.set(id, {
      id,
      userId,
      codeHash,
      expiresAt,
      consumedAt: null,
      createdAt: new Date(),
    });
  }

  async getLatestActiveResetCode(
    userId: string,
  ): Promise<PasswordResetCode | undefined> {
    const now = Date.now();
    return Array.from(this.resetCodes.values())
      .filter(
        (c) =>
          c.userId === userId &&
          !c.consumedAt &&
          c.expiresAt.getTime() > now,
      )
      .sort((a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0))[0];
  }

  async consumeResetCode(id: string): Promise<void> {
    const code = this.resetCodes.get(id);
    if (code) this.resetCodes.set(id, { ...code, consumedAt: new Date() });
  }

  async incrementResetAttempts(id: string): Promise<number> {
    const code = this.resetCodes.get(id);
    if (!code) return 0;
    const attempts = (code.attempts ?? 0) + 1;
    this.resetCodes.set(id, { ...code, attempts });
    return attempts;
  }

  // API Key methods
  // NOTE: insertApiKey.apiKey is expected to already be the sha256 HASH of the
  // raw key (hashing is done by the caller in routes.ts). The Map is keyed by id.
  async createApiKey(insertApiKey: InsertApiKey): Promise<ApiKey> {
    const id = crypto.randomUUID();
    const now = new Date();
    const apiKey: ApiKey = {
      id,
      userId: insertApiKey.userId,
      apiKey: insertApiKey.apiKey,
      name: insertApiKey.name ?? null,
      keyLast4: insertApiKey.keyLast4 ?? null,
      lastUsedAt: null,
      createdAt: now
    };
    this.apiKeys.set(id, apiKey);
    return apiKey;
  }

  async getApiKeyByKey(key: string): Promise<ApiKey | undefined> {
    const hash = hashApiKey(key);
    return Array.from(this.apiKeys.values()).find((k) => k.apiKey === hash);
  }

  async getApiKeyById(id: string): Promise<ApiKey | undefined> {
    return this.apiKeys.get(id);
  }

  async getUserApiKeys(userId: string): Promise<ApiKey[]> {
    return Array.from(this.apiKeys.values()).filter(
      (apiKey) => apiKey.userId === userId,
    );
  }

  async deleteApiKey(id: string): Promise<boolean> {
    return this.apiKeys.delete(id);
  }

  async updateApiKeyLastUsed(id: string): Promise<void> {
    const existing = this.apiKeys.get(id);
    if (existing) {
      existing.lastUsedAt = new Date();
      this.apiKeys.set(id, existing);
    }
  }

  // Conversion job methods
  async createConversionJob(insertJob: InsertConversionJob): Promise<ConversionJob> {
    const id = this.currentJobId++;
    const now = new Date();
    const job: ConversionJob = { 
      id,
      userId: insertJob.userId || null,
      toolType: insertJob.toolType,
      status: insertJob.status || "pending",
      source: insertJob.source || "web",
      inputFilename: insertJob.inputFilename,
      outputFilename: insertJob.outputFilename || null,
      inputFileSize: insertJob.inputFileSize || null,
      outputFileSize: insertJob.outputFileSize || null,
      processingTime: insertJob.processingTime || null,
      errorMessage: insertJob.errorMessage || null,
      createdAt: now,
      updatedAt: now
    };
    this.conversionJobs.set(id, job);
    return job;
  }

  async getConversionJob(id: number): Promise<ConversionJob | undefined> {
    return this.conversionJobs.get(id);
  }

  async getUserConversionJobs(userId: string): Promise<ConversionJob[]> {
    return Array.from(this.conversionJobs.values()).filter(
      (job) => job.userId === userId,
    );
  }

  async updateConversionJobStatus(
    id: number, 
    status: string, 
    outputFilename?: string, 
    errorMessage?: string,
    processingTime?: number,
    outputFileSize?: number
  ): Promise<ConversionJob | undefined> {
    const job = this.conversionJobs.get(id);
    if (!job) return undefined;

    const updatedJob: ConversionJob = {
      ...job,
      status,
      outputFilename: outputFilename || job.outputFilename,
      errorMessage: errorMessage || job.errorMessage,
      processingTime: processingTime || job.processingTime,
      outputFileSize: outputFileSize ?? job.outputFileSize,
      updatedAt: new Date()
    };

    this.conversionJobs.set(id, updatedJob);
    return updatedJob;
  }

  // Tool configuration methods
  async getAllTools(): Promise<ToolConfig[]> {
    return [...this.tools];
  }

  async getToolByType(type: ToolType): Promise<ToolConfig | undefined> {
    return this.tools.find(tool => tool.type === type);
  }

  async getToolsByCategory(category: ToolCategory): Promise<ToolConfig[]> {
    return this.tools.filter(tool => tool.category === category);
  }
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
        maxFileSize: 200,
        processingTimeEstimate: 30
      },
      {
        id: 7,
        name: "HTML to PDF",
        type: ToolType.HTML_TO_PDF,
        category: ToolCategory.PDF_CONVERSION,
        description: "Convert HTML pages to PDF documents",
        inputFormats: ["html", "htm"],
        outputFormat: "pdf",
        maxFileSize: 10,
        processingTimeEstimate: 15
      },
      
      // Image Tools (8-16)
      {
        id: 8,
        name: "Images to PDF",
        type: ToolType.IMAGES_TO_PDF,
        category: ToolCategory.IMAGE_TOOLS,
        description: "Combine multiple images into a single PDF document",
        inputFormats: ["jpg", "jpeg", "png", "gif", "bmp", "tiff"],
        outputFormat: "pdf",
        maxFileSize: 100,
        processingTimeEstimate: 20
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
        inputFormats: ["jpg", "jpeg", "png", "gif", "bmp"],
        outputFormat: "same",
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
        processingTimeEstimate: 15
      },
      {
        id: 12,
        name: "Crop Image",
        type: ToolType.CROP_IMAGE,
        category: ToolCategory.IMAGE_TOOLS,
        description: "Crop images to specific dimensions or ratios",
        inputFormats: ["jpg", "jpeg", "png", "gif", "bmp"],
        outputFormat: "same",
        maxFileSize: 50,
        processingTimeEstimate: 5
      },
      {
        id: 13,
        name: "Resize Image",
        type: ToolType.RESIZE_IMAGE,
        category: ToolCategory.IMAGE_TOOLS,
        description: "Resize images to specific dimensions",
        inputFormats: ["jpg", "jpeg", "png", "gif", "bmp"],
        outputFormat: "same",
        maxFileSize: 50,
        processingTimeEstimate: 8
      },
      {
        id: 14,
        name: "Rotate Image",
        type: ToolType.ROTATE_IMAGE,
        category: ToolCategory.IMAGE_TOOLS,
        description: "Rotate images by specified angles",
        inputFormats: ["jpg", "jpeg", "png", "gif", "bmp"],
        outputFormat: "same",
        maxFileSize: 50,
        processingTimeEstimate: 5
      },
      {
        id: 15,
        name: "Upscale Image",
        type: ToolType.UPSCALE_IMAGE,
        category: ToolCategory.IMAGE_TOOLS,
        description: "Enhance image resolution using AI upscaling",
        inputFormats: ["jpg", "jpeg", "png", "webp"],
        outputFormat: "same",
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
        processingTimeEstimate: 30
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
        maxFileSize: 200,
        processingTimeEstimate: 25
      },
      {
        id: 18,
        name: "Split PDF",
        type: ToolType.SPLIT_PDF,
        category: ToolCategory.PDF_MANAGEMENT,
        description: "Split PDF documents into separate pages or ranges",
        inputFormats: ["pdf"],
        outputFormat: "zip",
        maxFileSize: 100,
        processingTimeEstimate: 20
      },
      {
        id: 19,
        name: "Compress PDF",
        type: ToolType.COMPRESS_PDF,
        category: ToolCategory.PDF_MANAGEMENT,
        description: "Reduce PDF file size while maintaining quality",
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
        description: "Rotate PDF pages by specified angles",
        inputFormats: ["pdf"],
        outputFormat: "pdf",
        maxFileSize: 100,
        processingTimeEstimate: 15
      },
      {
        id: 21,
        name: "OCR PDF",
        type: ToolType.OCR_PDF,
        category: ToolCategory.PDF_MANAGEMENT,
        description: "Recognise text in scanned PDFs and export a searchable PDF",
        inputFormats: ["pdf"],
        outputFormat: "pdf",
        maxFileSize: 100,
        processingTimeEstimate: 60
      }
    ];
  }

  // User methods
  async getUserById(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
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

  async updateUserProfile(
    id: string,
    updates: { name?: string; email?: string },
  ): Promise<User | undefined> {
    const set: Partial<typeof users.$inferInsert> = {};
    if (updates.name !== undefined) set.name = updates.name;
    if (updates.email !== undefined) set.email = updates.email;
    const [user] = await db.update(users).set(set).where(eq(users.id, id)).returning();
    return user || undefined;
  }

  async updateUserProfilePicture(
    id: string,
    profilePictureUrl: string,
  ): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ profilePictureUrl })
      .where(eq(users.id, id))
      .returning();
    return user || undefined;
  }

  async updateUserPassword(id: string, passwordHash: string): Promise<void> {
    await db.update(users).set({ passwordHash }).where(eq(users.id, id));
  }

  // Password reset methods
  async createPasswordResetCode(
    userId: string,
    codeHash: string,
    expiresAt: Date,
  ): Promise<void> {
    // Invalidate any previous codes for this user so only the newest works.
    await db.delete(passwordResetCodes).where(eq(passwordResetCodes.userId, userId));
    await db.insert(passwordResetCodes).values({ userId, codeHash, expiresAt });
  }

  async getLatestActiveResetCode(
    userId: string,
  ): Promise<PasswordResetCode | undefined> {
    const [code] = await db
      .select()
      .from(passwordResetCodes)
      .where(
        and(
          eq(passwordResetCodes.userId, userId),
          isNull(passwordResetCodes.consumedAt),
          gt(passwordResetCodes.expiresAt, new Date()),
        ),
      )
      .orderBy(desc(passwordResetCodes.createdAt))
      .limit(1);
    return code || undefined;
  }

  async consumeResetCode(id: string): Promise<void> {
    await db
      .update(passwordResetCodes)
      .set({ consumedAt: new Date() })
      .where(eq(passwordResetCodes.id, id));
  }

  // Atomically bump the failed-attempt counter and return the new total so the
  // caller can invalidate the code once the brute-force limit is reached.
  async incrementResetAttempts(id: string): Promise<number> {
    const [row] = await db
      .update(passwordResetCodes)
      .set({ attempts: sql`${passwordResetCodes.attempts} + 1` })
      .where(eq(passwordResetCodes.id, id))
      .returning({ attempts: passwordResetCodes.attempts });
    return row?.attempts ?? 0;
  }

  // API Key methods
  async createApiKey(insertApiKey: InsertApiKey): Promise<ApiKey> {
    const [apiKey] = await db
      .insert(apiKeys)
      .values(insertApiKey)
      .returning();
    return apiKey;
  }

  async getApiKeyByKey(key: string): Promise<ApiKey | undefined> {
    const [apiKey] = await db.select().from(apiKeys).where(eq(apiKeys.apiKey, hashApiKey(key)));
    return apiKey || undefined;
  }

  async getApiKeyById(id: string): Promise<ApiKey | undefined> {
    const [apiKey] = await db.select().from(apiKeys).where(eq(apiKeys.id, id));
    return apiKey || undefined;
  }

  async getUserApiKeys(userId: string): Promise<ApiKey[]> {
    return await db.select().from(apiKeys).where(eq(apiKeys.userId, userId));
  }

  async deleteApiKey(id: string): Promise<boolean> {
    const deleted = await db.delete(apiKeys).where(eq(apiKeys.id, id)).returning();
    return deleted.length > 0;
  }

  async updateApiKeyLastUsed(id: string): Promise<void> {
    await db.update(apiKeys).set({ lastUsedAt: new Date() }).where(eq(apiKeys.id, id));
  }

  // Conversion job methods
  async createConversionJob(insertJob: InsertConversionJob): Promise<ConversionJob> {
    const [job] = await db
      .insert(conversionJobs)
      .values(insertJob)
      .returning();
    return job;
  }

  async getConversionJob(id: number): Promise<ConversionJob | undefined> {
    const [job] = await db.select().from(conversionJobs).where(eq(conversionJobs.id, id));
    return job || undefined;
  }

  async getUserConversionJobs(userId: string): Promise<ConversionJob[]> {
    return await db.select().from(conversionJobs).where(eq(conversionJobs.userId, userId));
  }

  async updateConversionJobStatus(
    id: number, 
    status: string, 
    outputFilename?: string, 
    errorMessage?: string,
    processingTime?: number,
    outputFileSize?: number
  ): Promise<ConversionJob | undefined> {
    const updateData: any = { status, updatedAt: new Date() };
    
    if (outputFilename !== undefined) updateData.outputFilename = outputFilename;
    if (errorMessage !== undefined) updateData.errorMessage = errorMessage;
    if (processingTime !== undefined) updateData.processingTime = processingTime;
    if (outputFileSize !== undefined) updateData.outputFileSize = outputFileSize;

    const [job] = await db
      .update(conversionJobs)
      .set(updateData)
      .where(eq(conversionJobs.id, id))
      .returning();
    
    return job || undefined;
  }

  // Tool configuration methods
  async getAllTools(): Promise<ToolConfig[]> {
    return [...this.tools];
  }

  async getToolByType(type: ToolType): Promise<ToolConfig | undefined> {
    return this.tools.find(tool => tool.type === type);
  }

  async getToolsByCategory(category: ToolCategory): Promise<ToolConfig[]> {
    return this.tools.filter(tool => tool.category === category);
  }
}

export const storage = new DatabaseStorage();
export const memStorage = new MemStorage();
