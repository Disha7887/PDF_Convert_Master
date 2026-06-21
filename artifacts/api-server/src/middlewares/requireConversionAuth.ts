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

/**
 * OPTIONAL authentication for the first-party conversion endpoints.
 *
 * These endpoints power the FREE web/mobile converter UI, which is used by
 * anonymous visitors, by the mobile app (which sends no credential at all), and
 * by signed-in users. Authentication must therefore NEVER be required here —
 * requiring it breaks every converter for logged-out and mobile users with
 * "Authorization header is required".
 *
 * Behaviour (never blocks, always calls next()):
 *   - No Authorization header        → proceed anonymously (req.user undefined).
 *   - Valid JWT (Bearer <jwt>)       → attach req.user, authSource = "web".
 *   - Valid API key (Bearer sk-…)    → attach req.user, authSource = "api",
 *                                       record last-used for the dashboard.
 *   - Any invalid / unparseable cred → proceed anonymously (do NOT 401).
 *
 * Handlers read `(req as ConversionAuthRequest).user?.id` defensively, so an
 * absent user simply records the conversion as anonymous. Use the strict
 * `requireConversionAuth` only for routes that must be gated.
 */
export const optionalConversionAuth = async (
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    next();
    return;
  }

  try {
    if (token.startsWith("sk-")) {
      const apiKeyRecord = await storage.getApiKeyByKey(token);
      if (apiKeyRecord) {
        const user = await storage.getUserById(apiKeyRecord.userId);
        if (user) {
          (req as any).user = { id: user.id, email: user.email };
          (req as any).authSource = "api";
          storage.updateApiKeyLastUsed(apiKeyRecord.id).catch(() => {});
        }
      }
    } else {
      const payload = verifyToken(token);
      if (payload) {
        const user = await storage.getUserById(payload.userId);
        if (user) {
          (req as any).user = { id: user.id, email: user.email };
          (req as any).authSource = "web";
        }
      }
    }
  } catch {
    // Never block a first-party conversion on an auth hiccup — fall through
    // and let the request proceed anonymously.
  }

  next();
};
