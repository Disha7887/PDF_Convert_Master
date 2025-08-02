import { Router } from 'express';
import {
  register,
  login,
  generateApiKeyController,
  getUserApiKeys,
  deactivateApiKey,
  getProfile,
} from '../controllers/authController';
import { authenticateToken } from '../middlewares/authMiddleware';

const router = Router();

// Public routes
router.post('/register', register);
router.post('/login', login);

// Protected routes (require JWT token)
router.get('/profile', authenticateToken, getProfile);
router.post('/api-keys', authenticateToken, generateApiKeyController);
router.get('/api-keys', authenticateToken, getUserApiKeys);
router.delete('/api-keys/:keyId', authenticateToken, deactivateApiKey);

export default router;