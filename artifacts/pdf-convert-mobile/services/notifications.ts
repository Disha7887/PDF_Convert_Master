/**
 * Notifications gateway for the signed-in user.
 *
 * Reads/updates the real in-app notifications the api-server generates from
 * genuine account events (welcome on signup, API key created). Mirrors the web
 * client — same endpoints, same JWT bearer auth. No mock data.
 */
import { API_BASE_URL } from "@/constants/api";
import { getAuthToken } from "@/services/authToken";

export interface NotificationItem {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  read: boolean;
  createdAt: string;
}

function authHeaders(): Record<string, string> {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function ensureConfigured(): void {
  if (!API_BASE_URL) {
    throw new Error(
      "The backend isn't configured (EXPO_PUBLIC_DOMAIN is missing).",
    );
  }
}

/** Fetch the signed-in user's most recent notifications. */
export async function fetchNotifications(): Promise<NotificationItem[]> {
  ensureConfigured();
  const res = await fetch(`${API_BASE_URL}/notifications`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error(`Failed to fetch notifications (${res.status})`);
  const payload = await res.json();
  return (payload?.data ?? []) as NotificationItem[];
}

/** Fetch the unread badge count. */
export async function fetchUnreadCount(): Promise<number> {
  ensureConfigured();
  const res = await fetch(`${API_BASE_URL}/notifications/unread-count`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error(`Failed to fetch count (${res.status})`);
  const payload = await res.json();
  return Number(payload?.data?.count ?? 0);
}

/** Mark a single notification read. */
export async function markNotificationRead(id: string): Promise<void> {
  ensureConfigured();
  const res = await fetch(`${API_BASE_URL}/notifications/${id}/read`, {
    method: "POST",
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error(`Failed to update notification (${res.status})`);
}

/** Mark all of the user's notifications read. */
export async function markAllNotificationsRead(): Promise<void> {
  ensureConfigured();
  const res = await fetch(`${API_BASE_URL}/notifications/read-all`, {
    method: "POST",
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error(`Failed to update notifications (${res.status})`);
}
