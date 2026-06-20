import { Feather } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { Button, Card, ScreenScroll } from "@/components/ui";
import { API_BASE_URL } from "@/constants/api";
import colors from "@/constants/colors";
import { USE_MOCK_DATA } from "@/constants/config";
import { ROUTES } from "@/constants/routes";
import { fonts } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import { API_KEYS, type UsageStats } from "@/mocks/data";
import { mockApi } from "@/mocks/mockApi";

const C = colors.light;
type FeatherName = keyof typeof Feather.glyphMap;

const CHART_COLORS = [C.chart1, C.chart2, C.chart3, C.chart4, C.chart5];
const chartColor = (i: number) => CHART_COLORS[i % CHART_COLORS.length];
const DAILY_CHART_HEIGHT = 140;

function formatBytes(bytes: number): string {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

function timeAgo(value: string | null): string {
  if (!value) return "";
  const d = new Date(value).getTime();
  if (Number.isNaN(d)) return "";
  const mins = Math.floor((Date.now() - d) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function StatCard({
  title,
  value,
  subtitle,
  icon,
  iconTone = "blue",
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: FeatherName;
  iconTone?: "blue" | "green";
}) {
  const bg = iconTone === "green" ? "#dcfce7" : C.blue50;
  const fg = iconTone === "green" ? "#16a34a" : C.primary;
  return (
    <Card style={styles.statCard}>
      <View style={[styles.statIcon, { backgroundColor: bg }]}>
        <Feather name={icon} size={18} color={fg} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statTitle}>{title}</Text>
      {subtitle ? <Text style={styles.statSub}>{subtitle}</Text> : null}
    </Card>
  );
}

function SignInGate() {
  const router = useRouter();
  return (
    <View style={styles.gate}>
      <View style={styles.gateIcon}>
        <Feather name="lock" size={28} color={C.primary} />
      </View>
      <Text style={styles.gateTitle}>Sign in required</Text>
      <Text style={styles.gateText}>Sign in to view your usage statistics.</Text>
      <Button label="Sign In" icon="log-in" onPress={() => router.push(ROUTES.signIn as never)} style={{ alignSelf: "center" }} />
    </View>
  );
}

interface RecentJob {
  id: number;
  toolType: string;
  toolName: string;
  inputFilename: string;
  status: string;
  source: string;
  createdAt: string | null;
}

interface RealUsageData extends UsageStats {
  activeKeys: number;
  recent: RecentJob[];
}

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function dayLabel(dateKey: string): string {
  const parsed = new Date(`${dateKey}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return dateKey;
  return WEEKDAY_LABELS[parsed.getDay()] ?? dateKey;
}

async function fetchRealUsage(token: string): Promise<RealUsageData> {
  const res = await fetch(`${API_BASE_URL}/usage`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Failed to fetch usage (${res.status})`);
  const payload = await res.json();
  const d = payload.data;
  const t = d.totals;
  return {
    totalConversions: t.total,
    conversionsThisMonth: 0,
    conversionsToday: 0,
    apiCalls: t.apiCalls,
    successRate: t.successRate,
    avgProcessingTimeSec: 0,
    storageUsedMB: t.dataProcessed / (1024 * 1024),
    storageLimitMB: 0,
    byTool: (d.mostUsed as { type: string; name: string; count: number }[]).map((m) => ({
      toolId: m.type,
      toolTitle: m.name,
      count: m.count,
    })),
    byDay: ((d.byDay ?? []) as { date: string; count: number }[])
      .slice(-7)
      .map((day) => ({ date: dayLabel(day.date), count: day.count })),
    byCategory: [],
    activeKeys: t.activeKeys,
    recent: d.recent as RecentJob[],
  };
}

const STATUS_COLOR: Record<string, string> = {
  completed: "#16a34a",
  failed: "#dc2626",
  processing: "#d97706",
  pending: "#6b7280",
};

export default function UsageScreen() {
  const { isAuthenticated, token } = useAuth();

  const { data: usage } = useQuery<RealUsageData>({
    queryKey: USE_MOCK_DATA ? ["usage-stats"] : ["usage-stats-real", token],
    queryFn: USE_MOCK_DATA
      ? async () => {
          const stats = await mockApi.getUsageStats();
          return { ...stats, activeKeys: API_KEYS.filter((k) => k.status === "active").length, recent: [] };
        }
      : () => fetchRealUsage(token!),
    enabled: isAuthenticated && (USE_MOCK_DATA || !!token),
  });

  if (!isAuthenticated) {
    return (
      <ScreenScroll>
        <SignInGate />
      </ScreenScroll>
    );
  }

  const byDay = usage?.byDay ?? [];
  const byTool = usage?.byTool ?? [];
  const byCategory = usage?.byCategory ?? [];
  const recent = usage?.recent ?? [];
  const maxDay = Math.max(1, ...byDay.map((d) => d.count));
  const maxTool = Math.max(1, ...byTool.map((t) => t.count));
  const maxCategory = Math.max(1, ...byCategory.map((c) => c.count));

  return (
    <ScreenScroll>
      <Text style={styles.h1}>Usage Statistics</Text>

      {/* Summary stats */}
      <View style={styles.statsGrid}>
        <StatCard
          title="Files Converted"
          value={(usage?.totalConversions ?? 0).toLocaleString()}
          subtitle={
            USE_MOCK_DATA
              ? `${(usage?.conversionsThisMonth ?? 0).toLocaleString()} this month`
              : `${usage?.apiCalls ?? 0} via API · ${(usage?.totalConversions ?? 0) - (usage?.apiCalls ?? 0)} via web`
          }
          icon="file-text"
        />
        <StatCard
          title="API Calls"
          value={(usage?.apiCalls ?? 0).toLocaleString()}
          subtitle="All-time"
          icon="activity"
        />
        <StatCard
          title="Data Processed"
          value={formatBytes((usage?.storageUsedMB ?? 0) * 1024 * 1024)}
          subtitle="Total output size"
          icon="download"
        />
        <StatCard
          title="Success Rate"
          value={`${usage?.successRate ?? 0}%`}
          subtitle={`${usage?.activeKeys ?? 0} active API keys`}
          icon="check"
          iconTone="green"
        />
      </View>

      {/* Daily usage bar chart — only shown when backend returns per-day data (mock mode) */}
      {byDay.length > 0 && (
        <Card style={styles.section}>
          <Text style={styles.cardTitle}>Daily Usage</Text>
          <Text style={styles.cardSub}>Conversions over the last 7 days</Text>
          <View style={styles.chartRow}>
            {byDay.map((day, i) => {
              const h = Math.round((day.count / maxDay) * DAILY_CHART_HEIGHT);
              return (
                <View key={day.date} style={styles.chartCol}>
                  <Text style={styles.chartValue}>{day.count}</Text>
                  <View style={[styles.chartBar, { height: Math.max(h, 4), backgroundColor: chartColor(i) }]} />
                  <Text style={styles.chartLabel}>{day.date}</Text>
                </View>
              );
            })}
          </View>
        </Card>
      )}

      {/* Most used tools */}
      <Card style={styles.section}>
        <Text style={styles.cardTitle}>Most Used Tools</Text>
        {byTool.length === 0 ? (
          <Text style={styles.empty}>No conversions recorded yet.</Text>
        ) : (
          <View style={styles.barList}>
            {byTool.map((tool, i) => (
              <View key={tool.toolId} style={styles.barItem}>
                <View style={styles.barLabelRow}>
                  <Text style={styles.barName} numberOfLines={1}>{tool.toolTitle}</Text>
                  <Text style={styles.barCount}>{tool.count} {tool.count === 1 ? "use" : "uses"}</Text>
                </View>
                <View style={styles.track}>
                  <View
                    style={[styles.fill, { width: `${Math.round((tool.count / maxTool) * 100)}%`, backgroundColor: chartColor(i) }]}
                  />
                </View>
              </View>
            ))}
          </View>
        )}
      </Card>

      {/* Usage by category — only shown when backend returns category data (mock mode) */}
      {byCategory.length > 0 && (
        <Card style={styles.section}>
          <Text style={styles.cardTitle}>Usage by Category</Text>
          <View style={styles.barList}>
            {byCategory.map((cat, i) => (
              <View key={cat.category} style={styles.barItem}>
                <View style={styles.barLabelRow}>
                  <Text style={styles.barName} numberOfLines={1}>{cat.category}</Text>
                  <Text style={styles.barCount}>{cat.count} {cat.count === 1 ? "use" : "uses"}</Text>
                </View>
                <View style={styles.track}>
                  <View
                    style={[styles.fill, { width: `${Math.round((cat.count / maxCategory) * 100)}%`, backgroundColor: chartColor(i) }]}
                  />
                </View>
              </View>
            ))}
          </View>
        </Card>
      )}

      {/* Recent conversions */}
      <Card style={styles.section}>
        <Text style={styles.cardTitle}>Recent Conversions</Text>
        {recent.length === 0 ? (
          <Text style={styles.empty}>No conversions recorded yet.</Text>
        ) : (
          <View style={styles.recentList}>
            {recent.map((job) => (
              <View key={job.id} style={styles.recentRow}>
                <View style={styles.recentLeft}>
                  <Text style={styles.recentTool} numberOfLines={1}>{job.toolName}</Text>
                  <Text style={styles.recentFile} numberOfLines={1}>{job.inputFilename}</Text>
                </View>
                <View style={styles.recentRight}>
                  <Text style={[styles.recentStatus, { color: STATUS_COLOR[job.status] ?? "#6b7280" }]}>
                    {job.status}
                  </Text>
                  <Text style={styles.recentTime}>{timeAgo(job.createdAt)}</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </Card>
    </ScreenScroll>
  );
}

const styles = StyleSheet.create({
  h1: { fontSize: 24, color: C.foreground, fontFamily: fonts.headingBold, marginBottom: 18 },

  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 18 },
  statCard: { width: "48%", gap: 4 },
  statIcon: {
    width: 38,
    height: 38,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  statValue: { fontSize: 22, color: C.foreground, fontFamily: fonts.headingBold },
  statTitle: { fontSize: 13, color: C.foreground, fontFamily: fonts.bodyMedium },
  statSub: { fontSize: 12, color: C.mutedForeground, fontFamily: fonts.body },

  section: { marginBottom: 18 },
  cardTitle: { fontSize: 17, color: C.foreground, fontFamily: fonts.headingBold },
  cardSub: { fontSize: 13, color: C.mutedForeground, fontFamily: fonts.body, marginTop: 2 },
  empty: {
    fontSize: 13,
    color: C.mutedForeground,
    fontFamily: fonts.body,
    textAlign: "center",
    paddingVertical: 24,
  },

  chartRow: { flexDirection: "row", alignItems: "flex-end", gap: 8, marginTop: 18 },
  chartCol: { flex: 1, alignItems: "center", justifyContent: "flex-end", gap: 6 },
  chartValue: { fontSize: 11, color: C.mutedForeground, fontFamily: fonts.bodyMedium },
  chartBar: { width: "70%", borderRadius: 6 },
  chartLabel: { fontSize: 11, color: C.mutedForeground, fontFamily: fonts.body },

  barList: { gap: 14, marginTop: 16 },
  barItem: { gap: 6 },
  barLabelRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
  barName: { flex: 1, fontSize: 14, color: C.foreground, fontFamily: fonts.bodyMedium },
  barCount: { fontSize: 13, color: C.mutedForeground, fontFamily: fonts.body },
  track: { height: 8, borderRadius: 999, backgroundColor: C.muted, overflow: "hidden" },
  fill: { height: 8, borderRadius: 999 },

  recentList: { gap: 12, marginTop: 14 },
  recentRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: C.border,
  },
  recentLeft: { flex: 1, gap: 2 },
  recentTool: { fontSize: 14, color: C.foreground, fontFamily: fonts.bodyMedium },
  recentFile: { fontSize: 12, color: C.mutedForeground, fontFamily: fonts.body },
  recentRight: { alignItems: "flex-end", gap: 2 },
  recentStatus: { fontSize: 12, fontFamily: fonts.bodyMedium, textTransform: "capitalize" },
  recentTime: { fontSize: 11, color: C.mutedForeground, fontFamily: fonts.body },

  gate: { alignItems: "center", paddingVertical: 60, gap: 12 },
  gateIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: C.accent,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  gateTitle: { fontSize: 18, color: C.foreground, fontFamily: fonts.headingBold },
  gateText: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
    color: C.mutedForeground,
    fontFamily: fonts.body,
    paddingHorizontal: 20,
    marginBottom: 8,
  },
});
