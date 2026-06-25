/**
 * RevenueCat backend bridge. After a native purchase or restore, the app asks
 * the api-server to reconcile the RevenueCat customer (keyed by our user id):
 * active subscription entitlements set the plan and any one-time credit-pack
 * purchases top up the durable credit balance. The server is the source of
 * truth for both — the client never grants entitlements or credits itself.
 */
import { API_BASE_URL } from "@/constants/api";

export interface RevenueCatSyncResult {
  /** Resolved plan id, e.g. "free" | "pro" | "business". */
  plan: string;
  /** Current durable credit balance after any grants. */
  credits: number;
  /** Credits granted by this sync (0 when nothing new). */
  creditsGranted: number;
}

/** Reconcile the signed-in user's RevenueCat purchases on the backend. */
export async function syncRevenueCatPurchases(
  token: string,
): Promise<RevenueCatSyncResult> {
  const res = await fetch(`${API_BASE_URL}/revenuecat/sync`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  const payload = await res.json().catch(() => null);
  if (!res.ok || payload?.success === false) {
    throw new Error(payload?.error || `Failed to sync purchases (${res.status})`);
  }
  const data = payload?.data;
  if (!data || typeof data.plan !== "string") {
    throw new Error("Malformed sync response");
  }
  return {
    plan: data.plan,
    credits: Number(data.credits ?? 0),
    creditsGranted: Number(data.creditsGranted ?? 0),
  };
}
