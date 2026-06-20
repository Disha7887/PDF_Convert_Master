import { Request, Response, NextFunction } from "express";
import { storage } from "../storage";
import { verifyToken } from "../auth";

export interface ConversionAuthRequest {
  user?: {
    id: string;
    email: string;
  };
  authSource?: "web" | "api";
}

/**
 * Required authentication middleware for conversion endpoints.
 *
 * Accepts either:
 *   - A valid JWT  (Authorization: Bearer <jwt>)  → authSource = "web"
 *   - A valid API key (Authorization: Bearer sk-…) → authSource = "api"
 *
 * Returns 401 when no valid credential is supplied.
 */
export const requireConversionAuth = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    res.status(401).json({
      success: false,
      error: "Authorization header is required",
    });
    return;
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    res.status(401).json({
      success: false,
      error: "Bearer token is required",
    });
    return;
  }

  // API key path: sk-… prefix
  if (token.startsWith("sk-")) {
    try {
      if (token.length < 32) {
        res.status(401).json({ success: false, error: "Invalid API key format" });
        return;
      }

      const apiKeyRecord = await storage.getApiKeyByKey(token);
      if (!apiKeyRecord) {
        res.status(401).json({ success: false, error: "Invalid API key" });
        return;
      }

      const user = await storage.getUserById(apiKeyRecord.userId);
      if (!user) {
        res.status(401).json({
          success: false,
          error: "API key is associated with an invalid user",
        });
        return;
      }

      (req as any).user = { id: user.id, email: user.email };
      (req as any).authSource = "api";

      // Non-blocking last-used update.
      storage.updateApiKeyLastUsed(apiKeyRecord.id).catch(() => {});

      next();
    } catch (err) {
      res.status(500).json({
        success: false,
        error: "Authentication failed",
        details: err instanceof Error ? err.message : "Unknown error",
      });
    }
    return;
  }

  // JWT path
  try {
    const payload = verifyToken(token);
    if (!payload) {
      res.status(401).json({ success: false, error: "Invalid token" });
      return;
    }

    const user = await storage.getUserById(payload.userId);
    if (!user) {
      res.status(401).json({ success: false, error: "Token user not found" });
      return;
    }

    (req as any).user = { id: user.id, email: user.email };
    (req as any).authSource = "web";

    next();
  } catch (err) {
    res.status(401).json({
      success: false,
      error: "Invalid or expired token",
    });
  }
};
