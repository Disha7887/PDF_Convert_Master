import { Router } from 'express';
import {
  createSubscription,
  cancelSubscription,
  getSubscriptionStatus,
  handleStripeWebhook,
} from '../controllers/paymentController';
import { authenticateToken } from '../middlewares/authMiddleware';

const router = Router();

// Subscription management endpoints (require JWT token)
router.post('/subscription', authenticateToken, createSubscription);
router.delete('/subscription', authenticateToken, cancelSubscription);
router.get('/subscription', authenticateToken, getSubscriptionStatus);

// Stripe webhook endpoint (no authentication required)
router.post('/webhook/stripe', handleStripeWebhook);

export default router;