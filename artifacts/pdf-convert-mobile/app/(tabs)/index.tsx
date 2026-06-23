import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";

import { SvgXml } from "react-native-svg";

import ToolLottieIcon from "@/components/ToolLottieIcon";
import { ScreenScroll } from "@/components/ui";
import colors from "@/constants/colors";
import { loadFiles, type StoredFileEntry, type StoredFileKind } from "@/constants/files";
import { ROUTES } from "@/constants/routes";
import { cardShadow, fonts, heroShadow } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";

const C = colors.light;
type FeatherName = keyof typeof Feather.glyphMap;

const CROWN_XML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#b2b1ff" d="M4.03027,16.24268l-2-8A1.00014,1.00014,0,0,1,3.457,7.11035l3.85156,1.979L11.1748,3.43555a1.03743,1.03743,0,0,1,1.6504,0l3.86621,5.65381,3.85156-1.979a1.00014,1.00014,0,0,1,1.42676,1.13233l-2,8Z"/><path fill="#6563ff" d="M19.96973,16.24268H4.03027L4,16.12158V20a.99974.99974,0,0,0,1,1H19a.99974.99974,0,0,0,1-1V16.12158Z"/><circle cx="12" cy="12" r="1" fill="#6563ff"/></svg>`;

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

function firstName(name?: string | null): string {
  if (!name) return "there";
  return name.trim().split(/\s+/)[0] || "there";
}

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days} ${days === 1 ? "day" : "days"} ago`;
  return new Date(ts).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

const KIND_ICON: Record<StoredFileKind, FeatherName> = {
  "scanned-image": "image",
  "converted-pdf": "file-text",
  "converted-file": "file",
};

interface QuickAction {
  key: string;
  label: string;
  icon: FeatherName;
  route: string;
}

const QUICK_ACTIONS: QuickAction[] = [
  { key: "scan", label: "Scan", icon: "camera", route: ROUTES.scanner },
  { key: "import", label: "Import", icon: "upload", route: ROUTES.convert("images-to-pdf") },
  { key: "sign", label: "Sign", icon: "edit-3", route: ROUTES.convert("sign-pdf") },
];

interface QuickTool {
  toolId: string;
  label: string;
}

const QUICK_TOOLS: QuickTool[] = [
  { toolId: "merge-pdfs", label: "Merge" },
  { toolId: "split-pdf", label: "Split" },
  { toolId: "compress-pdf", label: "Compress" },
  { toolId: "pdf-to-word", label: "Convert" },
];

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { width } = useWindowDimensions();
  const [recent, setRecent] = useState<StoredFileEntry[]>([]);

  const contentWidth = Math.min(width, 640);
  const toolColWidth = contentWidth < 360 ? "100%" : "48%";

  useFocusEffect(
    useCallback(() => {
      loadFiles().then((files) => setRecent(files.slice(0, 3)));
    }, []),
  );

  const showPremium = useMemo(
    () => !user || String(user.plan).toLowerCase() === "free",
    [user],
  );

  return (
    <ScreenScroll
      navInset
      tabBar
      contentStyle={{ width: "100%", maxWidth: 640, alignSelf: "center" }}
    >
      {/* Greeting — only when signed in (no placeholder for guests) */}
      {user && (
        <View style={styles.greetRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.greetHello}>{greeting()},</Text>
            <Text style={styles.greetName} numberOfLines={1}>
              {firstName(user.name)}
            </Text>
          </View>
        </View>
      )}

      {/* Search */}
      <Pressable
        style={({ pressed }) => [styles.search, pressed && styles.pressed]}
        onPress={() => router.push(ROUTES.tools as never)}
      >
        <Feather name="search" size={18} color={C.mutedForeground} />
        <Text style={styles.searchPlaceholder}>Search files & tools…</Text>
      </Pressable>

      {/* Premium upsell */}
      {showPremium && (
        <Pressable
          style={({ pressed }) => [styles.premiumWrap, heroShadow, pressed && styles.pressed]}
          onPress={() => router.push(ROUTES.pricing as never)}
        >
          <LinearGradient
            colors={[C.blue500, C.primary, C.blue700]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.premium}
          >
            <View style={styles.premiumGlow} />
            <View style={styles.premiumBody}>
              <View style={styles.premiumBadge}>
                <Feather name="zap" size={12} color="#fff" />
                <Text style={styles.premiumBadgeText}>PREMIUM</Text>
              </View>
              <Text style={styles.premiumTitle}>Unlock unlimited scans & OCR</Text>
              <Text style={styles.premiumSub}>
                Go Pro for batch processing, no limits and priority tools.
              </Text>
              <View style={styles.premiumCta}>
                <Text style={styles.premiumCtaText}>Try free</Text>
                <Feather name="arrow-right" size={15} color={C.primary} />
              </View>
            </View>
            <View style={styles.premiumIcon}>
              <SvgXml xml={CROWN_XML} width={40} height={40} />
            </View>
          </LinearGradient>
        </Pressable>
      )}

      {/* Quick actions */}
      <View style={styles.quickRow}>
        {QUICK_ACTIONS.map((a) => (
          <Pressable
            key={a.key}
            style={({ pressed }) => [styles.quickCard, cardShadow, pressed && styles.pressed]}
            onPress={() => router.push(a.route as never)}
          >
            <View style={styles.quickIcon}>
              <Feather name={a.icon} size={22} color="#fff" />
            </View>
            <Text style={styles.quickLabel}>{a.label}</Text>
          </Pressable>
        ))}
      </View>

      {/* Tools */}
      <SectionRow title="Tools" onSeeAll={() => router.push(ROUTES.tools as never)} />
      <View style={styles.toolsGrid}>
        {QUICK_TOOLS.map((t) => (
          <Pressable
            key={t.toolId}
            style={({ pressed }) => [
              styles.toolCard,
              { width: toolColWidth },
              cardShadow,
              pressed && styles.pressed,
            ]}
            onPress={() => router.push(ROUTES.convert(t.toolId) as never)}
          >
            <View style={styles.toolIcon}>
              <ToolLottieIcon toolId={t.toolId} size={34} />
            </View>
            <Text style={styles.toolLabel} numberOfLines={1}>
              {t.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Recent files */}
      <SectionRow
        title="Recent files"
        onSeeAll={recent.length > 0 ? () => router.push(ROUTES.files as never) : undefined}
      />
      {recent.length === 0 ? (
        <View style={[styles.recentEmpty, cardShadow]}>
          <View style={styles.recentEmptyIcon}>
            <Feather name="folder" size={22} color={C.primary} />
          </View>
          <Text style={styles.recentEmptyTitle}>No files yet</Text>
          <Text style={styles.recentEmptySub}>
            Scanned and converted files will show up here.
          </Text>
        </View>
      ) : (
        <View style={[styles.recentList, cardShadow]}>
          {recent.map((entry, i) => (
            <Pressable
              key={entry.id}
              onPress={() => router.push(ROUTES.files as never)}
              style={({ pressed }) => [
                styles.recentRow,
                i > 0 && styles.recentDivider,
                { backgroundColor: pressed ? C.muted : "transparent" },
              ]}
            >
              {entry.thumbnailUri ? (
                <Image source={{ uri: entry.thumbnailUri }} style={styles.recentThumb} contentFit="cover" />
              ) : entry.toolId ? (
                <View style={styles.recentThumbFallback}>
                  <ToolLottieIcon toolId={entry.toolId} size={28} autoPlay={false} loop={false} />
                </View>
              ) : (
                <View style={styles.recentThumbFallback}>
                  <Feather name={KIND_ICON[entry.kind]} size={18} color={C.primary} />
                </View>
              )}
              <View style={{ flex: 1 }}>
                <Text style={styles.recentName} numberOfLines={1}>
                  {entry.name}
                </Text>
                <Text style={styles.recentMeta} numberOfLines={1}>
                  {timeAgo(entry.createdAt)} · {entry.elementCount}{" "}
                  {entry.elementCount === 1 ? "element" : "elements"}
                </Text>
              </View>
              <Feather name="chevron-right" size={18} color={C.mutedForeground} />
            </Pressable>
          ))}
        </View>
      )}
    </ScreenScroll>
  );
}

function SectionRow({ title, onSeeAll }: { title: string; onSeeAll?: () => void }) {
  return (
    <View style={styles.sectionRow}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {onSeeAll ? (
        <Pressable onPress={onSeeAll} hitSlop={8}>
          <Text style={styles.seeAll}>See all</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  pressed: { opacity: 0.92 },

  greetRow: { flexDirection: "row", alignItems: "center", marginBottom: 18 },
  greetHello: { fontSize: 15, color: C.mutedForeground, fontFamily: fonts.body },
  greetName: { fontSize: 26, color: C.foreground, fontFamily: fonts.headingBold, marginTop: 2 },

  search: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.background,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === "ios" ? 14 : 12,
    marginBottom: 20,
  },
  searchPlaceholder: { flex: 1, fontSize: 15, color: C.mutedForeground, fontFamily: fonts.body },

  premiumWrap: { borderRadius: 20, marginBottom: 24 },
  premium: {
    borderRadius: 20,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    overflow: "hidden",
  },
  premiumGlow: {
    position: "absolute",
    top: -50,
    right: -30,
    width: 160,
    height: 160,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.16)",
  },
  premiumBody: { flex: 1 },
  premiumBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.22)",
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
    marginBottom: 10,
  },
  premiumBadgeText: { fontSize: 10.5, letterSpacing: 1, color: "#fff", fontFamily: fonts.bodyBold },
  premiumTitle: { fontSize: 18, color: "#fff", fontFamily: fonts.headingBold, lineHeight: 24 },
  premiumSub: {
    fontSize: 13,
    color: "rgba(255,255,255,0.88)",
    fontFamily: fonts.body,
    lineHeight: 18,
    marginTop: 4,
  },
  premiumCta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 999,
    marginTop: 14,
  },
  premiumCtaText: { fontSize: 14, color: C.primary, fontFamily: fonts.bodySemibold },
  premiumIcon: { marginLeft: 12 },

  quickRow: { flexDirection: "row", gap: 12, marginBottom: 26 },
  quickCard: {
    flex: 1,
    backgroundColor: C.background,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    paddingVertical: 18,
    alignItems: "center",
    gap: 10,
  },
  quickIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: C.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  quickLabel: { fontSize: 13.5, color: C.foreground, fontFamily: fonts.bodySemibold },

  sectionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  sectionTitle: { fontSize: 19, color: C.foreground, fontFamily: fonts.headingBold },
  seeAll: { fontSize: 13.5, color: C.primary, fontFamily: fonts.bodySemibold },

  toolsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 12,
    marginBottom: 28,
  },
  toolCard: {
    width: "48%",
    backgroundColor: C.background,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    paddingVertical: 16,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  toolIcon: {
    width: 46,
    height: 46,
    borderRadius: 13,
    backgroundColor: C.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  toolLabel: { flex: 1, fontSize: 14.5, color: C.foreground, fontFamily: fonts.bodySemibold },

  recentList: {
    backgroundColor: C.background,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    overflow: "hidden",
  },
  recentRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  recentDivider: { borderTopWidth: 1, borderTopColor: C.border },
  recentThumb: { width: 42, height: 50, borderRadius: 8, backgroundColor: C.muted },
  recentThumbFallback: {
    width: 42,
    height: 50,
    borderRadius: 8,
    backgroundColor: C.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  recentName: { fontSize: 14.5, color: C.foreground, fontFamily: fonts.bodySemibold },
  recentMeta: { fontSize: 12.5, color: C.mutedForeground, fontFamily: fonts.body, marginTop: 3 },

  recentEmpty: {
    width: "100%",
    backgroundColor: C.background,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: "center",
    paddingVertical: 32,
    paddingHorizontal: 24,
    gap: 6,
  },
  recentEmptyIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: C.accent,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  recentEmptyTitle: { fontSize: 15, color: C.foreground, fontFamily: fonts.headingSemibold },
  recentEmptySub: {
    fontSize: 13,
    color: C.mutedForeground,
    fontFamily: fonts.body,
    textAlign: "center",
    lineHeight: 19,
  },
});
