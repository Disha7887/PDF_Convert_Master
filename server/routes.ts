import type { Express } from "express";
import { createServer, type Server } from "http";
import authRoutes from "./routes/authRoutes";
import conversionRoutes from "./routes/conversionRoutes";
import usageRoutes from "./routes/usageRoutes";
import toolRoutes from "./routes/toolRoutes";
import paymentRoutes from "./routes/paymentRoutes";

export async function registerRoutes(app: Express): Promise<Server> {
  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      message: 'PDF Conversion API is running'
    });
  });

  // Mount route handlers
  app.use('/api/auth', authRoutes);
  app.use('/api', conversionRoutes);
  app.use('/api', usageRoutes);
  app.use('/api', toolRoutes);
  app.use('/api/payment', paymentRoutes);

  // API documentation endpoint
  app.get('/api/docs', (req, res) => {
    res.json({
      title: 'PDF Conversion API Documentation',
      version: '1.0.0',
      description: 'Complete API for PDF conversion and image processing tools with authentication and usage tracking',
      endpoints: {
        authentication: {
          'POST /api/auth/register': 'Register a new user account',
          'POST /api/auth/login': 'Login and get JWT token',
          'GET /api/auth/profile': 'Get user profile (requires JWT)',
          'POST /api/auth/api-keys': 'Generate new API key (requires JWT)',
          'GET /api/auth/api-keys': 'List user API keys (requires JWT)',
          'DELETE /api/auth/api-keys/:keyId': 'Deactivate API key (requires JWT)',
        },
        tools: {
          'GET /api/tools': 'List all available conversion tools',
          'GET /api/tools/category/:category': 'Get tools by category',
          'GET /api/tools/:toolType': 'Get specific tool details',
        },
        conversion: {
          'POST /api/convert?tool=<tool_type>': 'Convert file (requires API key)',
          'GET /api/jobs/:jobId': 'Get conversion status (requires API key)',
          'GET /api/download/:jobId': 'Download converted file',
        },
        usage: {
          'GET /api/usage': 'Get usage statistics (requires API key or JWT)',
          'GET /api/conversions': 'Get conversion history (requires API key or JWT)',
          'GET /api/plan': 'Get plan details (requires API key or JWT)',
          'POST /api/usage/reset': 'Reset usage counters (requires JWT)',
        },
      },
      authentication: {
        jwt: 'Use "Authorization: Bearer <jwt_token>" for dashboard access',
        apiKey: 'Use "Authorization: Bearer <api_key>" for API access',
      },
      examples: {
        register: {
          method: 'POST',
          url: '/api/auth/register',
          body: {
            email: 'user@example.com',
            password: 'securepassword123'
          }
        },
        convert: {
          method: 'POST',
          url: '/api/convert?tool=pdf_to_word',
          headers: {
            'Authorization': 'Bearer api_<your_api_key>'
          },
          body: 'multipart/form-data with file field'
        }
      }
    });
  });

  // 404 handler for API routes
  app.use('/api/*', (req, res) => {
    res.status(404).json({
      error: 'API endpoint not found',
      message: `The endpoint ${req.method} ${req.path} does not exist`,
      documentation: '/api/docs'
    });
  });

  const httpServer = createServer(app);
  return httpServer;
}
