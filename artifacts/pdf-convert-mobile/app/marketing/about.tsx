import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

import AppFooter from "@/components/AppFooter";
import { Button, Card, ScreenScroll } from "@/components/ui";
import colors from "@/constants/colors";
import { ROUTES } from "@/constants/routes";
import { fonts, heroShadow } from "@/constants/theme";

const C = colors.light;
type FeatherName = keyof typeof Feather.glyphMap;

const CORE_VALUES: { icon: FeatherName; title: string; description: string }[] = [
  {
    icon: "shield",
    title: "Security First",
    description:
      "Your documents are processed with bank-level security. We never store your files and all transfers are encrypted.",
  },
  {
    icon: "zap",
    title: "Lightning Fast",
    description:
      "Our optimized conversion engine processes files in seconds, not minutes. Get your results instantly.",
  },
  {
    icon: "heart",
    title: "User-Centric",
    description:
      "Every feature is designed with you in mind. Simple, intuitive, and powerful tools that just work.",
  },
  {
    icon: "globe",
    title: "Accessible",
    description:
      "Available 24/7 from anywhere in the world. No downloads, no installations, just pure convenience.",
  },
  {
    icon: "wind",
    title: "Eco-Friendly",
    description:
      "Digital-first approach reduces paper waste. Our servers run on renewable energy sources.",
  },
  {
    icon: "headphones",
    title: "Expert Support",
    description:
      "Our dedicated support team is always ready to help. Professional assistance when you need it.",
  },
];

const TEAM: { name: string; position: string; description: string }[] = [
  {
    name: "Sarah Johnson",
    position: "Chief Executive Officer",
    description:
      "Leading PDF Genius with 15+ years of experience in tech innovation and digital transformation.",
  },
  {
    name: "Michael Chen",
    position: "Chief Technology Officer",
    description:
      "Architecting our cutting-edge conversion technology with expertise in cloud computing and AI systems.",
  },
  {
    name: "Emily Rodriguez",
    position: "Head of Product",
    description:
      "Ensuring our tools meet user needs through innovative design and user experience optimization.",
  },
  {
    name: "David Kim",
    position: "Head of Security",
    description:
      "Protecting user data with advanced security protocols and industry-leading encryption standards.",
  },
];

const TOUCH: { icon: FeatherName; title: string; line1: string; line2: string }[] = [
  { icon: "briefcase", title: "Company", line1: "Mizan Store Ltd", line2: "Professional PDF Solutions" },
  { icon: "phone", title: "Phone", line1: "+447429919748", line2: "Available 24/7" },
  { icon: "globe", title: "Website", line1: "pdfgenius.app", line2: "Your trusted PDF partner" },
];

function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function Screen() {
  const router = useRouter();

  return (
    <ScreenScroll contentStyle={{ paddingHorizontal: 0 }}>
      {/* Hero */}
      <LinearGradient
        colors={[C.blue900, C.primary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.hero, heroShadow]}
      >
        <Text style={styles.heroTitle}>
          About <Text style={styles.heroTitleAccent}>PDF Genius</Text>
        </Text>
        <Text style={styles.heroSubtitle}>
          Empowering businesses and individuals with professional PDF solutions since our founding
        </Text>
        <View style={styles.heroMeta}>
          <View style={styles.heroMetaItem}>
            <Feather name="briefcase" size={16} color={C.blue200} />
            <Text style={styles.heroMetaText}>Mizan Store Ltd</Text>
          </View>
          <View style={styles.heroMetaItem}>
            <Feather name="phone" size={16} color={C.blue200} />
            <Text style={styles.heroMetaText}>+447429919748</Text>
          </View>
        </View>
      </LinearGradient>

      <View style={styles.body}>
        {/* Our Story */}
        <Text style={styles.h2}>Our Story</Text>
        <Text style={styles.paragraph}>
          Founded with a vision to simplify document management, PDF Genius has become the
          trusted solution for millions of users worldwide. Our journey began when we recognized the
          growing need for reliable, secure, and user-friendly PDF tools.
        </Text>
        <Text style={styles.paragraph}>
          Under the umbrella of Mizan Store Ltd, we've built a platform that combines cutting-edge
          technology with intuitive design, making professional PDF conversion accessible to everyone.
        </Text>

        <View style={styles.statRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>10M+</Text>
            <Text style={styles.statLabel}>Files Processed</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>150+</Text>
            <Text style={styles.statLabel}>Countries Served</Text>
          </View>
        </View>

        {/* Core Values */}
        <View style={styles.sectionHeadCenter}>
          <Text style={styles.h2Center}>Our Core Values</Text>
          <Text style={styles.leadCenter}>
            These principles guide everything we do at PDF Genius
          </Text>
        </View>
        <View style={styles.stack}>
          {CORE_VALUES.map((value) => (
            <Card key={value.title}>
              <View style={styles.valueIcon}>
                <Feather name={value.icon} size={22} color={C.primary} />
              </View>
              <Text style={styles.cardTitle}>{value.title}</Text>
              <Text style={styles.cardBody}>{value.description}</Text>
            </Card>
          ))}
        </View>

        {/* Meet Our Team */}
        <View style={styles.sectionHeadCenter}>
          <Text style={styles.h2Center}>Meet Our Team</Text>
          <Text style={styles.leadCenter}>The passionate professionals behind PDF Genius</Text>
        </View>
        <View style={styles.stack}>
          {TEAM.map((member) => (
            <Card key={member.name} style={styles.teamCard}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{initials(member.name)}</Text>
              </View>
              <Text style={styles.teamName}>{member.name}</Text>
              <Text style={styles.teamPosition}>{member.position}</Text>
              <Text style={styles.teamDesc}>{member.description}</Text>
            </Card>
          ))}
        </View>
      </View>

      {/* Get in Touch */}
      <LinearGradient
        colors={["#1e293b", "#0f172a"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.touch}
      >
        <Text style={styles.h2Light}>Get in Touch</Text>
        <Text style={styles.leadLight}>
          Have questions about our services? We'd love to hear from you.
        </Text>
        <View style={styles.touchStack}>
          {TOUCH.map((t) => (
            <View key={t.title} style={styles.touchItem}>
              <View style={styles.touchIcon}>
                <Feather name={t.icon} size={24} color="#fff" />
              </View>
              <Text style={styles.touchTitle}>{t.title}</Text>
              <Text style={styles.touchLine1}>{t.line1}</Text>
              <Text style={styles.touchLine2}>{t.line2}</Text>
            </View>
          ))}
        </View>
        <View style={styles.touchCta}>
          <Button
            label="Contact Us Today"
            variant="secondary"
            size="lg"
            onPress={() => router.push(ROUTES.contact)}
          />
        </View>
      </LinearGradient>

      <View style={styles.body}>
        <AppFooter />
      </View>
    </ScreenScroll>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: 20 },
  hero: {
    paddingHorizontal: 24,
    paddingVertical: 44,
    alignItems: "center",
    gap: 16,
  },
  heroTitle: {
    fontSize: 30,
    lineHeight: 38,
    textAlign: "center",
    color: "#fff",
    fontFamily: fonts.headingBold,
  },
  heroTitleAccent: { color: C.blue200 },
  heroSubtitle: {
    fontSize: 15,
    lineHeight: 23,
    textAlign: "center",
    color: "#ffe1de",
    fontFamily: fonts.body,
  },
  heroMeta: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 18, marginTop: 4 },
  heroMetaItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  heroMetaText: { color: "#fff", fontSize: 14, fontFamily: fonts.bodyMedium },

  h2: { fontSize: 24, color: C.foreground, fontFamily: fonts.headingBold, marginTop: 28, marginBottom: 12 },
  paragraph: { fontSize: 15, lineHeight: 24, color: C.mutedForeground, fontFamily: fonts.body, marginBottom: 12 },

  statRow: { flexDirection: "row", gap: 16, marginTop: 12 },
  statItem: { flex: 1, alignItems: "center" },
  statValue: { fontSize: 28, color: C.primary, fontFamily: fonts.headingBold, marginBottom: 4 },
  statLabel: { fontSize: 14, color: C.mutedForeground, fontFamily: fonts.body },

  sectionHeadCenter: { alignItems: "center", marginTop: 40, marginBottom: 20, gap: 8 },
  h2Center: { fontSize: 24, color: C.foreground, fontFamily: fonts.headingBold, textAlign: "center" },
  leadCenter: { fontSize: 15, lineHeight: 22, color: C.mutedForeground, fontFamily: fonts.body, textAlign: "center" },

  stack: { gap: 16 },
  valueIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: C.blue100,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  cardTitle: { fontSize: 18, color: C.foreground, fontFamily: fonts.headingBold, marginBottom: 8 },
  cardBody: { fontSize: 14, lineHeight: 22, color: C.mutedForeground, fontFamily: fonts.body },

  teamCard: { alignItems: "center" },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: C.blue600,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  avatarText: { color: "#fff", fontSize: 24, fontFamily: fonts.headingBold },
  teamName: { fontSize: 18, color: C.foreground, fontFamily: fonts.headingBold, marginBottom: 4, textAlign: "center" },
  teamPosition: { fontSize: 14, color: C.primary, fontFamily: fonts.bodySemibold, marginBottom: 8, textAlign: "center" },
  teamDesc: { fontSize: 13, lineHeight: 21, color: C.mutedForeground, fontFamily: fonts.body, textAlign: "center" },

  touch: { marginTop: 40, paddingHorizontal: 24, paddingVertical: 44 },
  h2Light: { fontSize: 24, color: "#fff", fontFamily: fonts.headingBold, textAlign: "center", marginBottom: 10 },
  leadLight: { fontSize: 15, lineHeight: 22, color: "#e2e8f0", fontFamily: fonts.body, textAlign: "center", marginBottom: 8 },
  touchStack: { gap: 28, marginTop: 24 },
  touchItem: { alignItems: "center" },
  touchIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  touchTitle: { fontSize: 18, color: "#fff", fontFamily: fonts.headingBold, marginBottom: 8 },
  touchLine1: { fontSize: 14, color: "#e2e8f0", fontFamily: fonts.bodyMedium, marginBottom: 2 },
  touchLine2: { fontSize: 13, color: "#cbd5e1", fontFamily: fonts.body },
  touchCta: { alignItems: "center", marginTop: 24 },
});
