/**
 * Subscription plan gateway. The catalog and the user's plan are owned by the
 * api-server (`GET /api/plans`, `POST /api/account/plan`) so web and mobile stay
 * in sync. Switching a plan persists to the DB and takes effect immediately.
 */
import { API_BASE_URL } from "@/constants/api";

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

/** Public plan catalog (no auth required). */
export async function fetchPlans(): Promise<Plan[]> {
  const res = await fetch(`${API_BASE_URL}/plans`);
  if (!res.ok) throw new Error(`Failed to fetch plans (${res.status})`);
  const payload = await res.json();
  const plans = payload?.data?.plans;
  if (!Array.isArray(plans)) throw new Error("Malformed plans response");
  return plans as Plan[];
}

/** Switch the signed-in user's plan; returns the new plan. */
export async function changePlan(token: string, planId: string): Promise<Plan> {
  const res = await fetch(`${API_BASE_URL}/account/plan`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ planId }),
  });
  const payload = await res.json().catch(() => null);
  if (!res.ok || payload?.success === false) {
    throw new Error(payload?.error || `Failed to change plan (${res.status})`);
  }
  const plan = payload?.data?.plan;
  if (!plan) throw new Error("Malformed plan response");
  return plan as Plan;
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

/** Render a plan limit: -1 → "Unlimited", 0 → "—". */
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
