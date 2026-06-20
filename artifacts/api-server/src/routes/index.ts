import { Router, Request, Response, type IRouter } from "express";
import healthRouter from "./health";
import { authRoutes } from "./authRoutes";
import { keysRoutes } from "./keysRoutes";
import { authenticateJWT } from "../middlewares/authMiddleware";
import { storage } from "../storage";

const router: IRouter = Router();

router.use(healthRouter);

// Auth routes: /auth/register, /auth/login, /auth/user, /auth/usage, /auth/generate-api-key
router.use("/auth", authRoutes);

// Key management routes: /keys, /keys/:id
router.use("/keys", keysRoutes);

// GET /user — verify JWT and return current user (called by web AuthContext on load)
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

export function registerRoutes(app: any) {
  app.use("/api", router);
}

export default router;
