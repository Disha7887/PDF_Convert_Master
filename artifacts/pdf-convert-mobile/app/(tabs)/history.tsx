import AsyncStorage from "@react-native-async-storage/async-storage";
import { Feather } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";

const HISTORY_KEY = "pdf_convert_history";

interface HistoryEntry {
  id: string;
  toolTitle: string;
  fileName: string;
  outputFormat: string;
  timestamp: number;
  status: "completed" | "failed";
}

export default function HistoryScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [entries, setEntries] = useState<HistoryEntry[]>([]);

  useFocusEffect(
    useCallback(() => {
      loadHistory();
    }, [])
  );

  async function loadHistory() {
    try {
      const raw = await AsyncStorage.getItem(HISTORY_KEY);
      if (raw) {
        const parsed: HistoryEntry[] = JSON.parse(raw);
        setEntries(parsed.sort((a, b) => b.timestamp - a.timestamp));
      } else {
        setEntries([]);
      }
    } catch {
      setEntries([]);
    }
  }

  function confirmClear() {
    Alert.alert("Clear History", "Remove all conversion history?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Clear",
        style: "destructive",
        onPress: async () => {
          await AsyncStorage.removeItem(HISTORY_KEY);
          setEntries([]);
        },
      },
    ]);
  }

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 + 84 : 90;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{
        paddingTop: topPad + 16,
        paddingBottom: bottomPad,
        paddingHorizontal: 16,
      }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header row */}
      <View style={styles.headerRow}>
        <Text style={[styles.heading, { color: colors.foreground, fontFamily: "Poppins_700Bold" }]}>
          History
        </Text>
        {entries.length > 0 && (
          <Pressable onPress={confirmClear}>
            <Text style={[styles.clearBtn, { color: colors.destructive, fontFamily: "Inter_500Medium" }]}>
              Clear all
            </Text>
          </Pressable>
        )}
      </View>

      {entries.length === 0 ? (
        <View style={styles.emptyState}>
          <Feather name="clock" size={48} color={colors.border} />
          <Text style={[styles.emptyTitle, { color: colors.foreground, fontFamily: "Poppins_600SemiBold" }]}>
            No conversions yet
          </Text>
          <Text style={[styles.emptyDesc, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
            Your completed conversions will appear here
          </Text>
        </View>
      ) : (
        entries.map((entry) => (
          <View
            key={entry.id}
            style={[
              styles.entry,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
              },
            ]}
          >
            <View
              style={[
                styles.entryIcon,
                {
                  backgroundColor:
                    entry.status === "completed" ? colors.accent : "#fef2f2",
                },
              ]}
            >
              <Feather
                name={entry.status === "completed" ? "check-circle" : "x-circle"}
                size={20}
                color={
                  entry.status === "completed"
                    ? colors.primary
                    : colors.destructive
                }
              />
            </View>
            <View style={styles.entryInfo}>
              <Text
                style={[styles.entryTool, { color: colors.foreground, fontFamily: "Poppins_600SemiBold" }]}
                numberOfLines={1}
              >
                {entry.toolTitle}
              </Text>
              <Text
                style={[styles.entryFile, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}
                numberOfLines={1}
              >
                {entry.fileName}
              </Text>
              <Text style={[styles.entryTime, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                {new Date(entry.timestamp).toLocaleString()} · {entry.outputFormat}
              </Text>
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  heading: {
    fontSize: 24,
    fontWeight: "700",
  },
  clearBtn: {
    fontSize: 14,
    fontWeight: "500",
  },
  emptyState: {
    alignItems: "center",
    paddingTop: 80,
    gap: 10,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 8,
  },
  emptyDesc: {
    fontSize: 14,
    textAlign: "center",
    maxWidth: 240,
  },
  entry: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    gap: 12,
    marginBottom: 10,
  },
  entryIcon: {
    width: 42,
    height: 42,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  entryInfo: { flex: 1 },
  entryTool: { fontSize: 14, fontWeight: "600" },
  entryFile: { fontSize: 12, marginTop: 2 },
  entryTime: { fontSize: 11, marginTop: 4 },
});

export { HISTORY_KEY };
export type { HistoryEntry };
