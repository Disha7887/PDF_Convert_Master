import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import ToolCard from "@/components/ToolCard";
import { Button, Chip, Field, ScreenScroll } from "@/components/ui";
import colors from "@/constants/colors";
import { ROUTES } from "@/constants/routes";
import { fonts } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import { TOOL_CATEGORIES, tools, type ToolCategory } from "@/constants/tools";

const C = colors.light;

type Filter = "all" | ToolCategory;

function SignInGate() {
  const router = useRouter();
  return (
    <View style={styles.gate}>
      <View style={styles.gateIcon}>
        <Feather name="lock" size={28} color={C.primary} />
      </View>
      <Text style={styles.gateTitle}>Sign in required</Text>
      <Text style={styles.gateText}>Sign in to access the live PDF tools.</Text>
      <Button label="Sign In" icon="log-in" onPress={() => router.push(ROUTES.signIn as never)} />
    </View>
  );
}

export default function LiveToolsScreen() {
  const { isAuthenticated } = useAuth();
  const [activeFilter, setActiveFilter] = useState<Filter>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredTools = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return tools.filter((tool) => {
      const matchesSearch =
        tool.title.toLowerCase().includes(q) || tool.description.toLowerCase().includes(q);
      const matchesFilter = activeFilter === "all" || tool.category === activeFilter;
      return matchesSearch && matchesFilter;
    });
  }, [searchQuery, activeFilter]);

  const getToolCount = (category: Filter) =>
    tools.filter((tool) => category === "all" || tool.category === category).length;

  if (!isAuthenticated) {
    return (
      <ScreenScroll>
        <SignInGate />
      </ScreenScroll>
    );
  }

  return (
    <ScreenScroll>
      {/* Page header */}
      <Text style={styles.h1}>Live PDF Tools</Text>
      <Text style={styles.subtitle}>Professional PDF conversion and manipulation tools</Text>

      {/* Search */}
      <View style={styles.search}>
        <Field
          icon="search"
          placeholder="Search tools..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
        />
      </View>

      {/* Filter tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
      >
        <Chip
          label={`All Tools (${getToolCount("all")})`}
          active={activeFilter === "all"}
          onPress={() => setActiveFilter("all")}
        />
        {TOOL_CATEGORIES.map((category) => (
          <Chip
            key={category}
            label={`${category} (${getToolCount(category)})`}
            active={activeFilter === category}
            onPress={() => setActiveFilter(category)}
          />
        ))}
      </ScrollView>

      {/* Tools grid */}
      {filteredTools.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Text style={styles.empty}>No tools found matching your search criteria.</Text>
        </View>
      ) : (
        <View style={styles.list}>
          {filteredTools.map((tool) => (
            <ToolCard key={tool.id} tool={tool} variant="row" />
          ))}
        </View>
      )}
    </ScreenScroll>
  );
}

const styles = StyleSheet.create({
  h1: { fontSize: 24, color: C.foreground, fontFamily: fonts.headingBold },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: C.mutedForeground,
    fontFamily: fonts.body,
    marginTop: 4,
  },
  search: { marginTop: 18 },
  filterRow: { gap: 8, paddingVertical: 16, paddingRight: 4 },
  list: { marginTop: 4 },

  emptyWrap: { paddingVertical: 48, alignItems: "center" },
  empty: {
    fontSize: 14,
    color: C.mutedForeground,
    fontFamily: fonts.body,
    textAlign: "center",
  },

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
