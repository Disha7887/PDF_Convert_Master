import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import AppHeader from "@/components/AppHeader";
import { Button, ScreenScroll } from "@/components/ui";
import colors from "@/constants/colors";
import { ROUTES } from "@/constants/routes";
import { cardShadow, fonts } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";

const C = colors.light;
type FeatherName = keyof typeof Feather.glyphMap;

interface LinkRow {
  label: string;
  sublabel?: string;
  icon: FeatherName;
  route: string;
}

const SECTIONS: { title: string; rows: LinkRow[] }[] = [
  {
    title: "Workspace",
    rows: [
      { label: "Dashboard", sublabel: "Usage, API keys & plans", icon: "bar-chart-2", route: ROUTES.dashboardHome },
      { label: "Conversion History", sublabel: "Your recent conversions", icon: "clock", route: ROUTES.history },
      { label: "Live Tools", sublabel: "Try tools instantly", icon: "zap", route: ROUTES.liveTools },
    ],
  },
  {
    title: "Explore",
    rows: [
      { label: "Pricing", icon: "tag", route: ROUTES.pricing },
      { label: "Features", icon: "layers", route: ROUTES.features },
      { label: "How It Works", icon: "help-circle", route: ROUTES.learnMore },
    ],
  },
  {
    title: "Company",
    rows: [
      { label: "About", icon: "info", route: ROUTES.about },
      { label: "Contact", icon: "mail", route: ROUTES.contact },
      { label: "Support", icon: "life-buoy", route: ROUTES.support },
    ],
  },
  {
    title: "Legal",
    rows: [
      { label: "Privacy Policy", icon: "shield", route: ROUTES.privacy },
      { label: "Terms of Service", icon: "file-text", route: ROUTES.terms },
    ],
  },
];

export default function MoreScreen() {
  const router = useRouter();
  const { isAuthenticated, user, signout } = useAuth();
  const go = (r: string) => router.push(r as never);

  return (
    <ScreenScroll insetTop tabBar>
      <AppHeader subtitle="Account & more" />

      {/* Account card */}
      <View style={[styles.accountCard, cardShadow]}>
        {isAuthenticated ? (
          <>
            <View style={styles.accountRow}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{user?.avatarInitials ?? "U"}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.accountName} numberOfLines={1}>
                  {user?.name}
                </Text>
                <Text style={styles.accountEmail} numberOfLines={1}>
                  {user?.email}
                </Text>
              </View>
              <View style={styles.planPill}>
                <Text style={styles.planPillText}>{user?.plan}</Text>
              </View>
            </View>
            <View style={styles.accountActions}>
              <Button
                label="Dashboard"
                icon="bar-chart-2"
                variant="outline"
                size="sm"
                onPress={() => go(ROUTES.dashboardHome)}
              />
              <Button label="Sign Out" icon="log-out" variant="ghost" size="sm" onPress={signout} />
            </View>
          </>
        ) : (
          <>
            <Text style={styles.accountTitle}>Welcome to PDF Convert Master</Text>
            <Text style={styles.accountSub}>
              Sign in to access your dashboard, API keys and conversion history.
            </Text>
            <View style={styles.accountActions}>
              <Button label="Sign In" icon="log-in" size="sm" onPress={() => go(ROUTES.signIn)} />
              <Button
                label="Create Account"
                variant="outline"
                size="sm"
                onPress={() => go(ROUTES.signUp)}
              />
            </View>
          </>
        )}
      </View>

      {SECTIONS.map((section) => (
        <View key={section.title} style={styles.section}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
          <View style={[styles.group, cardShadow]}>
            {section.rows.map((row, i) => (
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
                  {row.sublabel ? <Text style={styles.linkSub}>{row.sublabel}</Text> : null}
                </View>
                <Feather name="chevron-right" size={18} color={C.mutedForeground} />
              </Pressable>
            ))}
          </View>
        </View>
      ))}

      <Text style={styles.version}>PDF Convert Master · Mobile · v1.0.0</Text>
    </ScreenScroll>
  );
}

const styles = StyleSheet.create({
  accountCard: {
    backgroundColor: C.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: C.border,
    padding: 18,
    marginBottom: 22,
    gap: 14,
  },
  accountRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: C.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontSize: 16, color: C.primary, fontFamily: fonts.bodyBold },
  accountName: { fontSize: 16, color: C.foreground, fontFamily: fonts.headingSemibold },
  accountEmail: { fontSize: 13, color: C.mutedForeground, fontFamily: fonts.body, marginTop: 1 },
  planPill: { backgroundColor: C.blue50, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  planPillText: { fontSize: 12, color: C.blue700, fontFamily: fonts.bodySemibold },
  accountTitle: { fontSize: 17, color: C.foreground, fontFamily: fonts.headingBold },
  accountSub: { fontSize: 13, lineHeight: 19, color: C.mutedForeground, fontFamily: fonts.body },
  accountActions: { flexDirection: "row", gap: 10, flexWrap: "wrap" },
  section: { marginBottom: 20 },
  sectionTitle: {
    fontSize: 13,
    letterSpacing: 0.5,
    textTransform: "uppercase",
    color: C.foreground,
    fontFamily: fonts.headingSemibold,
    marginBottom: 10,
  },
  group: {
    backgroundColor: C.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    overflow: "hidden",
  },
  linkRow: { flexDirection: "row", alignItems: "center", gap: 14, paddingHorizontal: 14, paddingVertical: 14 },
  linkDivider: { borderTopWidth: 1, borderTopColor: C.border },
  linkIcon: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: C.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  linkLabel: { fontSize: 15, color: C.foreground, fontFamily: fonts.bodyMedium },
  linkSub: { fontSize: 12, color: C.mutedForeground, fontFamily: fonts.body, marginTop: 1 },
  version: {
    fontSize: 12,
    color: C.mutedForeground,
    fontFamily: fonts.body,
    textAlign: "center",
    marginTop: 6,
  },
});
