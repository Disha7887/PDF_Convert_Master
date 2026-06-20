import { Feather } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
import {
  Platform,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";

import AppHeader from "@/components/AppHeader";
import ToolCard from "@/components/ToolCard";
import { ScreenScroll } from "@/components/ui";
import colors from "@/constants/colors";
import { fonts } from "@/constants/theme";
import { TOOL_CATEGORIES, getToolsByCategory, tools } from "@/constants/tools";

const C = colors.light;

export default function ToolsScreen() {
  const [query, setQuery] = useState("");
  const { width } = useWindowDimensions();
  const numColumns = width < 360 ? 1 : 2;
  const colWidth = numColumns === 1 ? "100%" : "48%";

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return null;
    return tools.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.outputFormat.toLowerCase().includes(q),
    );
  }, [query]);

  return (
    <ScreenScroll insetTop tabBar>
      <AppHeader subtitle="All 27 tools, one tap away" />

      {/* Search */}
      <View style={styles.searchWrap}>
        <Feather name="search" size={16} color={C.mutedForeground} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search tools…"
          placeholderTextColor={C.mutedForeground}
          value={query}
          onChangeText={setQuery}
          returnKeyType="search"
        />
        {query.length > 0 && (
          <Feather name="x" size={16} color={C.mutedForeground} onPress={() => setQuery("")} />
        )}
      </View>

      {filtered ? (
        <View>
          <Text style={styles.categoryLabel}>Results ({filtered.length})</Text>
          {filtered.length === 0 ? (
            <View style={styles.emptyState}>
              <Feather name="search" size={36} color={C.border} />
              <Text style={styles.emptyText}>No tools match “{query}”.</Text>
            </View>
          ) : (
            <View style={styles.grid}>
              {filtered.map((tool) => (
                <View key={tool.id} style={{ width: colWidth }}>
                  <ToolCard tool={tool} variant="grid" />
                </View>
              ))}
            </View>
          )}
        </View>
      ) : (
        TOOL_CATEGORIES.map((cat) => {
          const list = getToolsByCategory(cat);
          return (
            <View key={cat} style={styles.categoryBlock}>
              <Text style={styles.categoryLabel}>{cat}</Text>
              <View style={styles.grid}>
                {list.map((tool) => (
                  <View key={tool.id} style={{ width: colWidth }}>
                    <ToolCard tool={tool} variant="grid" />
                  </View>
                ))}
              </View>
            </View>
          );
        })
      )}
    </ScreenScroll>
  );
}

const styles = StyleSheet.create({
  titleBlock: { marginBottom: 16 },
  title: { fontSize: 26, color: C.foreground, fontFamily: fonts.headingBold },
  subtitle: { fontSize: 14, color: C.mutedForeground, fontFamily: fonts.body, marginTop: 4 },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.muted,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === "ios" ? 12 : 10,
    marginBottom: 22,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    padding: 0,
    margin: 0,
    color: C.foreground,
    fontFamily: fonts.body,
  },
  categoryBlock: { marginBottom: 20 },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 12,
  },
  categoryLabel: {
    fontSize: 13,
    letterSpacing: 0.5,
    textTransform: "uppercase",
    color: C.foreground,
    fontFamily: fonts.headingSemibold,
    marginBottom: 12,
  },
  emptyState: { alignItems: "center", paddingVertical: 40, gap: 10 },
  emptyText: { fontSize: 14, textAlign: "center", color: C.mutedForeground, fontFamily: fonts.body },
});
