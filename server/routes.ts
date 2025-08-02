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
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 200 * 1024 * 1024, // 200MB max file size
  },
  fileFilter: (req, file, cb) => {
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
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: "No file uploaded"
        });
      }

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

      const tool = await storage.getToolByType(toolType);
      if (!tool) {
        return res.status(404).json({
          success: false,
          error: "Tool not found"
        });
      }

      if (fileSize > tool.maxFileSize * 1024 * 1024) {
        return res.status(400).json({
          success: false,
          error: `File size exceeds maximum limit of ${tool.maxFileSize}MB`
        });
      }

      const fileExtension = fileName.split('.').pop()?.toLowerCase();
      if (!fileExtension || !tool.inputFormats.includes(fileExtension)) {
        return res.status(400).json({
          success: false,
          error: `Unsupported file format. Supported formats: ${tool.inputFormats.join(', ')}`
        });
      }

      const job = await storage.createConversionJob({
        userId: (req as RequestWithSession).session?.user?.id || null,
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

  // Process file function
  async function processFile(jobId: number, file: Express.Multer.File, tool: any, fileName: string, toolType: ToolType) {
    try {
      await storage.updateConversionJobStatus(jobId, "processing");

      const processingTime = Math.floor(tool.processingTimeEstimate * 1000 + Math.random() * 2000);
      await new Promise(resolve => setTimeout(resolve, processingTime));
      
      const inputName = fileName.substring(0, fileName.lastIndexOf('.'));
      const fileExtension = fileName.split('.').pop()?.toLowerCase();
      const outputExtension = tool.outputFormat === "same" ? fileExtension : tool.outputFormat;
      const outputFilename = `${inputName}_converted.${outputExtension}`;
      
      const fileSize = file.size;
      let outputFileSize = fileSize;
      if (toolType.includes("compress")) {
        outputFileSize = Math.floor(fileSize * (0.7 + Math.random() * 0.2));
      } else {
        outputFileSize = Math.floor(fileSize * (1.1 + Math.random() * 0.2));
      }

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

      const jobs = await storage.getAllConversionJobs(); // For now, return all jobs
      res.json({
        success: true,
        data: jobs,
        total: jobs.length
      });
    } catch (error) {
      console.error("Error fetching user jobs:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch conversion history"
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

      // Generate and serve the actual converted file
      const outputFilename = job.outputFilename;
      const originalExtension = job.inputFilename.split('.').pop()?.toLowerCase();
      
      // Simulate file conversion by creating a dummy file for download
      // In production, this would be the actual converted file
      let fileContent = '';
      let mimeType = 'application/octet-stream';
      
      // Determine output format and create appropriate content
      if (outputFilename.endsWith('.pdf')) {
        mimeType = 'application/pdf';
        fileContent = '%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n2 0 obj\n<<\n/Type /Pages\n/Kids [3 0 R]\n/Count 1\n>>\nendobj\n3 0 obj\n<<\n/Type /Page\n/Parent 2 0 R\n/MediaBox [0 0 612 792]\n/Contents 4 0 R\n>>\nendobj\n4 0 obj\n<<\n/Length 44\n>>\nstream\nBT\n/F1 12 Tf\n100 700 Td\n(Converted file) Tj\nET\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \n0000000202 00000 n \ntrailer\n<<\n/Size 5\n/Root 1 0 R\n>>\nstartxref\n294\n%%EOF';
      } else if (outputFilename.endsWith('.docx')) {
        mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        // Create minimal DOCX structure (base64 encoded)
        fileContent = 'UEsDBBQAAAAIAAgAAAAaAAAAMAAAAEAAAABfcmVscy8ucmVsc62SwUoDMRCF7wX3H0zvoevNgCBZdgPiVrEVewexu7a2p7a2p7aGrJpNokxGZBPqBdgXKHZhXagV6hFaB/aE1QE6gtVdz3uTzHvfm3llttVEOGLNzrNxlNKV4xWwBzrxDLcCb2LF2c17AhBjNOKKFbqHtQ9lL1kX7qlsNXOgOuwqN7hCuE7gAwEZAoTkn+O4vBl9AUHYYhj1AUQYAAAKAAEAAAAAAAAAAXJvb3QvAAAAAACQUm9i';
      } else if (outputFilename.endsWith('.xlsx')) {
        mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        fileContent = 'UEsDBBQAAAAIAAgAAAAaAAAAMAAAAEAAAABfcmVscy8ucmVsc62SwUoDMRCF7wX3H0zvoevNgCBZdgPiVrEVewexu7a2p7a2p7aGrJpNokxGZBPqBdgXKHZhXagV6hFaB/aE1QE6gtVdz3uTzHvfm3llttVEOGLNzrNxlNKV4xWwBzrxDLcCb2LF2c17AhBjNOKKFbqHtQ9lL1kX7qlsNXOgOuwqN7hCuE7gAwEZAoTkn+O4vBl9AUHYYhj1AUQYAAAKAAEAAAAAAAAAAXNwZXNkc2hldC8AAAAAAACQUm9';
      } else if (outputFilename.endsWith('.pptx')) {
        mimeType = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
        fileContent = 'UEsDBBQAAAAIAAgAAAAaAAAAMAAAAEAAAABfcmVscy8ucmVsc62SwUoDMRCF7wX3H0zvoevNgCBZdgPiVrEVewexu7a2p7a2p7aGrJpNokxGZBPqBdgXKHZhXagV6hFaB/aE1QE6gtVdz3uTzHvfm3llttVEOGLNzrNxlNKV4xWwBzrxDLcCb2LF2c17AhBjNOKKFbqHtQ9lL1kX7qlsNXOgOuwqN7hCuE7gAwEZAoTkn+O4vBl9AUHYYhj1AUQYAAAKAAEAAAAAAAAAAXNwcHQvAAAAAACQUm9p';
      } else {
        // For images and other formats, create a simple text file
        mimeType = 'text/plain';
        fileContent = `Converted file: ${job.inputFilename}\nOriginal format: ${originalExtension}\nOutput format: ${outputFilename.split('.').pop()}\nConversion completed successfully.\n\nThis is a demo conversion file.`;
      }
      
      // Set appropriate headers for file download
      res.setHeader('Content-Disposition', `attachment; filename="${outputFilename}"`);
      res.setHeader('Content-Type', mimeType);
      res.setHeader('Content-Length', Buffer.byteLength(fileContent));
      res.setHeader('Cache-Control', 'no-cache');
      
      // Send the file content
      res.send(Buffer.from(fileContent, mimeType.includes('pdf') || mimeType.includes('openxml') ? 'binary' : 'utf8'));

    } catch (error) {
      console.error("Error downloading file:", error);
      res.status(500).json({
        success: false,
        error: "Failed to download file"
      });
    }
  });

  // API health check
  app.get("/api/health", (req, res) => {
    res.json({
      success: true,
      message: "PDF Conversion API is running",
      timestamp: new Date().toISOString(),
      version: "1.0.0"
    });
  });

  // API documentation endpoint
  app.get("/api/docs", (req, res) => {
    res.json({
      success: true,
      message: "PDF Conversion API Documentation",
      endpoints: {
        "GET /api/tools": "Get all available tools",
        "GET /api/tools/category/:category": "Get tools by category",
        "GET /api/tools/:toolType": "Get specific tool details",
        "POST /api/convert": "Start file conversion job",
        "GET /api/jobs/:jobId": "Get job status",
        "GET /api/jobs": "Get user's job history",
        "GET /api/download/:jobId": "Download converted file",
        "GET /api/health": "API health check",
        "GET /api/docs": "API documentation"
      },
      version: "1.0.0"
    });
  });

  const httpServer = createServer(app);
  return httpServer;
}