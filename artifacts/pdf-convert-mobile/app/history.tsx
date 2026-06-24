import { Feather } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import { Alert, Platform, Pressable, StyleSheet, Text, View } from "react-native";

import { Loader } from "@/components/Loader";
import ToolLottieIcon from "@/components/ToolLottieIcon";
import { Badge, Button, ScreenScroll } from "@/components/ui";
import colors from "@/constants/colors";
import { ROUTES } from "@/constants/routes";
import { cardShadow, fonts } from "@/constants/theme";
import { clearHistory, loadHistory, type HistoryEntry } from "@/constants/history";

const C = colors.light;

function formatTime(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function HistoryScreen() {
  const router = useRouter();
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        const list = await loadHistory();
        if (active) {
          setEntries(list);
          setLoading(false);
        }
      })();
      return () => {
        active = false;
      };
    }, []),
  );

  const handleClear = useCallback(() => {
    const doClear = async () => {
      await clearHistory();
      setEntries([]);
    };
    if (Platform.OS === "web") {
      void doClear();
      return;
    }
    Alert.alert("Clear history?", "This removes all locally stored conversion history.", [
      { text: "Cancel", style: "cancel" },
      { text: "Clear", style: "destructive", onPress: () => void doClear() },
    ]);
  }, []);

  return (
    <ScreenScroll>
      {entries.length > 0 && (
        <View style={styles.topBar}>
          <Text style={styles.count}>{entries.length} conversions</Text>
          <Button label="Clear" icon="trash-2" variant="ghost" size="sm" onPress={handleClear} />
        </View>
      )}

      {loading ? (
        <View style={styles.loadingWrap}>
          <Loader size={64} />
        </View>
      ) : entries.length === 0 ? (
        <View style={styles.empty}>
          <View style={styles.emptyIcon}>
            <Feather name="clock" size={34} color={C.primary} />
          </View>
          <Text style={styles.emptyTitle}>No conversions yet</Text>
          <Text style={styles.emptyText}>
            Your completed conversions will appear here so you can find them again quickly.
          </Text>
          <Button
            label="Browse Tools"
            icon="grid"
            onPress={() => router.push(ROUTES.tools as never)}
          />
        </View>
      ) : (
        entries.map((entry) => (
          <Pressable
            key={entry.id}
            onPress={() => entry.toolId && router.push(ROUTES.convert(entry.toolId) as never)}
            style={({ pressed }) => [styles.card, cardShadow, { opacity: pressed ? 0.92 : 1 }]}
          >
            {/* Same animated per-tool identity icon used in dashboard Recent
                Activity, so a row reads at a glance as the tool that produced it
                (success/failure is conveyed by the badge tone on the right). */}
            <View style={[styles.statusIcon, { backgroundColor: C.accent }]}>
              {entry.toolId ? (
                <ToolLottieIcon toolId={entry.toolId} size={28} autoPlay={false} loop={false} />
              ) : (
                <Feather
                  name={entry.status === "completed" ? "check" : "x"}
                  size={18}
                  color={entry.status === "completed" ? "#166534" : "#991b1b"}
                />
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle} numberOfLines={1}>
                {entry.toolTitle}
              </Text>
              <Text style={styles.cardFile} numberOfLines={1}>
                {entry.fileName}
              </Text>
              <Text style={styles.cardTime} numberOfLines={1}>
                {formatTime(entry.timestamp)}
              </Text>
            </View>
            <View style={styles.cardRight}>
              <Badge
                label={entry.outputFormat}
                tone={entry.status === "completed" ? "primary" : "danger"}
              />
            </View>
          </Pressable>
        ))
      )}
    </ScreenScroll>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  count: { fontSize: 14, color: C.mutedForeground, fontFamily: fonts.bodyMedium },
  loadingWrap: { alignItems: "center", paddingVertical: 60 },
  empty: { alignItems: "center", paddingVertical: 60, gap: 12 },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: C.accent,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  emptyTitle: { fontSize: 18, color: C.foreground, fontFamily: fonts.headingBold },
  emptyText: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
    color: C.mutedForeground,
    fontFamily: fonts.body,
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: C.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    padding: 14,
    marginBottom: 12,
  },
  statusIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  cardRight: {
    alignItems: "flex-end",
    gap: 6,
    flexShrink: 0,
    maxWidth: 108,
  },
  cardTitle: { fontSize: 15, color: C.foreground, fontFamily: fonts.headingSemibold },
  cardFile: { fontSize: 13, color: C.mutedForeground, fontFamily: fonts.body, marginTop: 1 },
  cardTime: { fontSize: 11, color: C.mutedForeground, fontFamily: fonts.body, marginTop: 3 },
});
