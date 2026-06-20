import { Router, Request, Response } from "express";
import { register, login, generateApiKeyHandler, getUsage } from "../controllers/authController";
import { authenticateJWT } from "../middlewares/authMiddleware";
import { storage } from "../storage";

const router = Router();

// Public routes
router.post("/register", register);
router.post("/login", login);

// Protected routes (require JWT token)
router.post("/generate-api-key", authenticateJWT, generateApiKeyHandler);
router.get("/usage", authenticateJWT, getUsage);

// GET /auth/user — verify JWT and return current user profile
router.get("/user", authenticateJWT, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await storage.getUserById(req.user!.id);
    if (!user) {
      res.status(404).json({ success: false, error: "User not found" });
      return;
    }
    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          plan: user.plan,
          createdAt: user.createdAt,
        },
      },
    });
  } catch {
    res.status(500).json({ success: false, error: "Failed to fetch user" });
  }
});

export { router as authRoutes };
