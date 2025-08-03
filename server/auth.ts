import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import { storage } from "./storage";
import { registerUserSchema, loginUserSchema, type User } from "@shared/schema";

// JWT secret - in production this should be an environment variable
const JWT_SECRET = process.env.JWT_SECRET || "your-super-secret-jwt-key-change-this-in-production";
const JWT_EXPIRES_IN = "7d";

// Extend Express Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

export interface AuthTokenPayload {
  userId: string;
  email: string;
  iat?: number;
  exp?: number;
}

// Hash password using bcrypt
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
}

// Compare password with hash
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}

// Generate JWT token
export function generateToken(user: User): string {
  const payload: AuthTokenPayload = {
    userId: user.id,
    email: user.email,
  };
  
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

// Verify JWT token
export function verifyToken(token: string): AuthTokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as AuthTokenPayload;
  } catch (error) {
    console.error("JWT verification failed:", error);
    return null;
  }
}

// Middleware to authenticate requests
export async function authenticateUser(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

    if (!token) {
      return res.status(401).json({
        success: false,
        error: "No authentication token provided"
      });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return res.status(401).json({
        success: false,
        error: "Invalid or expired token"
      });
    }

    // Get user from database
    const user = await storage.getUserById(payload.userId);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: "User not found"
      });
    }

    // Add user to request
    req.user = user;
    next();
  } catch (error) {
    console.error("Authentication middleware error:", error);
    return res.status(500).json({
      success: false,
      error: "Authentication failed"
    });
  }
}

// Register endpoint
export async function register(req: Request, res: Response) {
  try {
    // Validate request body
    const validation = registerUserSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: "Validation failed",
        details: validation.error.errors
      });
    }

    const { email, password } = validation.data;

    // Check if user already exists
    const existingUser = await storage.getUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: "User already exists with this email"
      });
    }

    // Hash password and create user
    const passwordHash = await hashPassword(password);
    const newUser = await storage.createUser({
      email,
      passwordHash,
      plan: "free"
    });

    // Generate token
    const token = generateToken(newUser);

    // Return user data without password hash
    const { passwordHash: _, ...userWithoutPassword } = newUser;

    res.status(201).json({
      success: true,
      data: {
        user: userWithoutPassword,
        token
      },
      message: "User registered successfully"
    });

  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({
      success: false,
      error: "Registration failed"
    });
  }
}

// Sign in endpoint
export async function signin(req: Request, res: Response) {
  try {
    // Validate request body
    const validation = loginUserSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: "Validation failed",
        details: validation.error.errors
      });
    }

    const { email, password } = validation.data;

    // Find user by email
    const user = await storage.getUserByEmail(email);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: "Invalid email or password"
      });
    }

    // Verify password
    const isPasswordValid = await comparePassword(password, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: "Invalid email or password"
      });
    }

    // Generate token
    const token = generateToken(user);

    // Return user data without password hash
    const { passwordHash: _, ...userWithoutPassword } = user;

    res.status(200).json({
      success: true,
      data: {
        user: userWithoutPassword,
        token
      },
      message: "Sign in successful"
    });

  } catch (error) {
    console.error("Sign in error:", error);
    res.status(500).json({
      success: false,
      error: "Sign in failed"
    });
  }
}

// Get current user endpoint (protected)
export async function getCurrentUser(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: "Not authenticated"
      });
    }

    // Return user data without password hash
    const { passwordHash: _, ...userWithoutPassword } = req.user;

    res.status(200).json({
      success: true,
      data: {
        user: userWithoutPassword
      }
    });

  } catch (error) {
    console.error("Get current user error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get user data"
    });
  }
}