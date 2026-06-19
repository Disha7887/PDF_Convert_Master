import { Feather } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import AppHeader from "@/components/AppHeader";
import { Badge, Button, ScreenScroll } from "@/components/ui";
import colors from "@/constants/colors";
import { ROUTES } from "@/constants/routes";
import { cardShadow, fonts, heroShadow } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import type { DashboardStats, Job, UsageStats } from "@/mocks/data";
import { mockApi } from "@/mocks/mockApi";

const C = colors.light;
type FeatherName = keyof typeof Feather.glyphMap;

const NAV_LINKS: { label: string; sublabel: string; icon: FeatherName; route: string }[] = [
  { label: "Total Usage", sublabel: "Usage statistics", icon: "bar-chart-2", route: ROUTES.usage },
  { label: "API Setup", sublabel: "Integration guides", icon: "settings", route: ROUTES.apiSetup },
  { label: "API Reference", sublabel: "Documentation", icon: "book", route: ROUTES.apiReference },
  { label: "View Plans", sublabel: "Pricing and upgrades", icon: "git-branch", route: ROUTES.managePlans },
  { label: "Live Tools", sublabel: "PDF conversion tools", icon: "tool", route: ROUTES.liveTools },
];

function formatBytes(bytes: number): string {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

function formatWhen(value: string | null): string {
  if (!value) return "";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function jobVisual(status: Job["status"]): {
  icon: FeatherName;
  bg: string;
  fg: string;
  tone: "success" | "danger" | "primary";
} {
  if (status === "completed") return { icon: "check", bg: "#dcfce7", fg: "#166534", tone: "success" };
  if (status === "failed") return { icon: "x", bg: "#fee2e2", fg: "#991b1b", tone: "danger" };
  return { icon: "refresh-cw", bg: C.blue50, fg: C.primary, tone: "primary" };
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
  subtitle?: string;
  icon: FeatherName;
  iconTone?: "blue" | "green";
}) {
  const bg = iconTone === "green" ? "#dcfce7" : C.blue50;
  const fg = iconTone === "green" ? "#16a34a" : C.primary;
  return (
    <View style={[styles.statCard, cardShadow]}>
      <View style={[styles.statIcon, { backgroundColor: bg }]}>
        <Feather name={icon} size={18} color={fg} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statTitle}>{title}</Text>
      {subtitle ? <Text style={styles.statSub}>{subtitle}</Text> : null}
    </View>
  );
}

function ActivityRow({ job }: { job: Job }) {
  const v = jobVisual(job.status);
  return (
    <View style={styles.activityRow}>
      <View style={[styles.activityIcon, { backgroundColor: v.bg }]}>
        <Feather name={v.icon} size={16} color={v.fg} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.activityTitle} numberOfLines={1}>
          {job.toolTitle}
        </Text>
        <Text style={styles.activityDesc} numberOfLines={1}>
          {job.fileName}
        </Text>
      </View>
      <View style={{ alignItems: "flex-end", gap: 6 }}>
        <Text style={styles.activityTime}>{formatWhen(job.createdAt)}</Text>
        <Badge label={job.status} tone={v.tone} />
      </View>
    </View>
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
      <Text style={styles.gateText}>Sign in to view your dashboard, usage and API keys.</Text>
      <Button label="Sign In" icon="log-in" onPress={() => router.push(ROUTES.signIn as never)} />
    </View>
  );
}

export default function DashboardScreen() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  const go = (r: string) => router.push(r as never);

  const { data: stats } = useQuery<DashboardStats>({
    queryKey: ["dashboard-stats"],
    queryFn: () => mockApi.getDashboardStats(),
    enabled: isAuthenticated,
  });
  const { data: usage } = useQuery<UsageStats>({
    queryKey: ["usage-stats"],
    queryFn: () => mockApi.getUsageStats(),
    enabled: isAuthenticated,
  });

  const displayName = user?.email ? user.email.split("@")[0] : "there";
  const today = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const mostUsed = (usage?.byTool ?? []).slice(0, 6);
  const recent = stats?.recentJobs ?? [];

  return (
    <ScreenScroll insetTop tabBar>
      <AppHeader subtitle="Dashboard" />

      {!isAuthenticated ? (
        <SignInGate />
      ) : (
        <>
          {/* Welcome */}
          <LinearGradient
            colors={[C.blue600, C.blue700] as const}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.hero, heroShadow]}
          >
            <Text style={styles.heroTitle}>Welcome back, {displayName}!</Text>
            <Text style={styles.heroSub}>
              Ready to convert your PDFs? You're on the {user?.plan ?? "Free"} plan.
            </Text>
            <Text style={styles.heroDate}>{today}</Text>
            <View style={styles.heroActions}>
              <Pressable
                style={({ pressed }) => [styles.heroBtn, { opacity: pressed ? 0.85 : 1 }]}
                onPress={() => go(ROUTES.liveTools)}
              >
                <Text style={styles.heroBtnText}>Upload New PDF</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [styles.heroBtn, { opacity: pressed ? 0.85 : 1 }]}
                onPress={() => go(ROUTES.tools)}
              >
                <Text style={styles.heroBtnText}>View All Tools</Text>
              </Pressable>
            </View>
          </LinearGradient>

          {/* Stats */}
          <View style={styles.statsGrid}>
            <StatCard
              title="Files Converted"
              value={(stats?.totalConversions ?? 0).toLocaleString()}
              subtitle={`${(stats?.conversionsThisMonth ?? 0).toLocaleString()} this month`}
              icon="file-text"
            />
            <StatCard
              title="API Calls"
              value={(stats?.apiCalls ?? 0).toLocaleString()}
              subtitle="All-time"
              icon="activity"
            />
            <StatCard
              title="Data Processed"
              value={formatBytes((stats?.storageUsedMB ?? 0) * 1024 * 1024)}
              subtitle="Total output size"
              icon="download"
            />
            <StatCard
              title="Active API Keys"
              value={(stats?.activeApiKeys ?? 0).toLocaleString()}
              subtitle={`${stats?.successRate ?? 0}% success rate`}
              icon="link"
              iconTone="green"
            />
          </View>

          {/* Workspace nav */}
          <Text style={styles.sectionLabel}>Workspace</Text>
          <View style={[styles.group, cardShadow]}>
            {NAV_LINKS.map((row, i) => (
              <Pressable
                key={row.label}
                onPress={() => go(row.route)}
                style={({ pressed }) => [
                  styles.linkRow,
                  i > 0 && styles.linkDivider,
                  { backgroundColor: pressed ? C.muted : "transparent" },
                ]}
              >
                <View style={styles.linkIcon}>
                  <Feather name={row.icon} size={18} color={C.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.linkLabel}>{row.label}</Text>
                  <Text style={styles.linkSub}>{row.sublabel}</Text>
                </View>
                <Feather name="chevron-right" size={18} color={C.mutedForeground} />
              </Pressable>
            ))}
          </View>

          {/* Most Used Tools */}
          <View style={[styles.cardBlock, cardShadow]}>
            <View style={styles.cardHead}>
              <Text style={styles.cardTitle}>Most Used Tools</Text>
              <Button
                label="View All Tools"
                variant="outline"
                size="sm"
                onPress={() => go(ROUTES.tools)}
              />
            </View>
            {mostUsed.length === 0 ? (
              <Text style={styles.empty}>
                No conversions yet. Start converting to see your most-used tools here.
              </Text>
            ) : (
              <View style={styles.toolGrid}>
                {mostUsed.map((tool) => (
                  <View key={tool.toolId} style={styles.toolCell}>
                    <View style={styles.toolIcon}>
                      <Feather name="file-text" size={18} color={C.primary} />
                    </View>
                    <Text style={styles.toolName} numberOfLines={2}>
                      {tool.toolTitle}
                    </Text>
                    <Text style={styles.toolCount}>
                      {tool.count} {tool.count === 1 ? "use" : "uses"}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Recent Activity */}
          <View style={[styles.cardBlock, cardShadow]}>
            <View style={styles.cardHead}>
              <Text style={styles.cardTitle}>Recent Activity</Text>
              <Button
                label="View Full History"
                variant="outline"
                size="sm"
                onPress={() => go(ROUTES.usage)}
              />
            </View>
            {recent.length === 0 ? (
              <Text style={styles.empty}>No recent activity yet.</Text>
            ) : (
              recent.map((job) => <ActivityRow key={job.id} job={job} />)
            )}
          </View>
        </>
      )}
    </ScreenScroll>
  );
}

const styles = StyleSheet.create({
  hero: { borderRadius: 20, padding: 22, marginBottom: 22, overflow: "hidden" },
  heroTitle: { fontSize: 24, color: "#fff", fontFamily: fonts.headingBold },
  heroSub: { fontSize: 15, lineHeight: 21, color: "#dbeafe", fontFamily: fonts.body, marginTop: 8 },
  heroDate: { fontSize: 12, color: "#bfdbfe", fontFamily: fonts.body, marginTop: 6 },
  heroActions: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 18 },
  heroBtn: {
    backgroundColor: "rgba(255,255,255,0.18)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.35)",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 11,
  },
  heroBtnText: { color: "#fff", fontFamily: fonts.bodySemibold, fontSize: 14 },

  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 22 },
  statCard: {
    width: "48%",
    backgroundColor: C.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    padding: 16,
    gap: 4,
  },
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

  sectionLabel: {
    fontSize: 13,
    letterSpacing: 0.5,
    textTransform: "uppercase",
    color: C.foreground,
    fontFamily: fonts.headingSemibold,
    marginBottom: 10,
  },
  group: {
    backgroundColor: C.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    overflow: "hidden",
    marginBottom: 22,
  },
  linkRow: { flexDirection: "row", alignItems: "center", gap: 14, paddingHorizontal: 14, paddingVertical: 13 },
  linkDivider: { borderTopWidth: 1, borderTopColor: C.border },
  linkIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: C.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  linkLabel: { fontSize: 15, color: C.foreground, fontFamily: fonts.bodyMedium },
  linkSub: { fontSize: 12, color: C.mutedForeground, fontFamily: fonts.body, marginTop: 1 },

  cardBlock: {
    backgroundColor: C.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    padding: 16,
    marginBottom: 18,
  },
  cardHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    flexWrap: "wrap",
    marginBottom: 14,
  },
  cardTitle: { fontSize: 17, color: C.foreground, fontFamily: fonts.headingBold },
  empty: { fontSize: 13, color: C.mutedForeground, fontFamily: fonts.body, textAlign: "center", paddingVertical: 24 },

  toolGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  toolCell: {
    width: "48%",
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
    gap: 6,
  },
  toolIcon: {
    width: 40,
    height: 40,
    borderRadius: 11,
    backgroundColor: C.blue50,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
  toolName: { fontSize: 13, color: C.foreground, fontFamily: fonts.bodySemibold, textAlign: "center" },
  toolCount: { fontSize: 12, color: C.mutedForeground, fontFamily: fonts.body },

  activityRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 10 },
  activityIcon: { width: 38, height: 38, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  activityTitle: { fontSize: 14, color: C.foreground, fontFamily: fonts.bodyMedium },
  activityDesc: { fontSize: 12.5, color: C.mutedForeground, fontFamily: fonts.body, marginTop: 1 },
  activityTime: { fontSize: 11, color: C.mutedForeground, fontFamily: fonts.body },

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
