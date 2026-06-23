import bcrypt from "bcrypt";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import { Request, Response, NextFunction } from "express";
import { storage } from "./storage";
import {
  registerUserSchema,
  loginUserSchema,
  updateProfileSchema,
  changePasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  verifySignupOtpSchema,
  type User,
} from "@workspace/db";
import { sendPasswordResetEmail, sendSignupOtpEmail } from "./lib/email";
import { logger } from "./lib/logger";
import { ensureWelcomeNotification } from "./notify";

const RESET_CODE_TTL_MS = 15 * 60 * 1000; // 15 minutes
const SIGNUP_OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes
const MAX_SIGNUP_ATTEMPTS = 5;

/** Hashes a reset code so the plaintext never lives in the database. */
function hashResetCode(code: string): string {
  return crypto.createHash("sha256").update(code).digest("hex");
}

/** Generates a zero-padded 6-digit numeric one-time code. */
function generateOtp(): string {
  return String(crypto.randomInt(0, 1_000_000)).padStart(6, "0");
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

// Register endpoint — step 1 of signup. We DON'T create the account here.
// Instead we stash the pending registration (with the password already hashed)
// and email a 6-digit verification code. The account is only created once the
// user proves they own the email by submitting that code to /verify-signup.
// Calling this again for the same email simply re-issues a fresh code.
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

    // Hash password now so the plaintext never touches the pending store, then
    // stash the pending registration + emailed code.
    const passwordHash = await hashPassword(password);
    const code = generateOtp();
    const expiresAt = new Date(Date.now() + SIGNUP_OTP_TTL_MS);
    await storage.upsertSignupVerification(
      email,
      name?.trim() || null,
      passwordHash,
      hashResetCode(code),
      expiresAt,
    );

    try {
      await sendSignupOtpEmail(email, code);
    } catch (emailErr) {
      // If we can't deliver the code the user can't proceed, so surface a real
      // error here (unlike forgot-password, this endpoint doesn't need to hide
      // account existence — the address is the one the visitor just typed).
      logger.error({ err: emailErr }, "Failed to send signup verification email");
      return res.status(502).json({
        success: false,
        error: "We couldn't send your verification email. Please try again in a moment.",
      });
    }

    return res.status(200).json({
      success: true,
      data: { email, pendingVerification: true },
      message: "We sent a verification code to your email.",
    });

  } catch (error) {
    console.error("Registration error:", error);
    return res.status(500).json({
      success: false,
      error: "Registration failed"
    });
  }
}

// Verify signup OTP — step 2 of signup. Validates the emailed code, then
// actually creates the account and returns an auth token (auto-login), mirroring
// the old one-step register response shape.
export async function verifySignupOtp(req: Request, res: Response) {
  try {
    const validation = verifySignupOtpSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: "Validation failed",
        details: validation.error.issues,
      });
    }

    const { email, code } = validation.data;
    const invalid = { success: false, error: "Invalid or expired verification code" };

    const pending = await storage.getSignupVerification(email);
    if (!pending || pending.expiresAt.getTime() < Date.now()) {
      return res.status(400).json(invalid);
    }

    const matches = crypto.timingSafeEqual(
      Buffer.from(pending.codeHash),
      Buffer.from(hashResetCode(code)),
    );
    if (!matches) {
      // Throttle brute force: burn the pending code after a handful of misses so
      // a 6-digit code can't be guessed within its TTL.
      const attempts = await storage.incrementSignupAttempts(pending.id);
      if (attempts >= MAX_SIGNUP_ATTEMPTS) {
        await storage.deleteSignupVerification(email);
      }
      return res.status(400).json(invalid);
    }

    // Guard against a race where the email got registered between request and
    // verify (e.g. two tabs).
    const existingUser = await storage.getUserByEmail(email);
    if (existingUser) {
      await storage.deleteSignupVerification(email);
      return res.status(409).json({
        success: false,
        error: "User already exists with this email",
      });
    }

    let newUser;
    try {
      newUser = await storage.createUser({
        email: pending.email,
        name: pending.name,
        passwordHash: pending.passwordHash,
        plan: "free",
      });
    } catch (err) {
      // Two near-simultaneous verifies can both pass the getUserByEmail check
      // above and then race on the unique email constraint. Turn the loser's DB
      // error into a clean 409 instead of a 500.
      await storage.deleteSignupVerification(email);
      return res.status(409).json({
        success: false,
        error: "User already exists with this email",
      });
    }
    await storage.deleteSignupVerification(email);

    await ensureWelcomeNotification(newUser.id);

    const token = generateToken(newUser);
    const { passwordHash: _, ...userWithoutPassword } = newUser;

    return res.status(201).json({
      success: true,
      data: { user: userWithoutPassword, token },
      message: "Email verified. Account created.",
    });
  } catch (error) {
    console.error("Verify signup OTP error:", error);
    return res.status(500).json({ success: false, error: "Verification failed" });
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

// ============== GOOGLE OAUTH ==============

function getGoogleClientId(): string | null {
  const id = process.env.GOOGLE_CLIENT_ID;
  return id && id.trim() ? id.trim() : null;
}

function getGoogleClientSecret(): string | null {
  const secret = process.env.GOOGLE_CLIENT_SECRET;
  return secret && secret.trim() ? secret.trim() : null;
}

// Public config endpoint — the web client needs the OAuth client ID to start the
// Google sign-in popup. The client ID is NOT a secret (it's exposed to the
// browser by design); the client secret never leaves the server.
export function googleConfig(_req: Request, res: Response) {
  const clientId = getGoogleClientId();
  return res.status(200).json({
    success: true,
    data: { clientId, enabled: !!clientId },
  });
}

// Google sign-in. The browser runs the GIS popup "code" flow and posts us the
// short-lived authorization code. We exchange it for tokens (redirect_uri
// "postmessage" is the magic value for popup code flow), verify the returned ID
// token, then find-or-create the user and issue our own JWT — exactly the same
// session token email/password login returns.
export async function googleAuth(req: Request, res: Response) {
  try {
    const clientId = getGoogleClientId();
    const clientSecret = getGoogleClientSecret();
    if (!clientId || !clientSecret) {
      return res.status(503).json({
        success: false,
        error: "Google sign-in isn't configured yet.",
      });
    }

    const code = typeof req.body?.code === "string" ? req.body.code : null;
    if (!code) {
      return res
        .status(400)
        .json({ success: false, error: "Missing Google authorization code." });
    }

    const oauthClient = new OAuth2Client(clientId, clientSecret, "postmessage");

    let idToken: string | undefined;
    try {
      const { tokens } = await oauthClient.getToken(code);
      idToken = tokens.id_token ?? undefined;
    } catch (err) {
      logger.warn({ err }, "Google token exchange failed");
      return res.status(401).json({
        success: false,
        error: "Could not verify your Google sign-in. Please try again.",
      });
    }

    if (!idToken) {
      return res.status(401).json({
        success: false,
        error: "Google did not return an identity token.",
      });
    }

    let payload;
    try {
      const ticket = await oauthClient.verifyIdToken({ idToken, audience: clientId });
      payload = ticket.getPayload();
    } catch (err) {
      logger.warn({ err }, "Google ID token verification failed");
      return res.status(401).json({
        success: false,
        error: "Could not verify your Google sign-in. Please try again.",
      });
    }

    const email = payload?.email?.toLowerCase().trim();
    if (!email || payload?.email_verified !== true) {
      return res.status(401).json({
        success: false,
        error: "Your Google account doesn't have a verified email.",
      });
    }

    const name = payload?.name?.trim() || payload?.given_name?.trim() || null;
    const picture = payload?.picture || null;

    let user = await storage.getUserByEmail(email);
    let isNewUser = false;

    if (!user) {
      // Google accounts have no usable password. Store a random bcrypt hash so
      // the NOT NULL constraint holds and email/password login can never match
      // (the random plaintext is never known to anyone). Such users sign in via
      // Google or reset their password to set one.
      const randomPassword = crypto.randomBytes(32).toString("hex");
      const passwordHash = await hashPassword(randomPassword);
      user = await storage.createUser({ email, name, passwordHash, plan: "free" });
      isNewUser = true;

      // Best-effort: seed the avatar from the Google profile picture.
      if (picture) {
        try {
          const withPic = await storage.updateUserProfilePicture(user.id, picture);
          if (withPic) user = withPic;
        } catch (err) {
          logger.warn({ err }, "Failed to set Google profile picture");
        }
      }
    }

    if (isNewUser) {
      await ensureWelcomeNotification(user.id);
    }

    const token = generateToken(user);
    const { passwordHash: _omit, ...userWithoutPassword } = user;

    return res.status(200).json({
      success: true,
      data: { user: userWithoutPassword, token, isNewUser },
      message: "Google sign-in successful",
    });
  } catch (error) {
    console.error("Google auth error:", error);
    return res.status(500).json({ success: false, error: "Google sign-in failed" });
  }
}
