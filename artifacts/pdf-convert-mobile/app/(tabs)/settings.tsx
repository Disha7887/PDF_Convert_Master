import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Alert, Pressable, Share, StyleSheet, Switch, Text, View } from "react-native";

import { Button, ScreenScroll } from "@/components/ui";
import colors from "@/constants/colors";
import { ROUTES } from "@/constants/routes";
import { cardShadow, fonts } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";

const C = colors.light;
const MOBILE_DATA_KEY = "pref_ask_mobile_data";
type FeatherName = keyof typeof Feather.glyphMap;

interface LinkRow {
  label: string;
  icon: FeatherName;
  onPress: () => void;
}

export default function SettingsScreen() {
  const router = useRouter();
  const { isAuthenticated, user, signout } = useAuth();
  const go = (r: string) => router.push(r as never);

  const [askMobileData, setAskMobileData] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(MOBILE_DATA_KEY).then((v) => {
      if (v !== null) setAskMobileData(v === "true");
    });
  }, []);

  const toggleMobileData = (value: boolean) => {
    setAskMobileData(value);
    AsyncStorage.setItem(MOBILE_DATA_KEY, String(value)).catch(() => {});
  };

  const restorePurchases = () =>
    Alert.alert("Restore Purchases", "No previous purchases were found on this account.");

  const shareApp = async () => {
    try {
      await Share.share({
        message: "Convert, scan and organize PDFs on the go with PDF Convert Master.",
      });
    } catch {
      // user dismissed
    }
  };

  const showCredits = () =>
    Alert.alert(
      "Credits",
      "PDF Convert Master\nBuilt with Expo & React Native.\nIcons by Feather.\nFonts: Poppins & Inter.",
    );

  const moreLinks: LinkRow[] = [
    { label: "Terms & Conditions", icon: "file-text", onPress: () => go(ROUTES.terms) },
    { label: "Privacy Policy", icon: "shield", onPress: () => go(ROUTES.privacy) },
    { label: "About us", icon: "info", onPress: () => go(ROUTES.about) },
    { label: "Credits", icon: "award", onPress: showCredits },
    { label: "Help & Contact", icon: "life-buoy", onPress: () => go(ROUTES.contact) },
    { label: "Share App", icon: "share-2", onPress: shareApp },
  ];

  return (
    <ScreenScroll navInset tabBar>
      {/* Account */}
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
                label="Manage plan"
                icon="credit-card"
                variant="outline"
                size="sm"
                onPress={() => go(ROUTES.managePlans)}
              />
              <Button label="Sign Out" icon="log-out" variant="ghost" size="sm" onPress={signout} />
            </View>
          </>
        ) : (
          <>
            <Text style={styles.accountTitle}>Welcome to PDF Convert Master</Text>
            <Text style={styles.accountSub}>
              Sign in to sync your plan, API keys and conversion history.
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

      {/* Get Premium banner */}
      <Pressable onPress={() => go(ROUTES.pricing)} style={({ pressed }) => [{ opacity: pressed ? 0.94 : 1 }]}>
        <LinearGradient
          colors={[C.blue600, C.blue900]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.premium, cardShadow]}
        >
          <View style={styles.premiumIcon}>
            <Feather name="award" size={22} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.premiumTitle}>Get Premium</Text>
            <Text style={styles.premiumSub}>Unlimited conversions, no ads, priority speed.</Text>
          </View>
          <Feather name="chevron-right" size={20} color="#fff" />
        </LinearGradient>
      </Pressable>

      {/* Purchases */}
      <Text style={styles.sectionTitle}>Purchases</Text>
      <View style={[styles.group, cardShadow]}>
        <SettingRow icon="shopping-bag" label="Purchases" onPress={() => go(ROUTES.managePlans)} />
        <SettingRow icon="refresh-cw" label="Restore Purchases" onPress={restorePurchases} divider />
      </View>

      {/* Preferences */}
      <Text style={styles.sectionTitle}>Preferences</Text>
      <View style={[styles.group, cardShadow]}>
        <View style={styles.toggleRow}>
          <View style={styles.linkIcon}>
            <Feather name="wifi" size={18} color={C.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.linkLabel}>Ask before using mobile data</Text>
            <Text style={styles.linkSub}>Confirm before uploading on a cellular connection.</Text>
          </View>
          <Switch
            value={askMobileData}
            onValueChange={toggleMobileData}
            trackColor={{ false: C.border, true: C.primary }}
            thumbColor="#fff"
          />
        </View>
      </View>

      {/* More */}
      <Text style={styles.sectionTitle}>More</Text>
      <View style={[styles.group, cardShadow]}>
        {moreLinks.map((row, i) => (
          <SettingRow
            key={row.label}
            icon={row.icon}
            label={row.label}
            onPress={row.onPress}
            divider={i > 0}
          />
        ))}
      </View>

      <Text style={styles.version}>PDF Convert Master · Mobile · v1.0.0</Text>
    </ScreenScroll>
  );
}

function SettingRow({
  icon,
  label,
  onPress,
  divider,
}: {
  icon: FeatherName;
  label: string;
  onPress: () => void;
  divider?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.linkRow,
        divider && styles.linkDivider,
        { backgroundColor: pressed ? C.muted : "transparent" },
      ]}
    >
      <View style={styles.linkIcon}>
        <Feather name={icon} size={18} color={C.primary} />
      </View>
      <Text style={[styles.linkLabel, { flex: 1 }]}>{label}</Text>
      <Feather name="chevron-right" size={18} color={C.mutedForeground} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  accountCard: {
    backgroundColor: C.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: C.border,
    padding: 18,
    marginBottom: 18,
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
  premium: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderRadius: 18,
    padding: 18,
    marginBottom: 22,
  },
  premiumIcon: {
    width: 44,
    height: 44,
    borderRadius: 13,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  premiumTitle: { fontSize: 17, color: "#fff", fontFamily: fonts.headingBold },
  premiumSub: { fontSize: 12.5, color: "rgba(255,255,255,0.85)", fontFamily: fonts.body, marginTop: 2 },
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
    marginBottom: 20,
  },
  linkRow: { flexDirection: "row", alignItems: "center", gap: 14, paddingHorizontal: 14, paddingVertical: 14 },
  toggleRow: { flexDirection: "row", alignItems: "center", gap: 14, paddingHorizontal: 14, paddingVertical: 12 },
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
