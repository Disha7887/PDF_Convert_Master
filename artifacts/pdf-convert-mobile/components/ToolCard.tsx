import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";

import { GlassSurface } from "@/components/Glass";
import ToolLottieIcon from "@/components/ToolLottieIcon";
import colors from "@/constants/colors";
import { ROUTES } from "@/constants/routes";
import { fonts } from "@/constants/theme";
import type { Tool } from "@/constants/tools";

const C = colors.light;

interface ToolCardProps {
  tool: Tool;
  variant?: "row" | "grid";
}

export default function ToolCard({ tool, variant = "row" }: ToolCardProps) {
  const router = useRouter();

  const offline = !!tool.maintenance;

  function handlePress() {
    if (offline) return;
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push(ROUTES.convert(tool.id) as never);
  }

  if (variant === "grid") {
    return (
      <GlassSurface radius={18} style={styles.gridWrap}>
        <Pressable
          onPress={handlePress}
          disabled={offline}
          style={({ pressed }) => [
            styles.grid,
            { opacity: offline ? 0.55 : pressed ? 0.85 : 1 },
          ]}
        >
          <ToolLottieIcon toolId={tool.id} size={48} />
          <Text style={styles.gridTitle} numberOfLines={2}>
            {tool.title}
          </Text>
          {offline && <MaintenanceBadge />}
        </Pressable>
      </GlassSurface>
    );
  }

  return (
    <GlassSurface radius={18} style={styles.rowWrap}>
      <Pressable
        onPress={handlePress}
        disabled={offline}
        style={({ pressed }) => [
          styles.row,
          { opacity: offline ? 0.6 : pressed ? 0.85 : 1 },
        ]}
      >
        <View style={styles.iconWrap}>
          <ToolLottieIcon toolId={tool.id} size={40} />
        </View>
        <View style={styles.textWrap}>
          <Text style={styles.title} numberOfLines={1}>
            {tool.title}
          </Text>
          <Text style={styles.desc} numberOfLines={2}>
            {tool.description}
          </Text>
          <View style={styles.badgeRow}>
            {offline ? (
              <MaintenanceBadge />
            ) : (
              <Text style={styles.badgeText}>→ {tool.outputFormat}</Text>
            )}
          </View>
        </View>
        {!offline && <Feather name="chevron-right" size={20} color={C.mutedForeground} />}
      </Pressable>
    </GlassSurface>
  );
}

function MaintenanceBadge() {
  return (
    <View style={styles.maintBadge}>
      <Feather name="tool" size={11} color={C.mutedForeground} />
      <Text style={styles.maintText}>Under maintenance</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  rowWrap: {
    marginBottom: 12,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 14,
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: "rgba(255,241,240,0.85)",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  textWrap: { flex: 1, gap: 3 },
  title: { fontSize: 15, color: C.foreground, fontFamily: fonts.headingSemibold },
  desc: { fontSize: 12.5, lineHeight: 17, color: C.mutedForeground, fontFamily: fonts.body },
  badgeRow: { marginTop: 4 },
  badgeText: { fontSize: 11, color: C.primary, fontFamily: fonts.bodySemibold },
  maintBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 6,
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: C.muted,
    borderWidth: 1,
    borderColor: C.border,
  },
  maintText: {
    fontSize: 10.5,
    color: C.mutedForeground,
    fontFamily: fonts.bodySemibold,
  },
  gridWrap: {
    width: "100%",
  },
  grid: {
    width: "100%",
    paddingVertical: 18,
    paddingHorizontal: 12,
    alignItems: "center",
    gap: 10,
  },
  gridTitle: {
    fontSize: 13,
    textAlign: "center",
    color: C.foreground,
    fontFamily: fonts.headingSemibold,
  },
});
