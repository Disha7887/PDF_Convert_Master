import React, { useState } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";

import ToolCard from "@/components/ToolCard";
import { mobileTools, toolCategories, getToolsByCategory } from "@/constants/tools";
import { useColors } from "@/hooks/useColors";

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState("");

  const filteredByQuery = query.trim()
    ? mobileTools.filter(
        (t) =>
          t.title.toLowerCase().includes(query.toLowerCase()) ||
          t.description.toLowerCase().includes(query.toLowerCase())
      )
    : null;

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
      keyboardShouldPersistTaps="handled"
    >
      {/* Header */}
      <View style={styles.header}>
        <View
          style={[styles.logoMark, { backgroundColor: colors.primary }]}
        >
          <Feather name="file-text" size={18} color="#fff" />
        </View>
        <View>
          <Text style={[styles.appTitle, { color: colors.foreground, fontFamily: "Poppins_700Bold" }]}>
            PDF Convert Master
          </Text>
          <Text style={[styles.appSubtitle, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
            Convert · Organize · Transform
          </Text>
        </View>
      </View>

      {/* Search */}
      <View style={[styles.searchWrap, { backgroundColor: colors.muted, borderColor: colors.border }]}>
        <Feather name="search" size={16} color={colors.mutedForeground} />
        <TextInput
          style={[styles.searchInput, { color: colors.foreground, fontFamily: "Inter_400Regular" }]}
          placeholder="Search tools…"
          placeholderTextColor={colors.mutedForeground}
          value={query}
          onChangeText={setQuery}
          returnKeyType="search"
        />
        {query.length > 0 && (
          <Feather
            name="x"
            size={16}
            color={colors.mutedForeground}
            onPress={() => setQuery("")}
          />
        )}
      </View>

      {/* Tool list */}
      {filteredByQuery ? (
        <View>
          <Text style={[styles.categoryLabel, { color: colors.mutedForeground, fontFamily: "Poppins_600SemiBold" }]}>
            Results ({filteredByQuery.length})
          </Text>
          {filteredByQuery.length === 0 ? (
            <View style={styles.emptyState}>
              <Feather name="search" size={36} color={colors.border} />
              <Text style={[styles.emptyText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                No tools match "{query}"
              </Text>
            </View>
          ) : (
            filteredByQuery.map((tool) => <ToolCard key={tool.id} tool={tool} />)
          )}
        </View>
      ) : (
        toolCategories.map((cat) => {
          const tools = getToolsByCategory(cat);
          return (
            <View key={cat} style={styles.categoryBlock}>
              <Text style={[styles.categoryLabel, { color: colors.foreground, fontFamily: "Poppins_600SemiBold" }]}>
                {cat}
              </Text>
              {tools.map((tool) => (
                <ToolCard key={tool.id} tool={tool} />
              ))}
            </View>
          );
        })
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 18,
  },
  logoMark: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  appTitle: {
    fontSize: 18,
    fontWeight: "700",
    lineHeight: 22,
  },
  appSubtitle: {
    fontSize: 11,
    marginTop: 1,
  },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === "ios" ? 12 : 10,
    marginBottom: 22,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    padding: 0,
    margin: 0,
  },
  categoryBlock: {
    marginBottom: 22,
  },
  categoryLabel: {
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    marginBottom: 10,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 40,
    gap: 10,
  },
  emptyText: {
    fontSize: 14,
    textAlign: "center",
  },
});
