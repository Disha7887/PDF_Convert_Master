import { Router } from 'express';
import {
  convertFile,
  getConversionStatus,
  downloadFile,
  upload,
} from '../controllers/conversionController';
import { authenticateApiKey } from '../middlewares/apiKeyMiddleware';

const router = Router();

// File conversion endpoint - requires API key authentication
router.post('/convert', authenticateApiKey, upload.single('file'), convertFile);

// Get conversion status - requires API key authentication
router.get('/jobs/:jobId', authenticateApiKey, getConversionStatus);

// Download converted file - public endpoint (but requires valid job ID)
router.get('/download/:jobId', downloadFile);

export default router;