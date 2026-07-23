// Hidden admin dashboard. Not linked anywhere on the site; reachable only at
// /admin. Auth is a dedicated admin username/password (env vars on the server),
// completely separate from customer accounts. Everything here is enforced
// server-side — the UI is just a viewer for the admin API.
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSeo } from "@/lib/useSeo";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

const TOKEN_KEY = "admin_token";
type Range = "today" | "7d" | "30d" | "all";
type Tab = "overview" | "live" | "tools" | "customers";

function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

async function adminFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken() ?? ""}`,
      ...(init?.headers || {}),
    },
  });
  if (res.status === 401 || res.status === 403) {
    localStorage.removeItem(TOKEN_KEY);
    throw new Error("unauthorized");
  }
  const data = await res.json();
  if (!data.success) throw new Error(data.error || "Request failed");
  return data.data as T;
}

function formatBytes(bytes: number): string {
  if (!bytes || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
  const v = bytes / Math.pow(1024, i);
  return `${v.toFixed(v < 10 && i > 0 ? 1 : 0)} ${units[i]}`;
}

function timeAgo(iso: string | null): string {
  if (!iso) return "—";
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return `${Math.floor(s)}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

const RANGES: { id: Range; label: string }[] = [
  { id: "today", label: "Today" },
  { id: "7d", label: "7 days" },
  { id: "30d", label: "30 days" },
  { id: "all", label: "All time" },
];

// ---------------------------------------------------------------------------

function AdminLogin({ onLoggedIn }: { onLoggedIn: () => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [configured, setConfigured] = useState<boolean | null>(null);

  useEffect(() => {
    fetch("/api/admin/config")
      .then((r) => r.json())
      .then((d) => setConfigured(!!d?.data?.configured))
      .catch(() => setConfigured(null));
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (data.success && data.data?.token) {
        localStorage.setItem(TOKEN_KEY, data.data.token);
        onLoggedIn();
      } else {
        setError(data.error || "Login failed");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#171c28] px-4">
      <form
        onSubmit={submit}
        className="w-full max-w-sm rounded-2xl bg-[#1f2534] p-8 shadow-xl"
      >
        <h1 className="mb-1 text-xl font-semibold text-white">Admin access</h1>
        <p className="mb-6 text-sm text-gray-400">Restricted area.</p>
        {configured === false && (
          <p className="mb-4 rounded-lg bg-amber-500/10 p-3 text-sm text-amber-400">
            Admin credentials are not configured on the server. Set ADMIN_USERNAME
            and ADMIN_PASSWORD environment variables.
          </p>
        )}
        <label className="mb-1 block text-xs font-medium text-gray-400">Username</label>
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoComplete="username"
          className="mb-4 w-full rounded-lg border border-gray-700 bg-[#171c28] px-3 py-2 text-white outline-none focus:border-[#f7433d]"
        />
        <label className="mb-1 block text-xs font-medium text-gray-400">Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          className="mb-4 w-full rounded-lg border border-gray-700 bg-[#171c28] px-3 py-2 text-white outline-none focus:border-[#f7433d]"
        />
        {error && <p className="mb-3 text-sm text-red-400">{error}</p>}
        <button
          type="submit"
          disabled={busy || !username || !password}
          className="w-full rounded-lg bg-[#f7433d] py-2.5 font-medium text-white disabled:opacity-50"
        >
          {busy ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}

// ---------------------------------------------------------------------------

interface Overview {
  range: Range;
  jobs: {
    total: number;
    completed: number;
    failed: number;
    successRate: number;
    inputBytes: number;
    outputBytes: number;
    apiJobs: number;
    webJobs: number;
    toolsUsed: number;
  };
  users: { total: number; signups: number };
  tools: { total: number; paused: number; active: number };
}

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl bg-[#1f2534] p-4">
      <p className="text-xs uppercase tracking-wide text-gray-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-white">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-gray-400">{sub}</p>}
    </div>
  );
}

function OverviewTab({ range }: { range: Range }) {
  const [data, setData] = useState<Overview | null>(null);
  const [activity, setActivity] = useState<{ bucket: string; total: number; completed: number; failed: number }[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [ov, act] = await Promise.all([
        adminFetch<Overview>(`/api/admin/overview?range=${range}`),
        adminFetch<{ points: any[] }>(`/api/admin/activity?range=${range}`),
      ]);
      setData(ov);
      setActivity(act.points);
      setError(null);
    } catch (e: any) {
      if (e.message === "unauthorized") window.location.reload();
      else setError(e.message);
    }
  }, [range]);

  useEffect(() => {
    load();
    const t = setInterval(load, 15000);
    return () => clearInterval(t);
  }, [load]);

  if (error) return <p className="text-red-400">{error}</p>;
  if (!data) return <p className="text-gray-400">Loading…</p>;

  const chartData = activity.map((p) => ({
    ...p,
    label: range === "today"
      ? new Date(p.bucket).toLocaleTimeString([], { hour: "2-digit" })
      : new Date(p.bucket).toLocaleDateString([], { month: "short", day: "numeric" }),
  }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Documents generated" value={String(data.jobs.completed)} sub={`${formatBytes(data.jobs.outputBytes)} produced`} />
        <StatCard label="Total conversions" value={String(data.jobs.total)} sub={`${data.jobs.failed} failed`} />
        <StatCard label="Success rate" value={`${data.jobs.successRate}%`} sub={`${data.jobs.toolsUsed} tools used`} />
        <StatCard label="Data processed" value={formatBytes(data.jobs.inputBytes)} sub="input files" />
        <StatCard label="Customers" value={String(data.users.total)} sub={`+${data.users.signups} signups in range`} />
        <StatCard label="Web conversions" value={String(data.jobs.webJobs)} />
        <StatCard label="API conversions" value={String(data.jobs.apiJobs)} />
        <StatCard label="Tools" value={`${data.tools.active}/${data.tools.total}`} sub={data.tools.paused ? `${data.tools.paused} paused` : "all active"} />
      </div>
      <div className="rounded-xl bg-[#1f2534] p-4">
        <p className="mb-3 text-sm font-medium text-gray-300">
          Conversions {range === "today" ? "per hour" : "per day"}
        </p>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2c3345" />
              <XAxis dataKey="label" stroke="#6b7280" fontSize={12} />
              <YAxis stroke="#6b7280" fontSize={12} allowDecimals={false} />
              <Tooltip
                contentStyle={{ background: "#171c28", border: "1px solid #2c3345", borderRadius: 8 }}
                labelStyle={{ color: "#e5e7eb" }}
              />
              <Bar dataKey="completed" stackId="a" fill="#22c55e" name="Completed" />
              <Bar dataKey="failed" stackId="a" fill="#f7433d" name="Failed" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------

interface RecentJob {
  id: number;
  toolType: string;
  status: string;
  source: string;
  inputFilename: string;
  inputFileSize: number | null;
  outputFileSize: number | null;
  processingTime: number | null;
  errorMessage: string | null;
  createdAt: string;
  userEmail: string | null;
}

const STATUS_COLORS: Record<string, string> = {
  completed: "text-green-400",
  failed: "text-red-400",
  processing: "text-amber-400",
  pending: "text-gray-400",
};

function LiveTab() {
  const [jobs, setJobs] = useState<RecentJob[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const d = await adminFetch<{ jobs: RecentJob[] }>("/api/admin/jobs/recent?limit=50");
      setJobs(d.jobs);
      setError(null);
    } catch (e: any) {
      if (e.message === "unauthorized") window.location.reload();
      else setError(e.message);
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
  }, [load]);

  if (error) return <p className="text-red-400">{error}</p>;

  return (
    <div className="overflow-x-auto rounded-xl bg-[#1f2534]">
      <div className="flex items-center gap-2 border-b border-gray-700/50 px-4 py-3">
        <span className="relative flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-60" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-500" />
        </span>
        <p className="text-sm font-medium text-gray-300">Live activity (refreshes every 5s)</p>
      </div>
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="text-xs uppercase tracking-wide text-gray-500">
            <th className="px-4 py-2">When</th>
            <th className="px-4 py-2">Tool</th>
            <th className="px-4 py-2">Status</th>
            <th className="px-4 py-2">Source</th>
            <th className="px-4 py-2">File</th>
            <th className="px-4 py-2">Output</th>
            <th className="px-4 py-2">Customer</th>
          </tr>
        </thead>
        <tbody>
          {jobs.map((j) => (
            <tr key={j.id} className="border-t border-gray-700/30 text-gray-300">
              <td className="whitespace-nowrap px-4 py-2 text-gray-400">{timeAgo(j.createdAt)}</td>
              <td className="whitespace-nowrap px-4 py-2">{j.toolType}</td>
              <td className={`whitespace-nowrap px-4 py-2 ${STATUS_COLORS[j.status] ?? "text-gray-300"}`}>{j.status}</td>
              <td className="px-4 py-2">{j.source}</td>
              <td className="max-w-[220px] truncate px-4 py-2" title={j.inputFilename}>{j.inputFilename}</td>
              <td className="whitespace-nowrap px-4 py-2">{j.outputFileSize ? formatBytes(j.outputFileSize) : "—"}</td>
              <td className="px-4 py-2">{j.userEmail ?? <span className="text-gray-500">guest</span>}</td>
            </tr>
          ))}
          {jobs.length === 0 && (
            <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500">No activity yet.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

// ---------------------------------------------------------------------------

interface AdminTool {
  toolType: string;
  name: string;
  category: string;
  paused: boolean;
  total: number;
  completed: number;
  failed: number;
  outputBytes: number;
  lastUsedAt: string | null;
}

function ToolsTab({ range }: { range: Range }) {
  const [tools, setTools] = useState<AdminTool[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busyTool, setBusyTool] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const d = await adminFetch<{ tools: AdminTool[] }>(`/api/admin/tools?range=${range}`);
      setTools(d.tools);
      setError(null);
    } catch (e: any) {
      if (e.message === "unauthorized") window.location.reload();
      else setError(e.message);
    }
  }, [range]);

  useEffect(() => {
    load();
  }, [load]);

  const toggle = async (tool: AdminTool) => {
    setBusyTool(tool.toolType);
    try {
      await adminFetch(`/api/admin/tools/${tool.toolType}/pause`, {
        method: "POST",
        body: JSON.stringify({ paused: !tool.paused }),
      });
      await load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusyTool(null);
    }
  };

  if (error) return <p className="text-red-400">{error}</p>;

  return (
    <div className="overflow-x-auto rounded-xl bg-[#1f2534]">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="text-xs uppercase tracking-wide text-gray-500">
            <th className="px-4 py-3">Tool</th>
            <th className="px-4 py-3">Uses</th>
            <th className="px-4 py-3">Completed</th>
            <th className="px-4 py-3">Failed</th>
            <th className="px-4 py-3">Output</th>
            <th className="px-4 py-3">Last used</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody>
          {tools.map((t) => (
            <tr key={t.toolType} className="border-t border-gray-700/30 text-gray-300">
              <td className="px-4 py-2.5">
                <p className="font-medium text-white">{t.name}</p>
                <p className="text-xs text-gray-500">{t.toolType}</p>
              </td>
              <td className="px-4 py-2.5">{t.total}</td>
              <td className="px-4 py-2.5">{t.completed}</td>
              <td className="px-4 py-2.5">{t.failed}</td>
              <td className="whitespace-nowrap px-4 py-2.5">{formatBytes(t.outputBytes)}</td>
              <td className="whitespace-nowrap px-4 py-2.5 text-gray-400">{timeAgo(t.lastUsedAt)}</td>
              <td className="px-4 py-2.5">
                {t.paused ? (
                  <span className="rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-400">Paused</span>
                ) : (
                  <span className="rounded-full bg-green-500/10 px-2.5 py-1 text-xs font-medium text-green-400">Active</span>
                )}
              </td>
              <td className="px-4 py-2.5">
                <button
                  onClick={() => toggle(t)}
                  disabled={busyTool === t.toolType}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium disabled:opacity-50 ${
                    t.paused
                      ? "bg-green-500/15 text-green-400 hover:bg-green-500/25"
                      : "bg-[#f7433d]/15 text-[#f7433d] hover:bg-[#f7433d]/25"
                  }`}
                >
                  {busyTool === t.toolType ? "…" : t.paused ? "Resume" : "Pause"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ---------------------------------------------------------------------------

interface Customer {
  id: string;
  email: string;
  name: string | null;
  plan: string;
  credits: number;
  createdAt: string;
  totalJobs: number;
  completedJobs: number;
  outputBytes: number;
  lastActiveAt: string | null;
}

interface CustomerDetail {
  customer: Customer & { profilePictureUrl?: string | null };
  perTool: { toolType: string; total: number; completed: number; outputBytes: number }[];
  recentJobs: { id: number; toolType: string; status: string; source: string; inputFilename: string; outputFileSize: number | null; createdAt: string }[];
}

function CustomersTab() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [detail, setDetail] = useState<CustomerDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    adminFetch<{ customers: Customer[] }>("/api/admin/customers?limit=500")
      .then((d) => setCustomers(d.customers))
      .catch((e) => {
        if (e.message === "unauthorized") window.location.reload();
        else setError(e.message);
      });
  }, []);

  const open = async (id: string) => {
    try {
      setDetail(await adminFetch<CustomerDetail>(`/api/admin/customers/${id}`));
    } catch (e: any) {
      setError(e.message);
    }
  };

  const filtered = useMemo(
    () =>
      customers.filter(
        (c) =>
          !query ||
          c.email.toLowerCase().includes(query.toLowerCase()) ||
          (c.name ?? "").toLowerCase().includes(query.toLowerCase()),
      ),
    [customers, query],
  );

  if (error) return <p className="text-red-400">{error}</p>;

  if (detail) {
    const c = detail.customer;
    return (
      <div className="space-y-4">
        <button onClick={() => setDetail(null)} className="text-sm text-gray-400 hover:text-white">
          ← Back to customers
        </button>
        <div className="rounded-xl bg-[#1f2534] p-5">
          <p className="text-lg font-semibold text-white">{c.name || c.email}</p>
          <p className="text-sm text-gray-400">{c.email}</p>
          <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-5">
            <StatCard label="Plan" value={c.plan} />
            <StatCard label="Credits" value={String(c.credits)} />
            <StatCard label="Documents" value={String(detail.perTool.reduce((s, t) => s + t.completed, 0))} />
            <StatCard label="Data generated" value={formatBytes(detail.perTool.reduce((s, t) => s + t.outputBytes, 0))} />
            <StatCard label="Joined" value={new Date(c.createdAt).toLocaleDateString()} />
          </div>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-xl bg-[#1f2534] p-4">
            <p className="mb-2 text-sm font-medium text-gray-300">Tool usage</p>
            <table className="w-full text-left text-sm text-gray-300">
              <thead>
                <tr className="text-xs uppercase text-gray-500">
                  <th className="py-1.5">Tool</th><th className="py-1.5">Uses</th><th className="py-1.5">Done</th><th className="py-1.5">Output</th>
                </tr>
              </thead>
              <tbody>
                {detail.perTool.map((t) => (
                  <tr key={t.toolType} className="border-t border-gray-700/30">
                    <td className="py-1.5">{t.toolType}</td>
                    <td className="py-1.5">{t.total}</td>
                    <td className="py-1.5">{t.completed}</td>
                    <td className="py-1.5">{formatBytes(t.outputBytes)}</td>
                  </tr>
                ))}
                {detail.perTool.length === 0 && (
                  <tr><td colSpan={4} className="py-4 text-center text-gray-500">No conversions yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="rounded-xl bg-[#1f2534] p-4">
            <p className="mb-2 text-sm font-medium text-gray-300">Recent jobs</p>
            <table className="w-full text-left text-sm text-gray-300">
              <thead>
                <tr className="text-xs uppercase text-gray-500">
                  <th className="py-1.5">When</th><th className="py-1.5">Tool</th><th className="py-1.5">Status</th><th className="py-1.5">File</th>
                </tr>
              </thead>
              <tbody>
                {detail.recentJobs.map((j) => (
                  <tr key={j.id} className="border-t border-gray-700/30">
                    <td className="whitespace-nowrap py-1.5 text-gray-400">{timeAgo(j.createdAt)}</td>
                    <td className="py-1.5">{j.toolType}</td>
                    <td className={`py-1.5 ${STATUS_COLORS[j.status] ?? ""}`}>{j.status}</td>
                    <td className="max-w-[160px] truncate py-1.5" title={j.inputFilename}>{j.inputFilename}</td>
                  </tr>
                ))}
                {detail.recentJobs.length === 0 && (
                  <tr><td colSpan={4} className="py-4 text-center text-gray-500">No jobs.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search by email or name…"
        className="w-full max-w-sm rounded-lg border border-gray-700 bg-[#1f2534] px-3 py-2 text-sm text-white outline-none focus:border-[#f7433d]"
      />
      <div className="overflow-x-auto rounded-xl bg-[#1f2534]">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="text-xs uppercase tracking-wide text-gray-500">
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Plan</th>
              <th className="px-4 py-3">Credits</th>
              <th className="px-4 py-3">Documents</th>
              <th className="px-4 py-3">Data generated</th>
              <th className="px-4 py-3">Last active</th>
              <th className="px-4 py-3">Joined</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => (
              <tr
                key={c.id}
                onClick={() => open(c.id)}
                className="cursor-pointer border-t border-gray-700/30 text-gray-300 hover:bg-white/5"
              >
                <td className="px-4 py-2.5">
                  <p className="font-medium text-white">{c.name || "—"}</p>
                  <p className="text-xs text-gray-500">{c.email}</p>
                </td>
                <td className="px-4 py-2.5 capitalize">{c.plan}</td>
                <td className="px-4 py-2.5">{c.credits}</td>
                <td className="px-4 py-2.5">{c.completedJobs} <span className="text-xs text-gray-500">/ {c.totalJobs}</span></td>
                <td className="whitespace-nowrap px-4 py-2.5">{formatBytes(c.outputBytes)}</td>
                <td className="whitespace-nowrap px-4 py-2.5 text-gray-400">{timeAgo(c.lastActiveAt)}</td>
                <td className="whitespace-nowrap px-4 py-2.5 text-gray-400">{new Date(c.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500">No customers found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------

const TABS: { id: Tab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "live", label: "Live traffic" },
  { id: "tools", label: "Tools" },
  { id: "customers", label: "Customers" },
];

export function AdminPage() {
  useSeo({ title: "Admin", noindex: true });
  const [authed, setAuthed] = useState(() => !!getToken());
  const [tab, setTab] = useState<Tab>("overview");
  const [range, setRange] = useState<Range>("7d");

  if (!authed) return <AdminLogin onLoggedIn={() => setAuthed(true)} />;

  return (
    <div className="min-h-screen bg-[#171c28] px-4 py-6 md:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-white">PDF Genius — Admin</h1>
            <p className="text-sm text-gray-500">Private dashboard</p>
          </div>
          <button
            onClick={() => {
              localStorage.removeItem(TOKEN_KEY);
              setAuthed(false);
            }}
            className="rounded-lg bg-white/5 px-3 py-1.5 text-sm text-gray-300 hover:bg-white/10"
          >
            Sign out
          </button>
        </div>

        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-1 rounded-xl bg-[#1f2534] p-1">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`rounded-lg px-3.5 py-1.5 text-sm font-medium ${
                  tab === t.id ? "bg-[#f7433d] text-white" : "text-gray-400 hover:text-white"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          {(tab === "overview" || tab === "tools") && (
            <div className="flex gap-1 rounded-xl bg-[#1f2534] p-1">
              {RANGES.map((r) => (
                <button
                  key={r.id}
                  onClick={() => setRange(r.id)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
                    range === r.id ? "bg-white/10 text-white" : "text-gray-400 hover:text-white"
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {tab === "overview" && <OverviewTab range={range} />}
        {tab === "live" && <LiveTab />}
        {tab === "tools" && <ToolsTab range={range} />}
        {tab === "customers" && <CustomersTab />}
      </div>
    </div>
  );
}
