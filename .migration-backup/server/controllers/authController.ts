import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import { storage } from "../storage";
import { registerUserSchema, loginUserSchema } from "@shared/schema";
import { generateApiKey } from "../utils/generateApiKey";

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
  };
}

// Register a new user
export const register = async (req: Request, res: Response) => {
  try {
    const validationResult = registerUserSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        error: "Invalid input data",
        details: validationResult.error.errors
      });
    }

    const { email, password } = validationResult.data;

    // Check if user already exists
    const existingUser = await storage.getUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: "User with this email already exists"
      });
    }

    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create user
    const user = await storage.createUser({
      email,
      passwordHash,
      plan: "free"
    });

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: {
        id: user.id,
        email: user.email,
        plan: user.plan,
        createdAt: user.createdAt
      }
    });

  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to register user",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
};

// Login user
export const login = async (req: Request, res: Response) => {
  try {
    const validationResult = loginUserSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        error: "Invalid input data",
        details: validationResult.error.errors
      });
    }

    const { email, password } = validationResult.data;

    // Find user by email
    const user = await storage.getUserByEmail(email);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: "Invalid email or password"
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: "Invalid email or password"
      });
    }

    // Generate JWT token
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error("JWT_SECRET environment variable is not set");
    }

    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email 
      },
      jwtSecret,
      { 
        expiresIn: "7d" // Token expires in 7 days
      }
    );

    res.json({
      success: true,
      message: "Login successful",
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          plan: user.plan,
          createdAt: user.createdAt
        }
      }
    });

  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to login",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
};

// Generate API key (protected route)
export const generateApiKeyHandler = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: "Authentication required"
      });
    }

    const userId = req.user.id;

    // Check existing API keys count (limit to 3 per user)
    const existingKeys = await storage.getUserApiKeys(userId);
    if (existingKeys.length >= 3) {
      return res.status(400).json({
        success: false,
        error: "Maximum API keys limit reached (3 keys per user)"
      });
    }

    // Generate new API key
    const apiKey = generateApiKey();
    
    // Store API key in database
    const newApiKey = await storage.createApiKey({
      userId,
      apiKey
    });

    res.status(201).json({
      success: true,
      message: "API key generated successfully",
      data: {
        id: newApiKey.id,
        apiKey: newApiKey.apiKey,
        createdAt: newApiKey.createdAt
      }
    });

  } catch (error) {
    console.error("API key generation error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to generate API key",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
};

// Get usage statistics (protected route)
export const getUsage = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: "Authentication required"
      });
    }

    const userId = req.user.id;

    // Get user's conversion jobs
    const jobs = await storage.getUserConversionJobs(userId);
    
    // Calculate statistics
    const totalJobs = jobs.length;
    const completedJobs = jobs.filter((job: any) => job.status === "completed").length;
    const failedJobs = jobs.filter((job: any) => job.status === "failed").length;
    const processingJobs = jobs.filter((job: any) => job.status === "processing").length;
    const pendingJobs = jobs.filter((job: any) => job.status === "pending").length;

    // Get API keys count
    const apiKeys = await storage.getUserApiKeys(userId);

    res.json({
      success: true,
      data: {
        user: {
          id: req.user.id,
          email: req.user.email
        },
        usage: {
          totalJobs,
          completedJobs,
          failedJobs,
          processingJobs,
          pendingJobs
        },
        apiKeys: {
          count: apiKeys.length,
          limit: 3
        }
      }
    });

  } catch (error) {
    console.error("Usage stats error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch usage statistics",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
};