// Plan catalog + usage helpers shared by the Pricing and Manage Plans pages.
// The catalog is fetched from the server (`GET /api/plans`) so web and mobile
// always agree; usage comes from `GET /api/usage` (real conversion data).
import { authedJson } from "@/lib/authedFetch";
import type { User } from "@workspace/db";

export interface PlanLimits {
  apiCalls: number;
  storageBytes: number;
  conversions: number;
}

export interface Plan {
  id: string;
  name: string;
  price: number;
  period: "month";
  description: string;
  popular: boolean;
  cta: string;
  features: string[];
  limits: PlanLimits;
}

export interface UsageData {
  totals: {
    total: number;
    completed: number;
    failed: number;
    apiCalls: number;
    webCalls: number;
    successRate: number;
    dataProcessed: number;
    activeKeys: number;
  };
}

export function fetchPlans(): Promise<Plan[]> {
  return authedJson<{ data: { plans: Plan[] } }>("/api/plans").then(
    (r) => r.data.plans,
  );
}

export function fetchUsage(): Promise<UsageData> {
  return authedJson<{ data: UsageData }>("/api/usage").then((r) => r.data);
}

export function changePlan(planId: string): Promise<Plan> {
  return authedJson<{ data: { plan: Plan } }>("/api/account/plan", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ planId }),
  }).then((r) => r.data.plan);
}

// --- Dodo Payments billing -------------------------------------------------

/** Start a hosted Dodo checkout for a paid plan; resolves to its checkout URL. */
export function startCheckout(planId: string): Promise<string> {
  return authedJson<{ data: { url: string } }>("/api/billing/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ planId }),
  }).then((r) => r.data.url);
}

/** Open the Dodo customer portal (manage/cancel); resolves to its URL. */
export function openBillingPortal(): Promise<string> {
  return authedJson<{ data: { url: string } }>("/api/billing/portal", {
    method: "POST",
  }).then((r) => r.data.url);
}

/** Whether the web billing flow is configured and live. */
export function fetchBillingConfig(): Promise<{ enabled: boolean }> {
  return authedJson<{ data: { enabled: boolean } }>("/api/billing/config").then(
    (r) => r.data,
  );
}

/** Re-fetch the signed-in user (used to reflect a plan change after checkout). */
export function fetchMe(): Promise<User> {
  return authedJson<{ data: { user: User } }>("/api/user").then(
    (r) => r.data.user,
  );
}

export function formatBytes(bytes: number): string {
  if (!bytes || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.min(
    units.length - 1,
    Math.floor(Math.log(bytes) / Math.log(1024)),
  );
  const value = bytes / Math.pow(1024, i);
  return `${value.toFixed(value < 10 && i > 0 ? 1 : 0)} ${units[i]}`;
}

/** Render a plan limit for display: -1 → "Unlimited", 0 → "—". */
export function formatLimit(limit: number, fmt: (n: number) => string): string {
  if (limit < 0) return "Unlimited";
  if (limit === 0) return "—";
  return fmt(limit);
}

/** Percentage of a limit used (0 for unlimited/none). */
export function usagePercent(used: number, limit: number): number {
  if (limit <= 0) return 0;
  return Math.min(100, Math.round((used / limit) * 1000) / 10);
}
