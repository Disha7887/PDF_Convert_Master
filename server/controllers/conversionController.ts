import { Request, Response } from 'express';
import { storage } from '../storage';
import { ApiKeyRequest } from '../middlewares/apiKeyMiddleware';
import { ToolType } from '@shared/schema';
import path from 'path';
import fs from 'fs/promises';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';

// Configure multer for file uploads
const uploadsDir = path.join(process.cwd(), 'uploads');

// Ensure uploads directory exists
fs.mkdir(uploadsDir, { recursive: true }).catch(console.error);

const storage_multer = multer.diskStorage({
  destination: async (req, file, cb) => {
    try {
      await fs.mkdir(uploadsDir, { recursive: true });
      cb(null, uploadsDir);
    } catch (error) {
      cb(error, uploadsDir);
    }
  },
  filename: (req, file, cb) => {
    const uniqueId = uuidv4();
    const originalName = file.originalname;
    const extension = path.extname(originalName);
    const baseName = path.basename(originalName, extension);
    cb(null, `${baseName}_${uniqueId}${extension}`);
  }
});

export const upload = multer({
  storage: storage_multer,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB max file size
  },
  fileFilter: (req, file, cb) => {
    // Allow all file types for now - validation will be done per tool
    cb(null, true);
  }
});

export const convertFile = async (req: ApiKeyRequest, res: Response): Promise<void> => {
  try {
    const { tool } = req.query;
    const user = req.user!;
    const apiKey = req.apiKey!;

    if (!tool || typeof tool !== 'string') {
      res.status(400).json({
        error: 'Tool parameter required',
        message: 'Please specify a tool type in the query parameter: ?tool=<tool_type>'
      });
      return;
    }

    // Validate tool type
    const toolConfig = await storage.getToolByType(tool as ToolType);
    if (!toolConfig) {
      res.status(400).json({
        error: 'Invalid tool type',
        message: `Tool "${tool}" is not supported. Check /api/tools for available tools.`
      });
      return;
    }

    // Check if file was uploaded
    const file = (req as any).file;
    if (!file) {
      res.status(400).json({
        error: 'File required',
        message: 'Please upload a file to convert'
      });
      return;
    }

    // Validate file type
    const fileExtension = path.extname(file.originalname).toLowerCase().substring(1);
    if (!toolConfig.inputFormats.includes(fileExtension)) {
      // Clean up uploaded file
      await fs.unlink(file.path).catch(console.error);
      
      res.status(400).json({
        error: 'Invalid file type',
        message: `File type "${fileExtension}" is not supported for ${toolConfig.name}. Supported types: ${toolConfig.inputFormats.join(', ')}`
      });
      return;
    }

    // Check file size limit
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > toolConfig.maxFileSize) {
      // Clean up uploaded file
      await fs.unlink(file.path).catch(console.error);
      
      res.status(400).json({
        error: 'File too large',
        message: `File size (${fileSizeMB.toFixed(2)}MB) exceeds the limit of ${toolConfig.maxFileSize}MB for ${toolConfig.name}`
      });
      return;
    }

    // Create conversion record
    const conversion = await storage.createConversion({
      userId: user.id,
      apiKeyId: apiKey.id,
      toolType: tool,
      status: 'pending',
      inputFilename: file.originalname,
      inputFileSize: file.size,
      ipAddress: req.ip || req.connection.remoteAddress || 'unknown',
      userAgent: req.get('User-Agent') || 'unknown',
    });

    // Update user usage
    await storage.updateUserUsage(user.id, user.dailyUsage + 1, user.monthlyUsage + 1);

    // Start processing (asynchronous)
    processConversion(conversion.id, file.path, toolConfig, tool as ToolType)
      .catch(async (error) => {
        console.error('Conversion processing error:', error);
        await storage.updateConversionStatus(
          conversion.id,
          'failed',
          undefined,
          undefined,
          error.message,
          undefined
        );
      });

    res.status(202).json({
      message: 'Conversion started',
      jobId: conversion.id,
      estimatedTime: toolConfig.processingTimeEstimate,
      status: 'pending',
      toolName: toolConfig.name,
      inputFile: file.originalname,
    });

  } catch (error) {
    console.error('Conversion error:', error);
    
    // Clean up uploaded file if it exists
    const file = (req as any).file;
    if (file && file.path) {
      await fs.unlink(file.path).catch(console.error);
    }

    res.status(500).json({
      error: 'Conversion failed',
      message: 'Internal server error during file conversion'
    });
  }
};

async function processConversion(
  conversionId: string,
  inputFilePath: string,
  toolConfig: any,
  toolType: ToolType
): Promise<void> {
  const startTime = Date.now();
  
  try {
    // Update status to processing
    await storage.updateConversionStatus(conversionId, 'processing');

    // Generate output filename
    const inputBasename = path.basename(inputFilePath, path.extname(inputFilePath));
    const outputExtension = toolConfig.outputFormat === 'original' 
      ? path.extname(inputFilePath) 
      : `.${toolConfig.outputFormat}`;
    const outputFilename = `${inputBasename}_converted_${Date.now()}${outputExtension}`;
    const outputPath = path.join(uploadsDir, outputFilename);

    // Simulate processing time based on tool configuration
    const processingTime = Math.max(1000, toolConfig.processingTimeEstimate * 1000);
    await new Promise(resolve => setTimeout(resolve, processingTime));

    // For now, we'll create a simple placeholder file
    // In a real implementation, you would use libraries like:
    // - pdf-lib for PDF operations
    // - sharp for image processing
    // - mammoth for Word documents
    // - xlsx for Excel files
    
    const outputContent = await generateConvertedFile(inputFilePath, toolType, toolConfig);
    await fs.writeFile(outputPath, outputContent);

    // Get output file size
    const outputStats = await fs.stat(outputPath);
    const outputFileSize = outputStats.size;

    // Generate download URL
    const downloadUrl = `/api/download/${conversionId}`;

    // Calculate actual processing time
    const actualProcessingTime = Date.now() - startTime;

    // Update conversion status
    await storage.updateConversionStatus(
      conversionId,
      'completed',
      outputFilename,
      downloadUrl,
      undefined,
      actualProcessingTime
    );

    // Clean up input file
    await fs.unlink(inputFilePath).catch(console.error);

  } catch (error) {
    console.error('Processing error:', error);
    
    // Clean up files
    await fs.unlink(inputFilePath).catch(console.error);
    
    const processingTime = Date.now() - startTime;
    await storage.updateConversionStatus(
      conversionId,
      'failed',
      undefined,
      undefined,
      error instanceof Error ? error.message : 'Unknown processing error',
      processingTime
    );
  }
}

async function generateConvertedFile(
  inputPath: string,
  toolType: ToolType,
  toolConfig: any
): Promise<Buffer> {
  // For demonstration, we'll create simple text-based output
  // In production, this would use real conversion libraries
  
  const inputStats = await fs.stat(inputPath);
  const timestamp = new Date().toISOString();
  
  let content = `File converted using ${toolConfig.name}\n`;
  content += `Original file: ${path.basename(inputPath)}\n`;
  content += `File size: ${inputStats.size} bytes\n`;
  content += `Converted at: ${timestamp}\n`;
  content += `Tool type: ${toolType}\n`;
  content += `\n--- Conversion Details ---\n`;
  content += `This is a demonstration conversion.\n`;
  content += `In production, this would contain the actual converted content.\n`;
  
  // Add tool-specific processing simulation
  switch (toolType) {
    case ToolType.PDF_TO_WORD:
      content += `\n[PDF to Word conversion completed]\n`;
      content += `Extracted text, formatting, and images would appear here.\n`;
      break;
    case ToolType.WORD_TO_PDF:
      content += `\n[Word to PDF conversion completed]\n`;
      content += `Document layout preserved with fonts and formatting.\n`;
      break;
    case ToolType.COMPRESS_IMAGE:
      content += `\n[Image compression completed]\n`;
      content += `File size reduced while maintaining visual quality.\n`;
      break;
    case ToolType.MERGE_PDFS:
      content += `\n[PDF merge completed]\n`;
      content += `Multiple PDFs combined into single document.\n`;
      break;
    default:
      content += `\n[${toolType} conversion completed]\n`;
  }
  
  return Buffer.from(content);
}

export const getConversionStatus = async (req: ApiKeyRequest, res: Response): Promise<void> => {
  try {
    const { jobId } = req.params;
    const user = req.user!;

    const conversion = await storage.getConversion(jobId);
    
    if (!conversion) {
      res.status(404).json({
        error: 'Conversion not found',
        message: 'The specified conversion job does not exist'
      });
      return;
    }

    // Check if conversion belongs to the user
    if (conversion.userId !== user.id) {
      res.status(403).json({
        error: 'Access denied',
        message: 'You do not have permission to access this conversion'
      });
      return;
    }

    res.json({
      jobId: conversion.id,
      status: conversion.status,
      toolType: conversion.toolType,
      inputFilename: conversion.inputFilename,
      outputFilename: conversion.outputFilename,
      downloadUrl: conversion.downloadUrl,
      processingTime: conversion.processingTime,
      errorMessage: conversion.errorMessage,
      createdAt: conversion.createdAt,
      updatedAt: conversion.updatedAt,
    });

  } catch (error) {
    console.error('Get conversion status error:', error);
    res.status(500).json({
      error: 'Failed to fetch conversion status',
      message: 'Internal server error'
    });
  }
};

export const downloadFile = async (req: Request, res: Response): Promise<void> => {
  try {
    const { jobId } = req.params;

    const conversion = await storage.getConversion(jobId);
    
    if (!conversion) {
      res.status(404).json({
        error: 'Conversion not found',
        message: 'The specified conversion job does not exist'
      });
      return;
    }

    if (conversion.status !== 'completed') {
      res.status(400).json({
        error: 'Conversion not completed',
        message: `Conversion status is "${conversion.status}". File is only available when status is "completed".`
      });
      return;
    }

    if (!conversion.outputFilename) {
      res.status(404).json({
        error: 'Output file not found',
        message: 'No output file available for this conversion'
      });
      return;
    }

    const filePath = path.join(uploadsDir, conversion.outputFilename);
    
    try {
      await fs.access(filePath);
    } catch {
      res.status(404).json({
        error: 'File not found',
        message: 'The converted file is no longer available on the server'
      });
      return;
    }

    // Set appropriate headers
    res.setHeader('Content-Disposition', `attachment; filename="${conversion.outputFilename}"`);
    res.setHeader('Content-Type', 'application/octet-stream');

    // Stream the file
    const fileStream = require('fs').createReadStream(filePath);
    fileStream.pipe(res);

  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({
      error: 'Download failed',
      message: 'Internal server error during file download'
    });
  }
};