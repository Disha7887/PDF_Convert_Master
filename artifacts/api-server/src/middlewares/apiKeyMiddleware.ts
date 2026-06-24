import { Request, Response, NextFunction } from "express";
import { storage } from "../storage";

type ApiKeyRequest = Omit<Request, "user"> & {
  user?: {
    id: string;
    email: string;
  };
  apiKey?: {
    id: string;
    apiKey: string;
    userId: string;
  };
};

// API Key Authentication Middleware
export const authenticateApiKey = async (req: ApiKeyRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        error: "Authorization header is required"
      });
    }

    const apiKey = authHeader.split(" ")[1]; // Format: "Bearer API_KEY"
    
    if (!apiKey) {
      return res.status(401).json({
        success: false,
        error: "API key is required"
      });
    }

    // Validate API key format (should start with 'sk-' and be at least 32 characters)
    if (!apiKey.startsWith("sk-") || apiKey.length < 32) {
      return res.status(401).json({
        success: false,
        error: "Invalid API key format"
      });
    }

    // Find API key in database
    const apiKeyRecord = await storage.getApiKeyByKey(apiKey);
    
    if (!apiKeyRecord) {
      return res.status(401).json({
        success: false,
        error: "Invalid API key"
      });
    }

    // Get user associated with the API key
    const user = await storage.getUserById(apiKeyRecord.userId);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: "API key is associated with invalid user"
      });
    }

    // Attach user and API key information to request
    req.user = {
      id: user.id,
      email: user.email
    };
    
    req.apiKey = {
      id: apiKeyRecord.id,
      apiKey: apiKeyRecord.apiKey,
      userId: apiKeyRecord.userId
    };

    // Record last-used time for the dashboard. Non-blocking — a failure here
    // must never reject an otherwise-valid API request.
    storage.updateApiKeyLastUsed(apiKeyRecord.id).catch((e) => {
      console.error("Failed to update API key lastUsedAt:", e);
    });

    // Log only non-sensitive internal identifiers (no email, no raw key).
    console.log(`API request authenticated (key ${apiKeyRecord.id})`);

    next();

  } catch (error) {
    console.error("API key authentication error:", error);
    
    return res.status(500).json({
      success: false,
      error: "Authentication failed",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
};