import { Feather } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";

import { Loader } from "@/components/Loader";
import ToolLottieIcon from "@/components/ToolLottieIcon";
import { Badge, Button, Card, ScreenScroll } from "@/components/ui";
import { API_ORIGIN } from "@/constants/api";
import colors from "@/constants/colors";
import { ROUTES } from "@/constants/routes";
import { cardShadow, fonts } from "@/constants/theme";
import { getToolByServerType } from "@/constants/tools";
import { useAuth } from "@/contexts/AuthContext";
import { fetchUsage, type AccountUsage, type UsageRecentJob } from "@/services/account";
import { downloadAndSave } from "@/services/files";

const C = colors.light;
type FeatherName = keyof typeof Feather.glyphMap;

const NAV_ROWS: { label: string; sublabel: string; icon: FeatherName; route: string }[] = [
  { label: "Usage Statistics", sublabel: "Conversions, API calls & data", icon: "bar-chart-2", route: ROUTES.usage },
  { label: "Conversion History", sublabel: "Your recent conversions", icon: "clock", route: ROUTES.history },
  { label: "API Setup", sublabel: "Create and manage API keys", icon: "key", route: ROUTES.apiSetup },
  { label: "API Reference", sublabel: "Endpoints & examples", icon: "code", route: ROUTES.apiReference },
  { label: "Manage Plans", sublabel: "Upgrade or change your plan", icon: "credit-card", route: ROUTES.managePlans },
  { label: "Live Tools", sublabel: "Try tools instantly", icon: "zap", route: ROUTES.liveTools },
];

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
  if (mins < 60) return `${mins} minute${mins === 1 ? "" : "s"} ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs === 1 ? "" : "s"} ago`;
  const days = Math.floor(hrs / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

function StatCard({
  title,
  value,
  subtitle,
  icon,
  iconTone = "primary",
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: FeatherName;
  iconTone?: "primary" | "green";
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

function statusMeta(status: string): { icon: FeatherName; bg: string; fg: string; tone: "success" | "danger" | "warning" } {
  if (status === "failed") return { icon: "x", bg: "#fee2e2", fg: "#dc2626", tone: "danger" };
  if (status === "completed") return { icon: "check", bg: "#dcfce7", fg: "#16a34a", tone: "success" };
  return { icon: "refresh-cw", bg: C.blue50, fg: C.primary, tone: "warning" };
}

function SignInGate() {
  const router = useRouter();
  return (
    <View style={styles.gate}>
      <View style={styles.gateIcon}>
        <Feather name="lock" size={28} color={C.primary} />
      </View>
      <Text style={styles.gateTitle}>Sign in required</Text>
      <Text style={styles.gateText}>Sign in to view your workspace dashboard.</Text>
      <Button label="Sign In" icon="log-in" onPress={() => router.push(ROUTES.signIn as never)} style={{ alignSelf: "center" }} />
    </View>
  );
}

export default function WorkspaceScreen() {
  const router = useRouter();
  const { user, isAuthenticated, token } = useAuth();
  const go = (r: string) => router.push(r as never);
  const [downloadingId, setDownloadingId] = React.useState<number | null>(null);

  // Re-download a past conversion straight from Recent Activity. The bytes are
  // fetched fresh from the backend's durable storage, so this works anytime —
  // not just immediately after the file was converted.
  const handleDownload = async (job: UsageRecentJob) => {
    if (downloadingId !== null) return;
    const name =
      job.outputFilename || `${job.toolName.replace(/\s+/g, "-").toLowerCase()}-${job.id}`;
    setDownloadingId(job.id);
    try {
      const res = await downloadAndSave(`${API_ORIGIN}/api/download/${job.id}`, name);
      if (res.status === "saved") {
        Alert.alert("Downloaded", `${name} was saved to ${res.location}.`);
      } else if (res.status === "failed") {
        Alert.alert("Download failed", "We couldn't download this file. Please try again.");
      }
    } catch (err) {
      const status = (err as { status?: number } | null)?.status;
      if (status === 401 || status === 403) {
        Alert.alert("Sign in required", "Please log in to download this file.");
      } else if (status === 404) {
        Alert.alert(
          "File unavailable",
          "This file is no longer available to download. Please convert it again.",
        );
      } else {
        Alert.alert("Download failed", "We couldn't download this file. Please try again.");
      }
    } finally {
      setDownloadingId(null);
    }
  };

  const { data: usage } = useQuery<AccountUsage>({
    queryKey: ["account-usage", token],
    queryFn: () => fetchUsage(token!),
    enabled: isAuthenticated && !!token,
    refetchInterval: 5000,
    refetchOnWindowFocus: true,
  });

  if (!isAuthenticated) {
    return (
      <ScreenScroll>
        <SignInGate />
      </ScreenScroll>
    );
  }

  const displayName = user?.name?.split(" ")[0] || user?.email?.split("@")[0] || "there";
  const today = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const totals = usage?.totals;
  const thisMonthPrefix = new Date().toISOString().slice(0, 7); // "YYYY-MM"
  const conversionsThisMonth = (usage?.byDay ?? [])
    .filter((d) => d.date.startsWith(thisMonthPrefix))
    .reduce((sum, d) => sum + d.count, 0);
  const byTool = (usage?.mostUsed ?? []).slice(0, 6);
  const recent = usage?.recent ?? [];

  return (
    <ScreenScroll>
      {/* Welcome header */}
      <LinearGradient
        colors={["#f7433d", "#fb5d52"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.hero, cardShadow]}
      >
        <Text style={styles.heroTitle}>Welcome back, {displayName}!</Text>
        <Text style={styles.heroSub}>
          Ready to convert your PDFs? You&apos;re on the {user?.plan ?? "Free"} plan.
        </Text>
        <Text style={styles.heroDate}>{today}</Text>
        <View style={styles.heroBtns}>
          <Pressable style={styles.heroBtn} onPress={() => go(ROUTES.liveTools)}>
            <Feather name="upload" size={15} color="#ffffff" />
            <Text style={styles.heroBtnText}>Upload New PDF</Text>
          </Pressable>
          <Pressable style={styles.heroBtn} onPress={() => go(ROUTES.tools)}>
            <Feather name="grid" size={15} color="#ffffff" />
            <Text style={styles.heroBtnText}>View All Tools</Text>
          </Pressable>
        </View>
      </LinearGradient>

      {/* Stat cards */}
      <View style={styles.statsGrid}>
        <StatCard
          title="Files Converted"
          value={(totals?.total ?? 0).toLocaleString()}
          subtitle={`${conversionsThisMonth.toLocaleString()} this month`}
          icon="file-text"
        />
        <StatCard
          title="API Calls"
          value={(totals?.apiCalls ?? 0).toLocaleString()}
          subtitle="All-time"
          icon="activity"
        />
        <StatCard
          title="Data Processed"
          value={formatBytes(totals?.dataProcessed ?? 0)}
          subtitle="Total output size"
          icon="download"
        />
        <StatCard
          title="Active API Keys"
          value={(totals?.activeKeys ?? 0).toLocaleString()}
          subtitle={`${totals?.successRate ?? 0}% success rate`}
          icon="key"
          iconTone="green"
        />
      </View>

      {/* Most used tools */}
      <Card style={styles.section}>
        <View style={styles.sectionHead}>
          <Text style={styles.cardTitle}>Most Used Tools</Text>
          <Pressable onPress={() => go(ROUTES.tools)} hitSlop={8}>
            <Text style={styles.link}>View all</Text>
          </Pressable>
        </View>
        {byTool.length === 0 ? (
          <Text style={styles.empty}>No conversions yet. Start converting to see your most-used tools here.</Text>
        ) : (
          <View style={styles.toolGrid}>
            {byTool.map((t) => {
              const tool = getToolByServerType(t.type);
              return (
                <Pressable
                  key={t.type}
                  style={styles.toolCell}
                  onPress={() => (tool ? go(ROUTES.convert(tool.id)) : go(ROUTES.tools))}
                >
                  <View style={styles.toolIcon}>
                    <Feather name={tool?.feather ?? "file-text"} size={18} color={C.primary} />
                  </View>
                  <Text style={styles.toolName} numberOfLines={2}>
                    {tool?.title ?? t.name}
                  </Text>
                  <Text style={styles.toolCount}>
                    {t.count} {t.count === 1 ? "use" : "uses"}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        )}
      </Card>

      {/* Recent activity */}
      <Card style={styles.section}>
        <View style={styles.sectionHead}>
          <Text style={styles.cardTitle}>Recent Activity</Text>
          <Pressable onPress={() => go(ROUTES.history)} hitSlop={8}>
            <Text style={styles.link}>Full history</Text>
          </Pressable>
        </View>
        {recent.length === 0 ? (
          <Text style={styles.empty}>No recent activity yet.</Text>
        ) : (
          <View style={styles.activityList}>
            {recent.slice(0, 5).map((job) => {
              const m = statusMeta(job.status);
              const tool = getToolByServerType(job.toolType);
              const canDownload = job.status === "completed";
              const isDownloading = downloadingId === job.id;
              return (
                <Pressable
                  key={job.id}
                  style={styles.activityRow}
                  disabled={!canDownload || downloadingId !== null}
                  onPress={() => handleDownload(job)}
                >
                  {/* Same animated tool identity icon used on the All Tools page,
                      so each row reads at a glance as the tool that produced it
                      (status is shown by the badge on the right). */}
                  <View style={[styles.activityIcon, { backgroundColor: C.accent }]}>
                    {tool ? (
                      <ToolLottieIcon toolId={tool.id} size={28} />
                    ) : (
                      <Feather name={m.icon} size={16} color={C.primary} />
                    )}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.activityTitle} numberOfLines={1}>
                      {job.outputFilename || job.inputFilename}
                    </Text>
                    <Text style={styles.activitySub} numberOfLines={1}>
                      {timeAgo(job.createdAt)}
                    </Text>
                  </View>
                  <View style={styles.activityRight}>
                    <Badge
                      label={job.status === "completed" ? (tool?.outputFormat ?? "File") : "Failed"}
                      tone={job.status === "completed" ? "primary" : "danger"}
                    />
                  </View>
                  {canDownload ? (
                    isDownloading ? (
                      <Loader size={22} style={styles.activityDownload} />
                    ) : (
                      <View style={styles.activityDownload}>
                        <Feather name="download" size={18} color={C.primary} />
                      </View>
                    )
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        )}
      </Card>

      {/* Quick actions */}
      <View style={styles.quickRow}>
        <Button label="Upload PDF" icon="upload" variant="outline" onPress={() => go(ROUTES.liveTools)} style={styles.quickBtn} />
        <Button label="Scan a Document" icon="camera" variant="outline" onPress={() => go(ROUTES.scanner)} style={styles.quickBtn} />
      </View>

      {/* Upgrade CTA */}
      <Card style={styles.upgrade}>
        <View style={styles.upgradeHead}>
          <Feather name="arrow-up-circle" size={18} color={C.primary} />
          <Text style={styles.upgradeTitle}>Upgrade Plan</Text>
        </View>
        <Text style={styles.upgradeText}>Get unlimited conversions and advanced features.</Text>
        <Button label="View Plans" icon="credit-card" onPress={() => go(ROUTES.managePlans)} style={{ alignSelf: "flex-start" }} />
      </Card>

      {/* Manage / navigation entry points */}
      <Text style={styles.manageHeading}>Manage</Text>
      <View style={[styles.group, cardShadow]}>
        {NAV_ROWS.map((row, i) => (
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
    </ScreenScroll>
  );
}

const styles = StyleSheet.create({
  hero: { borderRadius: 20, padding: 22, marginBottom: 18 },
  heroTitle: { fontSize: 22, color: "#ffffff", fontFamily: fonts.headingBold },
  heroSub: { fontSize: 14, color: "rgba(255,255,255,0.92)", fontFamily: fonts.body, marginTop: 6 },
  heroDate: { fontSize: 12, color: "rgba(255,255,255,0.8)", fontFamily: fonts.body, marginTop: 4 },
  heroBtns: { flexDirection: "row", gap: 10, marginTop: 16 },
  heroBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.35)",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  heroBtnText: { color: "#ffffff", fontSize: 13, fontFamily: fonts.bodyMedium },

  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 6 },
  statCard: { width: "47.5%", flexGrow: 1 },
  statIcon: { width: 38, height: 38, borderRadius: 11, alignItems: "center", justifyContent: "center", marginBottom: 10 },
  statValue: { fontSize: 22, color: C.foreground, fontFamily: fonts.headingBold },
  statTitle: { fontSize: 13, color: C.foreground, fontFamily: fonts.bodyMedium, marginTop: 2 },
  statSub: { fontSize: 12, color: C.mutedForeground, fontFamily: fonts.body, marginTop: 4 },

  section: { marginTop: 12 },
  sectionHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 },
  cardTitle: { fontSize: 17, color: C.foreground, fontFamily: fonts.headingSemibold },
  link: { fontSize: 13, color: C.primary, fontFamily: fonts.bodyMedium },
  empty: { fontSize: 13, color: C.mutedForeground, fontFamily: fonts.body, paddingVertical: 16, textAlign: "center" },

  toolGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  toolCell: {
    width: "30.5%",
    flexGrow: 1,
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 14,
    gap: 8,
  },
  toolIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: C.blue50, alignItems: "center", justifyContent: "center" },
  toolName: { fontSize: 12, color: C.foreground, fontFamily: fonts.bodyMedium, textAlign: "center" },
  toolCount: { fontSize: 11, color: C.mutedForeground, fontFamily: fonts.body },

  activityList: { gap: 4 },
  activityRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 8 },
  activityIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  activityTitle: { fontSize: 14, color: C.foreground, fontFamily: fonts.bodyMedium },
  activitySub: { fontSize: 12, color: C.mutedForeground, fontFamily: fonts.body, marginTop: 1 },
  activityRight: { alignItems: "flex-end", gap: 5 },
  activityDownload: { width: 28, alignItems: "center", justifyContent: "center" },
  activityTime: { fontSize: 11, color: C.mutedForeground, fontFamily: fonts.body },

  quickRow: { flexDirection: "row", gap: 12, marginTop: 14 },
  quickBtn: { flex: 1, justifyContent: "center" },

  upgrade: { marginTop: 14, borderColor: C.accent, backgroundColor: C.accent, gap: 10 },
  upgradeHead: { flexDirection: "row", alignItems: "center", gap: 8 },
  upgradeTitle: { fontSize: 15, color: C.accentForeground, fontFamily: fonts.headingSemibold },
  upgradeText: { fontSize: 13, color: C.accentForeground, fontFamily: fonts.body },

  manageHeading: { fontSize: 17, color: C.foreground, fontFamily: fonts.headingSemibold, marginTop: 22, marginBottom: 12 },
  group: { backgroundColor: C.card, borderRadius: 16, borderWidth: 1, borderColor: C.border, overflow: "hidden" },
  linkRow: { flexDirection: "row", alignItems: "center", gap: 14, paddingHorizontal: 14, paddingVertical: 14 },
  linkDivider: { borderTopWidth: 1, borderTopColor: C.border },
  linkIcon: { width: 38, height: 38, borderRadius: 11, backgroundColor: C.accent, alignItems: "center", justifyContent: "center" },
  linkLabel: { fontSize: 15, color: C.foreground, fontFamily: fonts.bodyMedium },
  linkSub: { fontSize: 12, color: C.mutedForeground, fontFamily: fonts.body, marginTop: 1 },

  gate: { alignItems: "center", paddingVertical: 60, paddingHorizontal: 20 },
  gateIcon: { width: 64, height: 64, borderRadius: 20, backgroundColor: C.accent, alignItems: "center", justifyContent: "center", marginBottom: 18 },
  gateTitle: { fontSize: 20, color: C.foreground, fontFamily: fonts.headingBold },
  gateText: { fontSize: 14, color: C.mutedForeground, fontFamily: fonts.body, marginTop: 8, marginBottom: 22, textAlign: "center" },
});
