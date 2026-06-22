import bcrypt from "bcrypt";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import { storage } from "./storage";
import {
  registerUserSchema,
  loginUserSchema,
  updateProfileSchema,
  changePasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  type User,
} from "@workspace/db";
import { sendPasswordResetEmail } from "./lib/email";
import { logger } from "./lib/logger";

const RESET_CODE_TTL_MS = 15 * 60 * 1000; // 15 minutes

/** Hashes a reset code so the plaintext never lives in the database. */
function hashResetCode(code: string): string {
  return crypto.createHash("sha256").update(code).digest("hex");
}

// JWT secret. This MUST come from the environment. We fail closed in
// production: if JWT_SECRET is missing there, the process refuses to start
// rather than silently signing tokens with a publicly-known fallback (which
// would let anyone forge valid sessions). A dev-only fallback keeps local
// setups frictionless without weakening production.
function resolveJwtSecret(): string {
  const fromEnv = process.env.JWT_SECRET;
  if (fromEnv && fromEnv.length >= 16) {
    return fromEnv;
  }
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "JWT_SECRET is not set (or too short) in production. Refusing to start with an insecure signing key.",
    );
  }
  logger.warn(
    "JWT_SECRET is not set; using an insecure development-only fallback. Set JWT_SECRET before deploying.",
  );
  return "dev-only-insecure-jwt-secret-do-not-use-in-production";
}

const JWT_SECRET = resolveJwtSecret();
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
    return next();
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
        details: validation.error.issues
      });
    }

    const { email, password, name } = validation.data;

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
      name: name?.trim() || null,
      passwordHash,
      plan: "free"
    });

    // Generate token
    const token = generateToken(newUser);

    // Return user data without password hash
    const { passwordHash: _, ...userWithoutPassword } = newUser;

    return res.status(201).json({
      success: true,
      data: {
        user: userWithoutPassword,
        token
      },
      message: "User registered successfully"
    });

  } catch (error) {
    console.error("Registration error:", error);
    return res.status(500).json({
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
        details: validation.error.issues
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

    return res.status(200).json({
      success: true,
      data: {
        user: userWithoutPassword,
        token
      },
      message: "Sign in successful"
    });

  } catch (error) {
    console.error("Sign in error:", error);
    return res.status(500).json({
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

    return res.status(200).json({
      success: true,
      data: {
        user: userWithoutPassword
      }
    });

  } catch (error) {
    console.error("Get current user error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to get user data"
    });
  }
}

// Update profile (name / email) — protected
export async function updateProfile(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: "Not authenticated" });
    }

    const validation = updateProfileSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: "Validation failed",
        details: validation.error.issues,
      });
    }

    const { name, email } = validation.data;

    // If changing email, ensure it isn't already taken by someone else.
    if (email && email !== req.user.email) {
      const existing = await storage.getUserByEmail(email);
      if (existing && existing.id !== req.user.id) {
        return res.status(409).json({
          success: false,
          error: "That email is already in use by another account",
        });
      }
    }

    const updated = await storage.updateUserProfile(req.user.id, { name, email });
    if (!updated) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    // Email is embedded in the JWT, so re-issue a token after a profile change.
    const token = generateToken(updated);
    const { passwordHash: _, ...userWithoutPassword } = updated;

    return res.status(200).json({
      success: true,
      data: { user: userWithoutPassword, token },
      message: "Profile updated",
    });
  } catch (error) {
    console.error("Update profile error:", error);
    return res.status(500).json({ success: false, error: "Failed to update profile" });
  }
}

// Change password — protected (requires current password)
export async function changePassword(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: "Not authenticated" });
    }

    const validation = changePasswordSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: "Validation failed",
        details: validation.error.issues,
      });
    }

    const { currentPassword, newPassword } = validation.data;

    const isValid = await comparePassword(currentPassword, req.user.passwordHash);
    if (!isValid) {
      return res.status(401).json({
        success: false,
        error: "Current password is incorrect",
      });
    }

    const passwordHash = await hashPassword(newPassword);
    await storage.updateUserPassword(req.user.id, passwordHash);

    return res.status(200).json({ success: true, message: "Password changed" });
  } catch (error) {
    console.error("Change password error:", error);
    return res.status(500).json({ success: false, error: "Failed to change password" });
  }
}

// Forgot password — emails a one-time reset code. Always returns success so the
// endpoint never reveals whether an email is registered.
export async function forgotPassword(req: Request, res: Response) {
  const genericResponse = {
    success: true,
    message: "If an account exists for that email, a reset code has been sent.",
  };

  try {
    const validation = forgotPasswordSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: "Validation failed",
        details: validation.error.issues,
      });
    }

    const { email } = validation.data;
    const user = await storage.getUserByEmail(email);

    if (user) {
      const code = String(crypto.randomInt(0, 1_000_000)).padStart(6, "0");
      const expiresAt = new Date(Date.now() + RESET_CODE_TTL_MS);
      await storage.createPasswordResetCode(user.id, hashResetCode(code), expiresAt);

      try {
        await sendPasswordResetEmail(user.email, code);
      } catch (emailErr) {
        // Soft failure: don't leak account existence; surface in logs only.
        logger.error({ err: emailErr }, "Failed to send password reset email");
      }
    }

    return res.status(200).json(genericResponse);
  } catch (error) {
    console.error("Forgot password error:", error);
    // Still return the generic response shape on unexpected errors.
    return res.status(200).json(genericResponse);
  }
}

// Reset password using an emailed code.
export async function resetPassword(req: Request, res: Response) {
  try {
    const validation = resetPasswordSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: "Validation failed",
        details: validation.error.issues,
      });
    }

    const { email, code, newPassword } = validation.data;
    const invalid = {
      success: false,
      error: "Invalid or expired reset code",
    };

    const user = await storage.getUserByEmail(email);
    if (!user) {
      return res.status(400).json(invalid);
    }

    const active = await storage.getLatestActiveResetCode(user.id);
    if (!active) {
      return res.status(400).json(invalid);
    }

    const matches = crypto.timingSafeEqual(
      Buffer.from(active.codeHash),
      Buffer.from(hashResetCode(code)),
    );
    if (!matches) {
      // Throttle brute force: a 6-digit code only gets a handful of guesses
      // before it's burned, forcing the attacker to request a fresh code.
      const MAX_RESET_ATTEMPTS = 5;
      const attempts = await storage.incrementResetAttempts(active.id);
      if (attempts >= MAX_RESET_ATTEMPTS) {
        await storage.consumeResetCode(active.id);
      }
      return res.status(400).json(invalid);
    }

    const passwordHash = await hashPassword(newPassword);
    await storage.updateUserPassword(user.id, passwordHash);
    await storage.consumeResetCode(active.id);

    return res.status(200).json({
      success: true,
      message: "Password reset successful. You can now sign in.",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    return res.status(500).json({ success: false, error: "Failed to reset password" });
  }
}
