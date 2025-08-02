import { Router } from 'express';
import { storage } from '../storage';
import { ToolCategory } from '@shared/schema';

const router = Router();

// Get all available tools
router.get('/tools', async (req, res) => {
  try {
    const tools = await storage.getAllTools();
    
    res.json({
      tools: tools.map(tool => ({
        id: tool.id,
        name: tool.name,
        type: tool.type,
        category: tool.category,
        description: tool.description,
        inputFormats: tool.inputFormats,
        outputFormat: tool.outputFormat,
        maxFileSize: tool.maxFileSize,
        processingTimeEstimate: tool.processingTimeEstimate,
      })),
      total: tools.length,
    });
  } catch (error) {
    console.error('Get tools error:', error);
    res.status(500).json({
      error: 'Failed to fetch tools',
      message: 'Internal server error'
    });
  }
});

// Get tools by category
router.get('/tools/category/:category', async (req, res) => {
  try {
    const { category } = req.params;
    
    // Validate category
    if (!Object.values(ToolCategory).includes(category as ToolCategory)) {
      res.status(400).json({
        error: 'Invalid category',
        message: `Category "${category}" is not valid. Available categories: ${Object.values(ToolCategory).join(', ')}`
      });
      return;
    }

    const tools = await storage.getToolsByCategory(category as ToolCategory);
    
    res.json({
      category,
      tools: tools.map(tool => ({
        id: tool.id,
        name: tool.name,
        type: tool.type,
        category: tool.category,
        description: tool.description,
        inputFormats: tool.inputFormats,
        outputFormat: tool.outputFormat,
        maxFileSize: tool.maxFileSize,
        processingTimeEstimate: tool.processingTimeEstimate,
      })),
      total: tools.length,
    });
  } catch (error) {
    console.error('Get tools by category error:', error);
    res.status(500).json({
      error: 'Failed to fetch tools',
      message: 'Internal server error'
    });
  }
});

// Get specific tool details
router.get('/tools/:toolType', async (req, res) => {
  try {
    const { toolType } = req.params;
    
    const tool = await storage.getToolByType(toolType as any);
    
    if (!tool) {
      res.status(404).json({
        error: 'Tool not found',
        message: `Tool "${toolType}" does not exist`
      });
      return;
    }

    res.json({
      tool: {
        id: tool.id,
        name: tool.name,
        type: tool.type,
        category: tool.category,
        description: tool.description,
        inputFormats: tool.inputFormats,
        outputFormat: tool.outputFormat,
        maxFileSize: tool.maxFileSize,
        processingTimeEstimate: tool.processingTimeEstimate,
      }
    });
  } catch (error) {
    console.error('Get tool error:', error);
    res.status(500).json({
      error: 'Failed to fetch tool',
      message: 'Internal server error'
    });
  }
});

export default router;