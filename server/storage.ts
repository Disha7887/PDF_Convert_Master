import crypto from "crypto";
import { 
  users, 
  apiKeys,
  conversionJobs,
  type User, 
  type InsertUser,
  type ApiKey,
  type InsertApiKey,
  type ConversionJob,
  type InsertConversionJob,
  type ToolConfig,
  ToolType,
  ToolCategory
} from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  // User methods
  getUserById(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // API Key methods
  createApiKey(apiKey: InsertApiKey): Promise<ApiKey>;
  getApiKeyByKey(key: string): Promise<ApiKey | undefined>;
  getUserApiKeys(userId: string): Promise<ApiKey[]>;
  
  // Conversion job methods
  createConversionJob(job: InsertConversionJob): Promise<ConversionJob>;
  getConversionJob(id: number): Promise<ConversionJob | undefined>;
  getUserConversionJobs(userId: string): Promise<ConversionJob[]>;
  updateConversionJobStatus(id: number, status: string, outputFilename?: string, errorMessage?: string, processingTime?: number): Promise<ConversionJob | undefined>;
  
  // Tool configuration methods
  getAllTools(): Promise<ToolConfig[]>;
  getToolByType(type: ToolType): Promise<ToolConfig | undefined>;
  getToolsByCategory(category: ToolCategory): Promise<ToolConfig[]>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private apiKeys: Map<string, ApiKey>;
  private conversionJobs: Map<number, ConversionJob>;
  private tools: ToolConfig[] = [];
  private currentJobId: number;

  constructor() {
    this.users = new Map();
    this.apiKeys = new Map();
    this.conversionJobs = new Map();
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
        inputFormats: ["jpg", "jpeg", "png"],
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
      passwordHash: insertUser.passwordHash!,
      plan: insertUser.plan || "free",
      createdAt: now
    };
    this.users.set(id, user);
    return user;
  }

  // API Key methods
  async createApiKey(insertApiKey: InsertApiKey): Promise<ApiKey> {
    const id = crypto.randomUUID();
    const now = new Date();
    const apiKey: ApiKey = {
      id,
      userId: insertApiKey.userId,
      apiKey: insertApiKey.apiKey,
      createdAt: now
    };
    this.apiKeys.set(insertApiKey.apiKey, apiKey);
    return apiKey;
  }

  async getApiKeyByKey(key: string): Promise<ApiKey | undefined> {
    return this.apiKeys.get(key);
  }

  async getUserApiKeys(userId: string): Promise<ApiKey[]> {
    return Array.from(this.apiKeys.values()).filter(
      (apiKey) => apiKey.userId === userId,
    );
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
    processingTime?: number
  ): Promise<ConversionJob | undefined> {
    const job = this.conversionJobs.get(id);
    if (!job) return undefined;

    const updatedJob: ConversionJob = {
      ...job,
      status,
      outputFilename: outputFilename || job.outputFilename,
      errorMessage: errorMessage || job.errorMessage,
      processingTime: processingTime || job.processingTime,
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
        inputFormats: ["jpg", "jpeg", "png"],
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

  // API Key methods
  async createApiKey(insertApiKey: InsertApiKey): Promise<ApiKey> {
    const [apiKey] = await db
      .insert(apiKeys)
      .values(insertApiKey)
      .returning();
    return apiKey;
  }

  async getApiKeyByKey(key: string): Promise<ApiKey | undefined> {
    const [apiKey] = await db.select().from(apiKeys).where(eq(apiKeys.apiKey, key));
    return apiKey || undefined;
  }

  async getUserApiKeys(userId: string): Promise<ApiKey[]> {
    return await db.select().from(apiKeys).where(eq(apiKeys.userId, userId));
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
    processingTime?: number
  ): Promise<ConversionJob | undefined> {
    const updateData: any = { status, updatedAt: new Date() };
    
    if (outputFilename !== undefined) updateData.outputFilename = outputFilename;
    if (errorMessage !== undefined) updateData.errorMessage = errorMessage;
    if (processingTime !== undefined) updateData.processingTime = processingTime;

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
