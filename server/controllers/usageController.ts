import { Request, Response } from 'express';
import { storage } from '../storage';
import { AuthenticatedRequest } from '../middlewares/authMiddleware';
import { ApiKeyRequest } from '../middlewares/apiKeyMiddleware';
import { PLAN_LIMITS } from '@shared/schema';

export const getUserUsage = async (req: AuthenticatedRequest | ApiKeyRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;

    const usageStats = await storage.getUserUsageStats(user.id);
    
    const remainingDaily = Math.max(0, usageStats.dailyLimit - usageStats.dailyUsage);
    const remainingMonthly = Math.max(0, usageStats.monthlyLimit - usageStats.monthlyUsage);

    res.json({
      usage: {
        daily: usageStats.dailyUsage,
        monthly: usageStats.monthlyUsage,
      },
      limits: {
        daily: usageStats.dailyLimit,
        monthly: usageStats.monthlyLimit,
      },
      remaining: {
        daily: remainingDaily,
        monthly: remainingMonthly,
      },
      plan: usageStats.plan,
      planDetails: PLAN_LIMITS[usageStats.plan as keyof typeof PLAN_LIMITS] || PLAN_LIMITS.free,
    });

  } catch (error) {
    console.error('Get usage error:', error);
    res.status(500).json({
      error: 'Failed to fetch usage statistics',
      message: 'Internal server error'
    });
  }
};

export const getUserConversions = async (req: AuthenticatedRequest | ApiKeyRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const limit = parseInt(req.query.limit as string) || 50;
    const maxLimit = 100;
    const actualLimit = Math.min(limit, maxLimit);

    const conversions = await storage.getUserConversions(user.id, actualLimit);

    // Get tool configurations for additional details
    const tools = await storage.getAllTools();
    const toolMap = new Map(tools.map(tool => [tool.type, tool]));

    const enrichedConversions = conversions.map(conversion => {
      const toolConfig = toolMap.get(conversion.toolType as any);
      return {
        id: conversion.id,
        toolType: conversion.toolType,
        toolName: toolConfig?.name || conversion.toolType,
        status: conversion.status,
        inputFilename: conversion.inputFilename,
        outputFilename: conversion.outputFilename,
        downloadUrl: conversion.downloadUrl,
        inputFileSize: conversion.inputFileSize,
        outputFileSize: conversion.outputFileSize,
        processingTime: conversion.processingTime,
        errorMessage: conversion.errorMessage,
        createdAt: conversion.createdAt,
        updatedAt: conversion.updatedAt,
      };
    });

    res.json({
      conversions: enrichedConversions,
      total: conversions.length,
      limit: actualLimit,
    });

  } catch (error) {
    console.error('Get conversions error:', error);
    res.status(500).json({
      error: 'Failed to fetch conversions',
      message: 'Internal server error'
    });
  }
};

export const getPlanDetails = async (req: AuthenticatedRequest | ApiKeyRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    
    const fullUser = await storage.getUserById(user.id);
    if (!fullUser) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const currentPlanLimits = PLAN_LIMITS[fullUser.plan as keyof typeof PLAN_LIMITS] || PLAN_LIMITS.free;
    
    // Get all available plans
    const allPlans = Object.entries(PLAN_LIMITS).map(([planName, limits]) => ({
      name: planName,
      daily: limits.daily,
      monthly: limits.monthly,
      price: limits.price,
      priceFormatted: `$${(limits.price / 100).toFixed(2)}`,
      current: planName === fullUser.plan,
    }));

    res.json({
      currentPlan: {
        name: fullUser.plan,
        ...currentPlanLimits,
        priceFormatted: `$${(currentPlanLimits.price / 100).toFixed(2)}`,
      },
      usage: {
        daily: fullUser.dailyUsage,
        monthly: fullUser.monthlyUsage,
      },
      limits: {
        daily: fullUser.dailyLimit,
        monthly: fullUser.monthlyLimit,
      },
      subscription: {
        status: fullUser.subscriptionStatus,
        stripeCustomerId: fullUser.stripeCustomerId,
        stripeSubscriptionId: fullUser.stripeSubscriptionId,
      },
      availablePlans: allPlans,
    });

  } catch (error) {
    console.error('Get plan details error:', error);
    res.status(500).json({
      error: 'Failed to fetch plan details',
      message: 'Internal server error'
    });
  }
};

export const resetUsage = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const { type } = req.body; // 'daily', 'monthly', or 'both'

    if (!['daily', 'monthly', 'both'].includes(type)) {
      res.status(400).json({
        error: 'Invalid reset type',
        message: 'Reset type must be "daily", "monthly", or "both"'
      });
      return;
    }

    const updatedUser = await storage.resetUserUsage(user.id, type);
    
    if (!updatedUser) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({
      message: `Usage ${type} reset successfully`,
      usage: {
        daily: updatedUser.dailyUsage,
        monthly: updatedUser.monthlyUsage,
      },
      limits: {
        daily: updatedUser.dailyLimit,
        monthly: updatedUser.monthlyLimit,
      },
    });

  } catch (error) {
    console.error('Reset usage error:', error);
    res.status(500).json({
      error: 'Failed to reset usage',
      message: 'Internal server error'
    });
  }
};