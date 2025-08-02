import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { storage } from '../storage';
import { generateJWT } from '../middlewares/authMiddleware';
import { generateApiKey } from '../utils/generateApiKey';
import { registerUserSchema, loginUserSchema, createApiKeySchema, PLAN_LIMITS } from '@shared/schema';
import { z } from 'zod';

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const validatedData = registerUserSchema.parse(req.body);
    
    // Check if user already exists
    const existingUser = await storage.getUserByEmail(validatedData.email);
    if (existingUser) {
      res.status(400).json({ 
        error: 'User already exists',
        message: 'An account with this email address already exists'
      });
      return;
    }

    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(validatedData.password, saltRounds);

    // Create user with free plan by default
    const user = await storage.createUser({
      email: validatedData.email,
      passwordHash,
      plan: 'free',
    });

    // Generate JWT token
    const token = generateJWT(user.id);

    // Create default API key
    const apiKey = generateApiKey();
    await storage.createApiKey({
      userId: user.id,
      apiKey,
      name: 'Default API Key',
      isActive: true,
    });

    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: user.id,
        email: user.email,
        plan: user.plan,
        limits: {
          daily: user.dailyLimit,
          monthly: user.monthlyLimit,
        },
      },
      token,
      apiKey,
    });
  } catch (error) {
    console.error('Registration error:', error);
    
    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: 'Validation failed',
        details: error.errors,
      });
      return;
    }

    res.status(500).json({ 
      error: 'Registration failed',
      message: 'Internal server error during user registration'
    });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const validatedData = loginUserSchema.parse(req.body);
    
    // Find user by email
    const user = await storage.getUserByEmail(validatedData.email);
    if (!user) {
      res.status(401).json({ 
        error: 'Invalid credentials',
        message: 'Email or password is incorrect'
      });
      return;
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(validatedData.password, user.passwordHash);
    if (!isValidPassword) {
      res.status(401).json({ 
        error: 'Invalid credentials',
        message: 'Email or password is incorrect'
      });
      return;
    }

    // Generate JWT token
    const token = generateJWT(user.id);

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        plan: user.plan,
        limits: {
          daily: user.dailyLimit,
          monthly: user.monthlyLimit,
        },
        usage: {
          daily: user.dailyUsage,
          monthly: user.monthlyUsage,
        },
      },
      token,
    });
  } catch (error) {
    console.error('Login error:', error);
    
    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: 'Validation failed',
        details: error.errors,
      });
      return;
    }

    res.status(500).json({ 
      error: 'Login failed',
      message: 'Internal server error during login'
    });
  }
};

export const generateApiKeyController = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    if (!user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const validatedData = createApiKeySchema.parse(req.body);
    
    // Generate new API key
    const apiKey = generateApiKey();
    
    const newApiKey = await storage.createApiKey({
      userId: user.id,
      apiKey,
      name: validatedData.name,
      isActive: true,
    });

    res.status(201).json({
      message: 'API key created successfully',
      apiKey: {
        id: newApiKey.id,
        name: newApiKey.name,
        key: newApiKey.apiKey,
        createdAt: newApiKey.createdAt,
        isActive: newApiKey.isActive,
      },
    });
  } catch (error) {
    console.error('API key generation error:', error);
    
    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: 'Validation failed',
        details: error.errors,
      });
      return;
    }

    res.status(500).json({ 
      error: 'API key generation failed',
      message: 'Internal server error during API key generation'
    });
  }
};

export const getUserApiKeys = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    if (!user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const apiKeys = await storage.getUserApiKeys(user.id);
    
    // Don't return the actual API key values for security
    const safeApiKeys = apiKeys.map(key => ({
      id: key.id,
      name: key.name,
      keyPreview: `${key.apiKey.substring(0, 12)}...${key.apiKey.substring(key.apiKey.length - 4)}`,
      isActive: key.isActive,
      lastUsed: key.lastUsed,
      usageCount: key.usageCount,
      createdAt: key.createdAt,
    }));

    res.json({
      apiKeys: safeApiKeys,
    });
  } catch (error) {
    console.error('Get API keys error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch API keys',
      message: 'Internal server error'
    });
  }
};

export const deactivateApiKey = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    const { keyId } = req.params;

    if (!user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    // Verify the API key belongs to the user
    const userApiKeys = await storage.getUserApiKeys(user.id);
    const keyExists = userApiKeys.some(key => key.id === keyId);
    
    if (!keyExists) {
      res.status(404).json({ 
        error: 'API key not found',
        message: 'The specified API key does not exist or does not belong to you'
      });
      return;
    }

    const updatedKey = await storage.deactivateApiKey(keyId);
    
    if (!updatedKey) {
      res.status(404).json({ 
        error: 'API key not found',
        message: 'Failed to deactivate API key'
      });
      return;
    }

    res.json({
      message: 'API key deactivated successfully',
      apiKey: {
        id: updatedKey.id,
        name: updatedKey.name,
        isActive: updatedKey.isActive,
      },
    });
  } catch (error) {
    console.error('Deactivate API key error:', error);
    res.status(500).json({ 
      error: 'Failed to deactivate API key',
      message: 'Internal server error'
    });
  }
};

export const getProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    if (!user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const fullUser = await storage.getUserById(user.id);
    if (!fullUser) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({
      user: {
        id: fullUser.id,
        email: fullUser.email,
        plan: fullUser.plan,
        limits: {
          daily: fullUser.dailyLimit,
          monthly: fullUser.monthlyLimit,
        },
        usage: {
          daily: fullUser.dailyUsage,
          monthly: fullUser.monthlyUsage,
        },
        subscription: {
          status: fullUser.subscriptionStatus,
          stripeCustomerId: fullUser.stripeCustomerId,
        },
        createdAt: fullUser.createdAt,
      },
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch profile',
      message: 'Internal server error'
    });
  }
};