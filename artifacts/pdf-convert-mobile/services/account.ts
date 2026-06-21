/**
 * Account/usage data gateway for the signed-in user.
 *
 * Reads the real per-user statistics the api-server computes from the user's
 * conversion jobs (`GET /api/usage`). Both the workspace dashboard and the
 * usage screen consume this single source so their numbers always agree.
 */
import { API_BASE_URL } from "@/constants/api";

export interface UsageTotals {
  total: number;
  completed: number;
  failed: number;
  apiCalls: number;
  webCalls: number;
  successRate: number;
  /** Total output bytes processed. */
  dataProcessed: number;
  activeKeys: number;
}

export interface UsageMostUsed {
  type: string;
  name: string;
  count: number;
}

export interface UsageByDay {
  /** ISO date key, e.g. "2026-06-21". */
  date: string;
  count: number;
}

export interface UsageRecentJob {
  id: number;
  toolType: string;
  toolName: string;
  inputFilename: string;
  status: string;
  source: string;
  createdAt: string | null;
}

export interface AccountUsage {
  totals: UsageTotals;
  mostUsed: UsageMostUsed[];
  byDay: UsageByDay[];
  recent: UsageRecentJob[];
}

/** Fetches the signed-in user's real usage statistics from the backend. */
export async function fetchUsage(token: string): Promise<AccountUsage> {
  const res = await fetch(`${API_BASE_URL}/usage`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Failed to fetch usage (${res.status})`);
  const payload = await res.json();
  const d = payload?.data;
  if (!d?.totals) throw new Error("Malformed usage response");
  return {
    totals: d.totals as UsageTotals,
    mostUsed: (d.mostUsed ?? []) as UsageMostUsed[],
    byDay: (d.byDay ?? []) as UsageByDay[],
    recent: (d.recent ?? []) as UsageRecentJob[],
  };
}
