import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React from "react";
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { MobileTool } from "@/constants/tools";
import { useColors } from "@/hooks/useColors";

interface ToolCardProps {
  tool: MobileTool;
}

type FeatherIconName = React.ComponentProps<typeof Feather>["name"];

const ICON_MAP: Record<string, FeatherIconName> = {
  "file-text": "file-text",
  grid: "grid",
  monitor: "monitor",
  image: "image",
  copy: "copy",
  scissors: "scissors",
  "minimize-2": "minimize-2",
  "maximize-2": "maximize-2",
  "rotate-cw": "rotate-cw",
  "refresh-cw": "refresh-cw",
  scan: "eye",
};

export default function ToolCard({ tool }: ToolCardProps) {
  const colors = useColors();
  const router = useRouter();

  function handlePress() {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push(`/convert/${tool.id}` as any);
  }

  const iconName = ICON_MAP[tool.iconName] ?? "file";

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          opacity: pressed ? 0.85 : 1,
        },
      ]}
    >
      <View
        style={[
          styles.iconWrap,
          { backgroundColor: colors.accent },
        ]}
      >
        <Feather name={iconName} size={22} color={colors.primary} />
      </View>
      <View style={styles.textWrap}>
        <Text
          style={[styles.title, { color: colors.foreground, fontFamily: "Poppins_600SemiBold" }]}
          numberOfLines={1}
        >
          {tool.title}
        </Text>
        <Text
          style={[styles.desc, { color: colors.mutedForeground }]}
          numberOfLines={2}
        >
          {tool.description}
        </Text>
        <View style={styles.badge}>
          <Text style={[styles.badgeText, { color: colors.primary }]}>
            → {tool.outputFormat}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 14,
    marginBottom: 10,
  },
  iconWrap: {
    width: 46,
    height: 46,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  textWrap: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 15,
    fontWeight: "600",
  },
  desc: {
    fontSize: 12,
    lineHeight: 17,
    fontFamily: "Inter_400Regular",
  },
  badge: {
    marginTop: 4,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
});
