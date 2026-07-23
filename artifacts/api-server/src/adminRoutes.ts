// Admin dashboard API. Every route (except login) is guarded by requireAdmin —
// a distinct admin-scoped JWT issued from env-var credentials, never a user
// account. Aggregates are computed straight from conversion_jobs + users.
import type { Express, Request, Response } from "express";
import { db, users, conversionJobs, toolSettings } from "@workspace/db";
import { and, desc, eq, gte, sql } from "drizzle-orm";
import { adminLogin, requireAdmin, isAdminConfigured } from "./auth";
import { storage } from "./storage";
import { logger } from "./lib/logger";

type Range = "today" | "7d" | "30d" | "all";

function rangeStart(range: Range): Date | null {
  const now = new Date();
  switch (range) {
    case "today": {
      const d = new Date(now);
      d.setHours(0, 0, 0, 0);
      return d;
    }
    case "7d":
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case "30d":
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    default:
      return null;
  }
}

function parseRange(req: Request): Range {
  const r = String(req.query.range || "7d");
  return (["today", "7d", "30d", "all"] as const).includes(r as Range) ? (r as Range) : "7d";
}

export function registerAdminRoutes(app: Express, authRateLimit: (n: number) => any) {
  // Login is rate-limited hard: 5 attempts/min/IP.
  app.post("/api/admin/login", authRateLimit(5), adminLogin);

  // Lightweight config probe so the UI can show a clear message when the
  // ADMIN_USERNAME/ADMIN_PASSWORD env vars aren't set. Reveals nothing else.
  app.get("/api/admin/config", (_req, res) => {
    res.json({ success: true, data: { configured: isAdminConfigured() } });
  });

  // ---- Overview: headline totals for a time range ----
  app.get("/api/admin/overview", requireAdmin, async (req, res) => {
    try {
      const range = parseRange(req);
      const start = rangeStart(range);
      const jobWhere = start ? gte(conversionJobs.createdAt, start) : undefined;

      const [jobAgg] = await db
        .select({
          total: sql<number>`count(*)::int`,
          completed: sql<number>`count(*) filter (where ${conversionJobs.status} = 'completed')::int`,
          failed: sql<number>`count(*) filter (where ${conversionJobs.status} = 'failed')::int`,
          inputBytes: sql<number>`coalesce(sum(${conversionJobs.inputFileSize}),0)::bigint`,
          outputBytes: sql<number>`coalesce(sum(${conversionJobs.outputFileSize}),0)::bigint`,
          apiJobs: sql<number>`count(*) filter (where ${conversionJobs.source} = 'api')::int`,
          webJobs: sql<number>`count(*) filter (where ${conversionJobs.source} <> 'api')::int`,
          toolsUsed: sql<number>`count(distinct ${conversionJobs.toolType})::int`,
        })
        .from(conversionJobs)
        .where(jobWhere ?? sql`true`);

      const [userAgg] = await db
        .select({
          totalUsers: sql<number>`count(*)::int`,
          signups: start
            ? sql<number>`count(*) filter (where ${users.createdAt} >= ${start})::int`
            : sql<number>`count(*)::int`,
        })
        .from(users);

      const allTools = await storage.getAllTools();
      const paused = await storage.getPausedToolTypes();

      res.json({
        success: true,
        data: {
          range,
          jobs: {
            total: Number(jobAgg.total),
            completed: Number(jobAgg.completed),
            failed: Number(jobAgg.failed),
            successRate:
              Number(jobAgg.total) > 0
                ? Math.round((Number(jobAgg.completed) / Number(jobAgg.total)) * 1000) / 10
                : 0,
            inputBytes: Number(jobAgg.inputBytes),
            outputBytes: Number(jobAgg.outputBytes),
            apiJobs: Number(jobAgg.apiJobs),
            webJobs: Number(jobAgg.webJobs),
            toolsUsed: Number(jobAgg.toolsUsed),
          },
          users: {
            total: Number(userAgg.totalUsers),
            signups: Number(userAgg.signups),
          },
          tools: {
            total: allTools.length,
            paused: paused.size,
            active: allTools.length - paused.size,
          },
        },
      });
    } catch (err) {
      logger.error({ err }, "admin overview failed");
      res.status(500).json({ success: false, error: "Failed to load overview" });
    }
  });

  // ---- Activity: time-bucketed job counts (hourly for today, else daily) ----
  app.get("/api/admin/activity", requireAdmin, async (req, res) => {
    try {
      const range = parseRange(req);
      const start = rangeStart(range) ?? new Date(0);
      const bucket = range === "today" ? "hour" : "day";
      const rows = await db
        .select({
          bucket: sql<string>`to_char(date_trunc(${sql.raw(`'${bucket}'`)}, ${conversionJobs.createdAt}), 'YYYY-MM-DD"T"HH24:MI:SS')`,
          total: sql<number>`count(*)::int`,
          completed: sql<number>`count(*) filter (where ${conversionJobs.status} = 'completed')::int`,
          failed: sql<number>`count(*) filter (where ${conversionJobs.status} = 'failed')::int`,
        })
        .from(conversionJobs)
        .where(gte(conversionJobs.createdAt, start))
        .groupBy(sql`1`)
        .orderBy(sql`1`);
      res.json({ success: true, data: { range, bucket, points: rows } });
    } catch (err) {
      logger.error({ err }, "admin activity failed");
      res.status(500).json({ success: false, error: "Failed to load activity" });
    }
  });

  // ---- Tools: per-tool usage aggregates + paused state, and pause toggle ----
  app.get("/api/admin/tools", requireAdmin, async (req, res) => {
    try {
      const range = parseRange(req);
      const start = rangeStart(range);
      const rows = await db
        .select({
          toolType: conversionJobs.toolType,
          total: sql<number>`count(*)::int`,
          completed: sql<number>`count(*) filter (where ${conversionJobs.status} = 'completed')::int`,
          failed: sql<number>`count(*) filter (where ${conversionJobs.status} = 'failed')::int`,
          outputBytes: sql<number>`coalesce(sum(${conversionJobs.outputFileSize}),0)::bigint`,
          lastUsedAt: sql<string | null>`max(${conversionJobs.createdAt})`,
        })
        .from(conversionJobs)
        .where(start ? gte(conversionJobs.createdAt, start) : sql`true`)
        .groupBy(conversionJobs.toolType);

      const byType = new Map(rows.map((r) => [r.toolType, r]));
      const paused = await storage.getPausedToolTypes();
      const allTools = await storage.getAllTools();

      const tools = allTools.map((t) => {
        const agg = byType.get(t.type);
        return {
          toolType: t.type,
          name: t.name,
          category: t.category,
          paused: paused.has(t.type),
          total: Number(agg?.total ?? 0),
          completed: Number(agg?.completed ?? 0),
          failed: Number(agg?.failed ?? 0),
          outputBytes: Number(agg?.outputBytes ?? 0),
          lastUsedAt: agg?.lastUsedAt ?? null,
        };
      });
      tools.sort((a, b) => b.total - a.total);
      res.json({ success: true, data: { range, tools } });
    } catch (err) {
      logger.error({ err }, "admin tools failed");
      res.status(500).json({ success: false, error: "Failed to load tools" });
    }
  });

  app.post("/api/admin/tools/:toolType/pause", requireAdmin, async (req, res) => {
    try {
      const toolType = String(req.params.toolType);
      const tool = await storage.getToolByType(toolType as any);
      if (!tool) {
        return res.status(404).json({ success: false, error: "Unknown tool" });
      }
      const paused = !!req.body?.paused;
      await storage.setToolPaused(toolType, paused);
      res.json({ success: true, data: { toolType, paused } });
    } catch (err) {
      logger.error({ err }, "admin pause toggle failed");
      res.status(500).json({ success: false, error: "Failed to update tool" });
    }
  });

  // ---- Live traffic: most recent jobs (polled by the dashboard) ----
  app.get("/api/admin/jobs/recent", requireAdmin, async (req, res) => {
    try {
      const limit = Math.min(Math.max(parseInt(String(req.query.limit)) || 50, 1), 200);
      const rows = await db
        .select({
          id: conversionJobs.id,
          toolType: conversionJobs.toolType,
          status: conversionJobs.status,
          source: conversionJobs.source,
          inputFilename: conversionJobs.inputFilename,
          inputFileSize: conversionJobs.inputFileSize,
          outputFileSize: conversionJobs.outputFileSize,
          processingTime: conversionJobs.processingTime,
          errorMessage: conversionJobs.errorMessage,
          createdAt: conversionJobs.createdAt,
          userEmail: users.email,
        })
        .from(conversionJobs)
        .leftJoin(users, eq(conversionJobs.userId, users.id))
        .orderBy(desc(conversionJobs.createdAt))
        .limit(limit);
      res.json({ success: true, data: { jobs: rows } });
    } catch (err) {
      logger.error({ err }, "admin recent jobs failed");
      res.status(500).json({ success: false, error: "Failed to load recent jobs" });
    }
  });

  // ---- Customers: list with per-user aggregates ----
  app.get("/api/admin/customers", requireAdmin, async (req, res) => {
    try {
      const limit = Math.min(Math.max(parseInt(String(req.query.limit)) || 100, 1), 500);
      const rows = await db
        .select({
          id: users.id,
          email: users.email,
          name: users.name,
          plan: users.plan,
          credits: users.credits,
          createdAt: users.createdAt,
          totalJobs: sql<number>`count(${conversionJobs.id})::int`,
          completedJobs: sql<number>`count(*) filter (where ${conversionJobs.status} = 'completed')::int`,
          outputBytes: sql<number>`coalesce(sum(${conversionJobs.outputFileSize}),0)::bigint`,
          lastActiveAt: sql<string | null>`max(${conversionJobs.createdAt})`,
        })
        .from(users)
        .leftJoin(conversionJobs, eq(conversionJobs.userId, users.id))
        .groupBy(users.id)
        .orderBy(sql`count(${conversionJobs.id}) desc`)
        .limit(limit);
      res.json({
        success: true,
        data: {
          customers: rows.map((r) => ({
            ...r,
            totalJobs: Number(r.totalJobs),
            completedJobs: Number(r.completedJobs),
            outputBytes: Number(r.outputBytes),
          })),
        },
      });
    } catch (err) {
      logger.error({ err }, "admin customers failed");
      res.status(500).json({ success: false, error: "Failed to load customers" });
    }
  });

  // ---- Customer drill-down: per-tool breakdown + recent jobs ----
  app.get("/api/admin/customers/:id", requireAdmin, async (req, res) => {
    try {
      const id = String(req.params.id);
      const user = await storage.getUserById(id);
      if (!user) {
        return res.status(404).json({ success: false, error: "Customer not found" });
      }
      const perTool = await db
        .select({
          toolType: conversionJobs.toolType,
          total: sql<number>`count(*)::int`,
          completed: sql<number>`count(*) filter (where ${conversionJobs.status} = 'completed')::int`,
          outputBytes: sql<number>`coalesce(sum(${conversionJobs.outputFileSize}),0)::bigint`,
        })
        .from(conversionJobs)
        .where(eq(conversionJobs.userId, id))
        .groupBy(conversionJobs.toolType)
        .orderBy(sql`count(*) desc`);

      const recent = await db
        .select({
          id: conversionJobs.id,
          toolType: conversionJobs.toolType,
          status: conversionJobs.status,
          source: conversionJobs.source,
          inputFilename: conversionJobs.inputFilename,
          outputFileSize: conversionJobs.outputFileSize,
          createdAt: conversionJobs.createdAt,
        })
        .from(conversionJobs)
        .where(eq(conversionJobs.userId, id))
        .orderBy(desc(conversionJobs.createdAt))
        .limit(25);

      const { passwordHash: _ph, ...safeUser } = user as any;
      res.json({
        success: true,
        data: {
          customer: safeUser,
          perTool: perTool.map((r) => ({
            ...r,
            total: Number(r.total),
            completed: Number(r.completed),
            outputBytes: Number(r.outputBytes),
          })),
          recentJobs: recent,
        },
      });
    } catch (err) {
      logger.error({ err }, "admin customer detail failed");
      res.status(500).json({ success: false, error: "Failed to load customer" });
    }
  });
}
