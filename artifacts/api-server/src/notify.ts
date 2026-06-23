import { storage } from "./storage";
import { logger } from "./lib/logger";

/**
 * Best-effort notification creation. Notifications are a secondary side effect of
 * real account events (signup, API key creation, …) — they must never break the
 * primary action, so failures are swallowed and logged instead of thrown.
 */
export async function notifyUser(
  userId: string,
  notification: { type?: string; title: string; body?: string; link?: string },
): Promise<void> {
  try {
    await storage.createNotification({
      userId,
      type: notification.type ?? "info",
      title: notification.title,
      body: notification.body ?? null,
      link: notification.link ?? null,
    });
  } catch (err) {
    logger.warn({ err, userId }, "Failed to create notification");
  }
}

/**
 * Idempotently ensure a user has the one-time welcome notification. New signups
 * get it at account creation; existing accounts get it lazily the first time
 * they open their notifications, so the feature surfaces a real message for
 * everyone without seeding fake data. Detected by the dedicated "welcome" type.
 */
export async function ensureWelcomeNotification(userId: string): Promise<void> {
  try {
    if (await storage.hasNotificationType(userId, "welcome")) return;
    await storage.createNotification({
      userId,
      type: "welcome",
      title: "Welcome to PDF Genius",
      body: "Your account is ready. Explore 20+ tools to convert, compress, edit and secure your PDFs.",
      link: "/dashboard",
    });
  } catch (err) {
    logger.warn({ err, userId }, "Failed to ensure welcome notification");
  }
}
