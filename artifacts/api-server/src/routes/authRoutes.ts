import { Router } from "express";
import { register, login, generateApiKeyHandler, getUsage } from "../controllers/authController";
import { authenticateJWT } from "../middlewares/authMiddleware";

const router = Router();

// Public routes
router.post("/register", register);
router.post("/login", login);

// Protected routes (require JWT token)
router.post("/generate-api-key", authenticateJWT, generateApiKeyHandler);
router.get("/usage", authenticateJWT, getUsage);

export { router as authRoutes };