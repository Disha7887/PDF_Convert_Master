import { Router, Request, Response } from "express";
import { authenticateJWT } from "../middlewares/authMiddleware";
import { storage } from "../storage";
import { generateApiKey, hashApiKey } from "../utils/generateApiKey";

const router = Router();

const KEY_LIMIT = 10;

function maskKey(keyLast4: string | null): string {
  return `sk-****${keyLast4 ?? ""}`;
}

// GET /keys — list the calling user's API keys (masked, never raw)
router.get("/", authenticateJWT, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const rows = await storage.getUserApiKeys(userId);
    const data = rows.map((k) => ({
      id: k.id,
      name: k.name ?? null,
      maskedKey: maskKey(k.keyLast4),
      createdAt: k.createdAt?.toISOString() ?? null,
      lastUsedAt: k.lastUsedAt?.toISOString() ?? null,
    }));
    res.json({ success: true, data });
  } catch {
    res.status(500).json({ success: false, error: "Failed to list API keys" });
  }
});

// POST /keys — generate a new API key and return the raw value once
router.post("/", authenticateJWT, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const name: string | undefined = typeof req.body.name === "string" && req.body.name.trim()
      ? req.body.name.trim()
      : undefined;

    const existing = await storage.getUserApiKeys(userId);
    if (existing.length >= KEY_LIMIT) {
      res.status(400).json({
        success: false,
        error: `Maximum API keys limit reached (${KEY_LIMIT} keys per user)`,
      });
      return;
    }

    const rawKey = generateApiKey();
    const hash = hashApiKey(rawKey);
    const last4 = rawKey.slice(-4);

    const record = await storage.createApiKey({
      userId,
      apiKey: hash,
      name: name ?? null,
      keyLast4: last4,
    });

    res.status(201).json({
      success: true,
      data: {
        id: record.id,
        apiKey: rawKey,
        maskedKey: maskKey(last4),
        name: record.name ?? null,
        createdAt: record.createdAt?.toISOString() ?? null,
      },
    });
  } catch {
    res.status(500).json({ success: false, error: "Failed to generate API key" });
  }
});

// DELETE /keys/:id — revoke an API key owned by the calling user
router.delete("/:id", authenticateJWT, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const id = String(req.params["id"]);

    const record = await storage.getApiKeyById(id);
    if (!record || record.userId !== userId) {
      res.status(404).json({ success: false, error: "API key not found" });
      return;
    }

    await storage.deleteApiKey(id);
    res.json({ success: true, message: "API key revoked" });
  } catch {
    res.status(500).json({ success: false, error: "Failed to revoke API key" });
  }
});

export { router as keysRoutes };
