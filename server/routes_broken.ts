import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import { storage } from "./storage";
import { 
  fileConversionRequestSchema,
  ToolType,
  ToolCategory
} from "@shared/schema";
import { z } from "zod";

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(), // Store files in memory for processing
  limits: {
    fileSize: 200 * 1024 * 1024, // 200MB max file size
  },
  fileFilter: (req, file, cb) => {
    // Accept all file types for now, validation will be done in the route
    cb(null, true);
  },
});

// Extend Request interface to include session
interface RequestWithSession extends Request {
  session?: {
    user?: {
      id: number;
      username: string;
    };
  };
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Get all available tools
  app.get("/api/tools", async (req, res) => {
    try {
      const tools = await storage.getAllTools();
      res.json({
        success: true,
        data: tools,
        total: tools.length
      });
    } catch (error) {
      console.error("Error fetching tools:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch tools"
      });
    }
  });

  // Get tools by category
  app.get("/api/tools/category/:category", async (req, res) => {
    try {
      const { category } = req.params;
      
      // Validate category
      if (!Object.values(ToolCategory).includes(category as ToolCategory)) {
        return res.status(400).json({
          success: false,
          error: "Invalid tool category"
        });
      }

      const tools = await storage.getToolsByCategory(category as ToolCategory);
      res.json({
        success: true,
        data: tools,
        category,
        total: tools.length
      });
    } catch (error) {
      console.error("Error fetching tools by category:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch tools by category"
      });
    }
  });

  // Get specific tool by type
  app.get("/api/tools/:toolType", async (req, res) => {
    try {
      const { toolType } = req.params;
      
      // Validate tool type
      if (!Object.values(ToolType).includes(toolType as ToolType)) {
        return res.status(400).json({
          success: false,
          error: "Invalid tool type"
        });
      }

      const tool = await storage.getToolByType(toolType as ToolType);
      if (!tool) {
        return res.status(404).json({
          success: false,
          error: "Tool not found"
        });
      }

      res.json({
        success: true,
        data: tool
      });
    } catch (error) {
      console.error("Error fetching tool:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch tool"
      });
    }
  });

  // Start file conversion job
  app.post("/api/convert", upload.single('file'), async (req, res) => {
    try {
      // Check if file was uploaded
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: "No file uploaded"
        });
      }

      // Validate request body with form data
      const requestData = {
        toolType: req.body.toolType,
        fileName: req.body.fileName || req.file.originalname,
        fileSize: parseInt(req.body.fileSize) || req.file.size,
        options: req.body.options ? JSON.parse(req.body.options) : {}
      };

      const validationResult = fileConversionRequestSchema.safeParse(requestData);
      if (!validationResult.success) {
        return res.status(400).json({
          success: false,
          error: "Invalid request data",
          details: validationResult.error.errors
        });
      }

      const { toolType, fileName, fileSize, options } = validationResult.data;

      // Get tool configuration
      const tool = await storage.getToolByType(toolType);
      if (!tool) {
        return res.status(404).json({
          success: false,
          error: "Tool not found"
        });
      }

      // Validate file size
      if (fileSize > tool.maxFileSize * 1024 * 1024) { // Convert MB to bytes
        return res.status(400).json({
          success: false,
          error: `File size exceeds maximum limit of ${tool.maxFileSize}MB`
        });
      }

      // Validate file format
      const fileExtension = fileName.split('.').pop()?.toLowerCase();
      if (!fileExtension || !tool.inputFormats.includes(fileExtension)) {
        return res.status(400).json({
          success: false,
          error: `Unsupported file format. Supported formats: ${tool.inputFormats.join(', ')}`
        });
      }

      // Create conversion job
      const job = await storage.createConversionJob({
        userId: (req as RequestWithSession).session?.user?.id || null, // Handle anonymous users
        toolType,
        status: "pending",
        inputFilename: fileName,
        inputFileSize: fileSize,
        outputFilename: null,
        outputFileSize: null,
        processingTime: null,
        errorMessage: null
      });

      // Process file asynchronously
      processFile(job.id, req.file, tool, fileName, toolType)
        .catch(error => {
          console.error(`Processing failed for job ${job.id}:`, error);
        });

      // Return job info immediately
      res.json({
        success: true,
        data: {
          jobId: job.id,
          status: job.status,
          inputFilename: job.inputFilename,
          message: "File uploaded successfully. Processing started."
        }
      });

    } catch (error) {
      console.error("Conversion error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to start conversion",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

    } catch (error) {
      console.error("Conversion error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to start conversion",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Process file function (async)
  async function processFile(jobId: number, file: Express.Multer.File, tool: any, fileName: string, toolType: ToolType) {
    try {
      // Update job status to processing
      await storage.updateConversionJobStatus(jobId, "processing");

      // Simulate processing time for now
      const processingTime = Math.floor(tool.processingTimeEstimate * 1000 + Math.random() * 2000);
      await new Promise(resolve => setTimeout(resolve, processingTime));
      
      // Generate output filename
      const inputName = fileName.substring(0, fileName.lastIndexOf('.'));
      const fileExtension = fileName.split('.').pop()?.toLowerCase();
      const outputExtension = tool.outputFormat === "same" ? fileExtension : tool.outputFormat;
      const outputFilename = `${inputName}_converted.${outputExtension}`;
      
      // Simulate output file size (70-90% of input for compression, 110-130% for conversions)
      const fileSize = file.size;
      let outputFileSize = fileSize;
      if (toolType.includes("compress")) {
        outputFileSize = Math.floor(fileSize * (0.7 + Math.random() * 0.2));
      } else {
        outputFileSize = Math.floor(fileSize * (1.1 + Math.random() * 0.2));
      }

      // Update job to completed
      await storage.updateConversionJobStatus(
        jobId,
        "completed",
        outputFilename,
        undefined,
        processingTime
      );

    } catch (error) {
      console.error("Error processing job:", error);
      await storage.updateConversionJobStatus(
        jobId,
        "failed",
        undefined,
        "Processing failed due to internal error"
      );
    }
  }

  // Get conversion job status
  app.get("/api/jobs/:jobId", async (req, res) => {
    try {
      const jobId = parseInt(req.params.jobId);
      if (isNaN(jobId)) {
        return res.status(400).json({
          success: false,
          error: "Invalid job ID"
        });
      }

      const job = await storage.getConversionJob(jobId);
      if (!job) {
        return res.status(404).json({
          success: false,
          error: "Job not found"
        });
      }

      res.json({
        success: true,
        data: {
          jobId: job.id,
          status: job.status,
          inputFilename: job.inputFilename,
          outputFilename: job.outputFilename,
          processingTime: job.processingTime,
          errorMessage: job.errorMessage,
          createdAt: job.createdAt,
          updatedAt: job.updatedAt,
          downloadUrl: job.status === "completed" && job.outputFilename 
            ? `/api/download/${job.id}` 
            : undefined
        }
      });
    } catch (error) {
      console.error("Error fetching job:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch job status"
      });
    }
  });

  // Get user's conversion history
  app.get("/api/jobs", async (req, res) => {
    try {
      const userId = (req as RequestWithSession).session?.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: "Authentication required"
        });
      }

      const jobs = await storage.getConversionJobsByUser(userId);
      
      // Sort by creation date (newest first)
      jobs.sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());

      res.json({
        success: true,
        data: jobs.map(job => ({
          jobId: job.id,
          toolType: job.toolType,
          status: job.status,
          inputFilename: job.inputFilename,
          outputFilename: job.outputFilename,
          processingTime: job.processingTime,
          createdAt: job.createdAt,
          downloadUrl: job.status === "completed" && job.outputFilename 
            ? `/api/download/${job.id}` 
            : undefined
        })),
        total: jobs.length
      });
    } catch (error) {
      console.error("Error fetching user jobs:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch job history"
      });
    }
  });

  // Download converted file
  app.get("/api/download/:jobId", async (req, res) => {
    try {
      const jobId = parseInt(req.params.jobId);
      if (isNaN(jobId)) {
        return res.status(400).json({
          success: false,
          error: "Invalid job ID"
        });
      }

      const job = await storage.getConversionJob(jobId);
      if (!job) {
        return res.status(404).json({
          success: false,
          error: "Job not found"
        });
      }

      if (job.status !== "completed" || !job.outputFilename) {
        return res.status(400).json({
          success: false,
          error: "File not ready for download"
        });
      }

      // In a real application, you would serve the actual file from storage
      // For now, we'll return a success response with file info
      res.json({
        success: true,
        message: "File download would start here",
        data: {
          filename: job.outputFilename,
          size: job.outputFileSize,
          downloadUrl: `/files/${job.outputFilename}`
        }
      });
    } catch (error) {
      console.error("Error downloading file:", error);
      res.status(500).json({
        success: false,
        error: "Failed to download file"
      });
    }
  });

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({
      success: true,
      message: "PDF Conversion API is running",
      timestamp: new Date().toISOString(),
      version: "1.0.0"
    });
  });

  // API documentation endpoint
  app.get("/api/docs", async (req, res) => {
    try {
      const tools = await storage.getAllTools();
      
      const toolsByCategory = tools.reduce((acc, tool) => {
        if (!acc[tool.category]) {
          acc[tool.category] = [];
        }
        acc[tool.category].push(tool);
        return acc;
      }, {} as Record<string, typeof tools>);

      res.json({
        success: true,
        data: {
          title: "PDF Conversion & Image Processing API",
          version: "1.0.0",
          description: "Complete API for PDF conversion, image processing, and document management tools",
          categories: {
            [ToolCategory.PDF_CONVERSION]: {
              name: "PDF Conversion Tools",
              description: "Convert PDFs to various formats and vice versa",
              tools: toolsByCategory[ToolCategory.PDF_CONVERSION] || []
            },
            [ToolCategory.IMAGE_TOOLS]: {
              name: "Image Processing Tools",
              description: "Comprehensive image editing and conversion tools",
              tools: toolsByCategory[ToolCategory.IMAGE_TOOLS] || []
            },
            [ToolCategory.PDF_MANAGEMENT]: {
              name: "PDF Management Tools",
              description: "Tools for managing and manipulating PDF documents",
              tools: toolsByCategory[ToolCategory.PDF_MANAGEMENT] || []
            }
          },
          endpoints: {
            "GET /api/tools": "Get all available tools",
            "GET /api/tools/category/:category": "Get tools by category",
            "GET /api/tools/:toolType": "Get specific tool details",
            "POST /api/convert": "Start file conversion",
            "GET /api/jobs/:jobId": "Get job status",
            "GET /api/jobs": "Get user's job history",
            "GET /api/download/:jobId": "Download converted file",
            "GET /api/health": "API health check",
            "GET /api/docs": "API documentation"
          }
        }
      });
    } catch (error) {
      console.error("Error generating docs:", error);
      res.status(500).json({
        success: false,
        error: "Failed to generate documentation"
      });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
