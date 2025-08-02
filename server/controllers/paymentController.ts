import { Request, Response } from 'express';
import { storage } from '../storage';
import { AuthenticatedRequest } from '../middlewares/authMiddleware';
import { PLAN_LIMITS } from '@shared/schema';

// Note: Stripe integration would require STRIPE_SECRET_KEY environment variable
// For now, we'll create placeholder endpoints that can be enhanced with actual Stripe integration

export const createSubscription = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const { planType } = req.body;

    if (!planType || !['free', 'pro', 'enterprise'].includes(planType)) {
      res.status(400).json({
        error: 'Invalid plan type',
        message: 'Plan type must be one of: free, pro, enterprise'
      });
      return;
    }

    const planLimits = PLAN_LIMITS[planType as keyof typeof PLAN_LIMITS];
    
    if (!planLimits) {
      res.status(400).json({
        error: 'Invalid plan',
        message: 'Selected plan is not available'
      });
      return;
    }

    // In a real implementation, you would:
    // 1. Create Stripe checkout session
    // 2. Store payment intent in database
    // 3. Return checkout URL
    
    // For demonstration, we'll simulate successful upgrade for free plan only
    if (planType === 'free') {
      // Update user plan and limits
      const updatedUser = await storage.updateUser(user.id, {
        plan: planType,
        dailyLimit: planLimits.daily,
        monthlyLimit: planLimits.monthly,
        subscriptionStatus: 'active',
      });

      res.json({
        message: 'Plan updated successfully',
        plan: {
          type: planType,
          daily: planLimits.daily,
          monthly: planLimits.monthly,
          price: planLimits.price,
        },
        user: {
          id: updatedUser?.id,
          plan: updatedUser?.plan,
          subscriptionStatus: updatedUser?.subscriptionStatus,
        }
      });
      return;
    }

    // For paid plans, require Stripe integration
    res.status(501).json({
      error: 'Payment processing not configured',
      message: 'Stripe integration is required for paid plans. Please contact support.',
      supportedPlans: ['free'],
      requestedPlan: planType,
    });

  } catch (error) {
    console.error('Create subscription error:', error);
    res.status(500).json({
      error: 'Subscription creation failed',
      message: 'Internal server error during subscription creation'
    });
  }
};

export const cancelSubscription = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;

    // Get current user details
    const fullUser = await storage.getUserById(user.id);
    if (!fullUser) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // If user is already on free plan
    if (fullUser.plan === 'free') {
      res.status(400).json({
        error: 'No active subscription',
        message: 'User is already on the free plan'
      });
      return;
    }

    // In a real implementation, you would:
    // 1. Cancel Stripe subscription
    // 2. Update payment status in database
    // 3. Schedule plan downgrade for end of billing period

    // For demonstration, immediately downgrade to free plan
    const freeLimits = PLAN_LIMITS.free;
    const updatedUser = await storage.updateUser(user.id, {
      plan: 'free',
      dailyLimit: freeLimits.daily,
      monthlyLimit: freeLimits.monthly,
      subscriptionStatus: 'cancelled',
      stripeSubscriptionId: null,
    });

    res.json({
      message: 'Subscription cancelled successfully',
      plan: {
        type: 'free',
        daily: freeLimits.daily,
        monthly: freeLimits.monthly,
        price: freeLimits.price,
      },
      user: {
        id: updatedUser?.id,
        plan: updatedUser?.plan,
        subscriptionStatus: updatedUser?.subscriptionStatus,
      }
    });

  } catch (error) {
    console.error('Cancel subscription error:', error);
    res.status(500).json({
      error: 'Subscription cancellation failed',
      message: 'Internal server error during subscription cancellation'
    });
  }
};

export const getSubscriptionStatus = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;

    const fullUser = await storage.getUserById(user.id);
    if (!fullUser) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const currentPlan = PLAN_LIMITS[fullUser.plan as keyof typeof PLAN_LIMITS] || PLAN_LIMITS.free;

    res.json({
      subscription: {
        status: fullUser.subscriptionStatus,
        plan: fullUser.plan,
        limits: {
          daily: fullUser.dailyLimit,
          monthly: fullUser.monthlyLimit,
        },
        usage: {
          daily: fullUser.dailyUsage,
          monthly: fullUser.monthlyUsage,
        },
        billing: {
          stripeCustomerId: fullUser.stripeCustomerId,
          stripeSubscriptionId: fullUser.stripeSubscriptionId,
          price: currentPlan.price,
          priceFormatted: `$${(currentPlan.price / 100).toFixed(2)}`,
        },
      },
    });

  } catch (error) {
    console.error('Get subscription status error:', error);
    res.status(500).json({
      error: 'Failed to fetch subscription status',
      message: 'Internal server error'
    });
  }
};

// Webhook endpoint for Stripe (would be used in production)
export const handleStripeWebhook = async (req: Request, res: Response): Promise<void> => {
  try {
    // In a real implementation, you would:
    // 1. Verify webhook signature
    // 2. Handle different event types (checkout.session.completed, subscription.updated, etc.)
    // 3. Update user plans and limits accordingly
    // 4. Send confirmation emails

    res.json({ received: true });
  } catch (error) {
    console.error('Stripe webhook error:', error);
    res.status(400).json({ error: 'Webhook processing failed' });
  }
};