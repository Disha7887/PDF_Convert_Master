import { Request, Response, NextFunction } from 'express';
import { storage } from '../storage';
import { validateApiKeyFormat } from '../utils/generateApiKey';

export interface ApiKeyRequest extends Request {
  apiKey?: {
    id: string;
    userId: string;
  };
  user?: {
    id: string;
    email: string;
    plan: string;
    dailyUsage: number;
    monthlyUsage: number;
    dailyLimit: number;
    monthlyLimit: number;
  };
}

export const authenticateApiKey = async (
  req: ApiKeyRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;
  const apiKey = authHeader && authHeader.split(' ')[1]; // Bearer API_KEY

  if (!apiKey) {
    res.status(401).json({ 
      error: 'API key required',
      message: 'Please provide an API key in the Authorization header: Bearer <your-api-key>'
    });
    return;
  }

  if (!validateApiKeyFormat(apiKey)) {
    res.status(401).json({ 
      error: 'Invalid API key format',
      message: 'API key must be in the format: api_<64-character-hex-string>'
    });
    return;
  }

  try {
    const apiKeyRecord = await storage.getApiKeyByKey(apiKey);
    
    if (!apiKeyRecord || !apiKeyRecord.isActive) {
      res.status(401).json({ 
        error: 'Invalid or inactive API key',
        message: 'Please check your API key or generate a new one from your dashboard'
      });
      return;
    }

    const user = await storage.getUserById(apiKeyRecord.userId);
    
    if (!user) {
      res.status(401).json({ 
        error: 'User not found',
        message: 'The user associated with this API key no longer exists'
      });
      return;
    }

    // Check usage limits
    if (user.dailyUsage >= user.dailyLimit) {
      res.status(429).json({ 
        error: 'Daily limit exceeded',
        message: `You have reached your daily limit of ${user.dailyLimit} conversions. Upgrade your plan or wait until tomorrow.`,
        limits: {
          dailyUsage: user.dailyUsage,
          dailyLimit: user.dailyLimit,
          monthlyUsage: user.monthlyUsage,
          monthlyLimit: user.monthlyLimit,
          plan: user.plan
        }
      });
      return;
    }

    if (user.monthlyUsage >= user.monthlyLimit) {
      res.status(429).json({ 
        error: 'Monthly limit exceeded',
        message: `You have reached your monthly limit of ${user.monthlyLimit} conversions. Upgrade your plan or wait until next month.`,
        limits: {
          dailyUsage: user.dailyUsage,
          dailyLimit: user.dailyLimit,
          monthlyUsage: user.monthlyUsage,
          monthlyLimit: user.monthlyLimit,
          plan: user.plan
        }
      });
      return;
    }

    // Attach API key and user info to request
    req.apiKey = {
      id: apiKeyRecord.id,
      userId: apiKeyRecord.userId,
    };

    req.user = {
      id: user.id,
      email: user.email,
      plan: user.plan,
      dailyUsage: user.dailyUsage,
      monthlyUsage: user.monthlyUsage,
      dailyLimit: user.dailyLimit,
      monthlyLimit: user.monthlyLimit,
    };

    // Update API key last used timestamp
    await storage.updateApiKeyUsage(apiKeyRecord.id);

    next();
  } catch (error) {
    console.error('API key authentication error:', error);
    res.status(500).json({ 
      error: 'Authentication failed',
      message: 'Internal server error during API key validation'
    });
  }
};