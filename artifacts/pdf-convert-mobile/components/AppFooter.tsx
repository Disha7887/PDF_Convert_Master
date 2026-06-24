import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Image, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import colors from "@/constants/colors";
import { ROUTES } from "@/constants/routes";
import { fonts } from "@/constants/theme";

const C = colors.light;

type FeatherName = keyof typeof Feather.glyphMap;

const QUICK_LINKS: [string, string][] = [
  ["PDF Tools", ROUTES.tools],
  ["Pricing", ROUTES.pricing],
  ["About Us", ROUTES.about],
  ["Support", ROUTES.support],
  ["Contact", ROUTES.contact],
];

const LEGAL_LINKS: [string, string | null][] = [
  ["Privacy Policy", ROUTES.privacy],
  ["Terms of Service", ROUTES.terms],
  ["Support", ROUTES.support],
  ["Report Bug", null],
];

const SOCIALS: { icon: FeatherName; label: string }[] = [
  { icon: "facebook", label: "Facebook" },
  { icon: "instagram", label: "Instagram" },
  { icon: "linkedin", label: "LinkedIn" },
];

const SECURITY_BADGES: { icon: FeatherName; text: string }[] = [
  { icon: "phone", text: "+447429919748" },
  { icon: "lock", text: "SSL Secured" },
  { icon: "cloud", text: "Cloud Processing" },
  { icon: "shield", text: "Privacy Protected" },
];

/** Marketing footer used on the Home and marketing screens (parity with web FooterSection). */
export function AppFooter() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const go = (r: string | null) => {
    if (r) router.push(r as never);
  };

  return (
    <View style={styles.footer}>
      {/* Company info */}
      <Image
        source={require("@/assets/images/logo-full.png")}
        style={styles.brandLogo}
        resizeMode="contain"
      />
      <Text style={styles.tagline}>
        Your trusted partner for professional PDF conversion and document management solutions.
      </Text>

      <View style={styles.companyBlock}>
        <Text style={styles.companyName}>Mizan Store Ltd</Text>
        <View style={styles.infoRow}>
          <Feather name="map-pin" size={15} color={C.mutedForeground} style={styles.infoIcon} />
          <View>
            <Text style={styles.infoText}>123 Business Street</Text>
            <Text style={styles.infoText}>London, SW1A 1AA</Text>
            <Text style={styles.infoText}>United Kingdom</Text>
          </View>
        </View>
        <View style={styles.infoRow}>
          <Feather name="phone" size={15} color={C.mutedForeground} style={styles.infoIcon} />
          <Text style={styles.infoText}>+447429919748</Text>
        </View>
        <View style={styles.infoRow}>
          <Feather name="mail" size={15} color={C.mutedForeground} style={styles.infoIcon} />
          <Text style={styles.infoText}>info@pdfgenius.app</Text>
        </View>
      </View>

      {/* Link columns */}
      <View style={styles.columns}>
        <View style={styles.column}>
          <Text style={styles.columnTitle}>Quick Links</Text>
          {QUICK_LINKS.map(([label, route]) => (
            <Pressable key={label} onPress={() => go(route)} hitSlop={6}>
              <Text style={styles.link}>{label}</Text>
            </Pressable>
          ))}
        </View>
        <View style={styles.column}>
          <Text style={styles.columnTitle}>Legal &amp; Support</Text>
          {LEGAL_LINKS.map(([label, route]) => (
            <Pressable key={label} onPress={() => go(route)} hitSlop={6} disabled={!route}>
              <Text style={[styles.link, !route && styles.linkDisabled]}>{label}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Newsletter + social */}
      <View style={styles.newsletter}>
        <Text style={styles.columnTitle}>Stay Connected</Text>
        <Text style={styles.newsletterText}>
          Subscribe to our newsletter for updates and news.
        </Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your email"
          placeholderTextColor={C.mutedForeground}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <Pressable
          style={({ pressed }) => [styles.subscribeBtn, { opacity: pressed ? 0.85 : 1 }]}
          onPress={() => setEmail("")}
        >
          <Text style={styles.subscribeText}>Subscribe</Text>
        </Pressable>

        <Text style={styles.followTitle}>Follow Us</Text>
        <View style={styles.socialRow}>
          {SOCIALS.map((s) => (
            <View key={s.label} style={styles.socialCircle}>
              <Feather name={s.icon} size={16} color={C.mutedForeground} />
            </View>
          ))}
        </View>
      </View>

      <View style={styles.divider} />

      {/* Bottom bar */}
      <Text style={styles.copyright}>
        © {new Date().getFullYear()} PDF Genius by Mizan Store Ltd. All rights reserved.
      </Text>
      <View style={styles.badgeRow}>
        {SECURITY_BADGES.map((b) => (
          <View key={b.text} style={styles.badge}>
            <Feather name={b.icon} size={14} color={C.mutedForeground} />
            <Text style={styles.badgeText}>{b.text}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  footer: {
    marginTop: 28,
    paddingTop: 28,
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  brandLogo: { width: 132, height: 120, marginBottom: 10, marginLeft: -6 },
  tagline: { fontSize: 13, lineHeight: 20, color: C.mutedForeground, fontFamily: fonts.body },

  companyBlock: { marginTop: 18, gap: 10 },
  companyName: { fontSize: 14, color: C.foreground, fontFamily: fonts.bodySemibold },
  infoRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  infoIcon: { marginTop: 2 },
  infoText: { fontSize: 13, lineHeight: 19, color: C.mutedForeground, fontFamily: fonts.body },

  columns: { flexDirection: "row", flexWrap: "wrap", gap: 28, marginTop: 24 },
  column: { gap: 10, minWidth: 130 },
  columnTitle: { fontSize: 14, color: C.foreground, fontFamily: fonts.bodyBold, marginBottom: 2 },
  link: { fontSize: 13, color: C.mutedForeground, fontFamily: fonts.body },
  linkDisabled: { opacity: 0.5 },

  newsletter: { marginTop: 24, gap: 12 },
  newsletterText: { fontSize: 13, lineHeight: 20, color: C.mutedForeground, fontFamily: fonts.body },
  input: {
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: C.foreground,
    fontFamily: fonts.body,
    backgroundColor: C.card,
  },
  subscribeBtn: {
    backgroundColor: C.primary,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  subscribeText: { fontSize: 14, color: "#fff", fontFamily: fonts.bodySemibold },
  followTitle: { fontSize: 13, color: C.foreground, fontFamily: fonts.bodyMedium, marginTop: 4 },
  socialRow: { flexDirection: "row", gap: 12 },
  socialCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: C.muted,
    alignItems: "center",
    justifyContent: "center",
  },

  divider: { height: 1, backgroundColor: C.border, marginVertical: 22 },
  copyright: { fontSize: 12, lineHeight: 18, color: C.mutedForeground, fontFamily: fonts.body },
  badgeRow: { flexDirection: "row", flexWrap: "wrap", gap: 16, marginTop: 14 },
  badge: { flexDirection: "row", alignItems: "center", gap: 6 },
  badgeText: { fontSize: 12, color: C.mutedForeground, fontFamily: fonts.body },
});

export default AppFooter;
