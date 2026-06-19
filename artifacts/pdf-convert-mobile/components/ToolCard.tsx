import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";

import ToolLottieIcon from "@/components/ToolLottieIcon";
import colors from "@/constants/colors";
import { ROUTES } from "@/constants/routes";
import { cardShadow, fonts } from "@/constants/theme";
import type { Tool } from "@/constants/tools";

const C = colors.light;

interface ToolCardProps {
  tool: Tool;
  variant?: "row" | "grid";
}

export default function ToolCard({ tool, variant = "row" }: ToolCardProps) {
  const router = useRouter();

  function handlePress() {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push(ROUTES.convert(tool.id) as never);
  }

  if (variant === "grid") {
    return (
      <Pressable
        onPress={handlePress}
        style={({ pressed }) => [styles.grid, cardShadow, { opacity: pressed ? 0.9 : 1 }]}
      >
        <ToolLottieIcon toolId={tool.id} size={48} />
        <Text style={styles.gridTitle} numberOfLines={2}>
          {tool.title}
        </Text>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [styles.row, cardShadow, { opacity: pressed ? 0.9 : 1 }]}
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
          <Text style={styles.badgeText}>→ {tool.outputFormat}</Text>
        </View>
      </View>
      <Feather name="chevron-right" size={20} color={C.mutedForeground} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 14,
    marginBottom: 12,
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: C.accent,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  textWrap: { flex: 1, gap: 3 },
  title: { fontSize: 15, color: C.foreground, fontFamily: fonts.headingSemibold },
  desc: { fontSize: 12.5, lineHeight: 17, color: C.mutedForeground, fontFamily: fonts.body },
  badgeRow: { marginTop: 4 },
  badgeText: { fontSize: 11, color: C.primary, fontFamily: fonts.bodySemibold },
  grid: {
    width: "100%",
    backgroundColor: C.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
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
