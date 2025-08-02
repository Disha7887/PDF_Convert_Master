import { Router } from 'express';
import {
  getUserUsage,
  getUserConversions,
  getPlanDetails,
  resetUsage,
} from '../controllers/usageController';
import { authenticateToken } from '../middlewares/authMiddleware';
import { authenticateApiKey } from '../middlewares/apiKeyMiddleware';

const router = Router();

// Usage endpoints that work with both JWT tokens and API keys
router.get('/usage', (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];
  
  // Check if it's an API key format or JWT token
  if (token && token.startsWith('api_')) {
    // Use API key authentication
    authenticateApiKey(req, res, next);
  } else {
    // Use JWT token authentication
    authenticateToken(req, res, next);
  }
}, getUserUsage);

router.get('/conversions', (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];
  
  if (token && token.startsWith('api_')) {
    authenticateApiKey(req, res, next);
  } else {
    authenticateToken(req, res, next);
  }
}, getUserConversions);

router.get('/plan', (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];
  
  if (token && token.startsWith('api_')) {
    authenticateApiKey(req, res, next);
  } else {
    authenticateToken(req, res, next);
  }
}, getPlanDetails);

// JWT-only endpoints
router.post('/usage/reset', authenticateToken, resetUsage);

export default router;