import { MOCK_LATENCY_MS, mockDelay } from "@/constants/config";
import {
  API_KEYS,
  DASHBOARD_STATS,
  DEMO_USER,
  PLANS,
  RECENT_JOBS,
  USAGE_STATS,
  type ApiKey,
  type DashboardStats,
  type Job,
  type MockUser,
  type Plan,
  type UsageStats,
} from "@/mocks/data";

/**
 * Promise-based mock service. Every function emulates a network round-trip with
 * a small delay and returns local data. This is the ONLY data source while
 * `USE_MOCK_DATA` is true.
 */

export interface AuthResult {
  success: boolean;
  error?: string;
  user?: MockUser;
  token?: string;
}

function makeToken(): string {
  return "mock_tok_" + Math.random().toString(36).slice(2, 14);
}

export const mockApi = {
  // ── Auth ────────────────────────────────────────────────────────────────
  async signin(email: string, _password: string): Promise<AuthResult> {
    await mockDelay(null, MOCK_LATENCY_MS);
    if (!email || !email.includes("@")) {
      return { success: false, error: "Please enter a valid email address." };
    }
    const user: MockUser = { ...DEMO_USER, email, name: email.split("@")[0] || DEMO_USER.name };
    return { success: true, user, token: makeToken() };
  },

  async signup(email: string, _password: string, name?: string): Promise<AuthResult> {
    await mockDelay(null, MOCK_LATENCY_MS);
    if (!email || !email.includes("@")) {
      return { success: false, error: "Please enter a valid email address." };
    }
    const user: MockUser = {
      ...DEMO_USER,
      email,
      name: name?.trim() || email.split("@")[0] || DEMO_USER.name,
    };
    return { success: true, user, token: makeToken() };
  },

  async getCurrentUser(): Promise<MockUser> {
    return mockDelay(DEMO_USER, 300);
  },

  // ── Dashboard / usage ─────────────────────────────────────────────────────
  async getDashboardStats(): Promise<DashboardStats> {
    return mockDelay(DASHBOARD_STATS);
  },

  async getUsageStats(): Promise<UsageStats> {
    return mockDelay(USAGE_STATS);
  },

  async getRecentJobs(): Promise<Job[]> {
    return mockDelay(RECENT_JOBS);
  },

  // ── API keys ──────────────────────────────────────────────────────────────
  async getApiKeys(): Promise<ApiKey[]> {
    return mockDelay(API_KEYS);
  },

  async createApiKey(name: string): Promise<ApiKey> {
    const key: ApiKey = {
      id: "key_" + Math.random().toString(36).slice(2, 8),
      name: name || "New Key",
      key: "pk_live_demo_" + Math.random().toString(36).slice(2, 18),
      prefix: "pk_live_demo",
      createdAt: new Date().toISOString(),
      lastUsedAt: null,
      status: "active",
      requests: 0,
    };
    return mockDelay(key);
  },

  async deleteApiKey(id: string): Promise<{ success: boolean; id: string }> {
    return mockDelay({ success: true, id });
  },

  // ── Plans ─────────────────────────────────────────────────────────────────
  async getPlans(): Promise<Plan[]> {
    return mockDelay(PLANS);
  },

  async subscribe(planId: string): Promise<{ success: boolean; planId: string }> {
    return mockDelay({ success: true, planId });
  },
};

export type MockApi = typeof mockApi;
