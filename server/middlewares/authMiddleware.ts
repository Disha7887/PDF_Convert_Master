import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
  };
}

interface JWTPayload {
  userId: string;
  email: string;
  iat: number;
  exp: number;
}

// JWT Authentication Middleware
export const authenticateJWT = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        error: "Authorization header is required"
      });
    }

    const token = authHeader.split(" ")[1]; // Format: "Bearer TOKEN"
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: "JWT token is required"
      });
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error("JWT_SECRET environment variable is not set");
      return res.status(500).json({
        success: false,
        error: "Server configuration error"
      });
    }

    // Verify and decode the JWT token
    const decoded = jwt.verify(token, jwtSecret) as JWTPayload;
    
    // Attach user information to request
    req.user = {
      id: decoded.userId,
      email: decoded.email
    };

    next();

  } catch (error) {
    console.error("JWT authentication error:", error);
    
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({
        success: false,
        error: "Token has expired"
      });
    }
    
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({
        success: false,
        error: "Invalid token"
      });
    }

    return res.status(500).json({
      success: false,
      error: "Authentication failed",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
};