import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

import AppFooter from "@/components/AppFooter";
import AppHeader from "@/components/AppHeader";
import ToolCard from "@/components/ToolCard";
import {
  Badge,
  Button,
  Card,
  Divider,
  ScreenScroll,
  SectionHeading,
} from "@/components/ui";
import colors from "@/constants/colors";
import { ROUTES } from "@/constants/routes";
import { cardShadow, fonts, heroShadow } from "@/constants/theme";
import { PDF_CONVERTER_IDS, getToolById, type Tool } from "@/constants/tools";
import { HOME_STATS, TESTIMONIALS } from "@/mocks/data";

const C = colors.light;

type FeatherName = keyof typeof Feather.glyphMap;

// ─── Hero trust indicators (ported from HeroSection) ─────────────────────────
const TRUST_INDICATORS: { icon: FeatherName; text: string }[] = [
  { icon: "shield", text: "100% Secure" },
  { icon: "zap", text: "Instant Processing" },
  { icon: "star", text: "Always Free" },
];

// ─── Feature cards (ported from FeaturesSection) ─────────────────────────────
const FEATURE_CARDS: {
  title: string;
  icon: FeatherName;
  description: string;
  features: string[];
}[] = [
  {
    title: "Convert",
    icon: "repeat",
    description:
      "Transform your documents between different formats with perfect quality preservation.",
    features: ["PDF to Word", "Word to PDF", "Excel to PDF", "Image to PDF"],
  },
  {
    title: "Organize",
    icon: "layers",
    description:
      "Merge, split, and reorganize your PDF documents with powerful editing tools.",
    features: ["Merge PDFs", "Split PDFs", "Compress Files", "Rotate Pages"],
  },
  {
    title: "Secure",
    icon: "shield",
    description:
      "Protect your documents with advanced security features and encryption.",
    features: [
      "Password Protect",
      "Remove Password",
      "Add Watermark",
      "Digital Signature",
    ],
  },
];

// ─── API feature highlights (ported from APIDocumentationSection) ────────────
const API_FEATURES: { icon: FeatherName; title: string; description: string }[] = [
  { icon: "zap", title: "Lightning Fast", description: "Process documents in seconds" },
  { icon: "shield", title: "Enterprise Security", description: "Bank-level encryption" },
  { icon: "globe", title: "99.9% Uptime", description: "Reliable global infrastructure" },
];

const API_STATS: { value: string; label: string }[] = [
  { value: "10,000+", label: "Active Developers" },
  { value: "99.9%", label: "API Uptime" },
  { value: "100M+", label: "API Calls/Month" },
  { value: "50ms", label: "Avg Response Time" },
];

const CODE_SAMPLE = `curl -X POST "https://api.pdfconvertmaster.com/v1/convert" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: multipart/form-data" \\
  -F "file=@document.docx" \\
  -F "format=pdf"`;

export default function HomeScreen() {
  const router = useRouter();
  const go = (route: string) => router.push(route as never);

  const featuredTools = PDF_CONVERTER_IDS.map((id) => getToolById(id)).filter(
    (t): t is Tool => Boolean(t),
  );

  return (
    <ScreenScroll insetTop tabBar>
      <AppHeader />

      {/* ── 1. Hero ─────────────────────────────────────────────────────── */}
      <View style={[styles.hero, heroShadow]}>
        <Badge label="Trusted by 10M+ users worldwide" tone="primary" />
        <Text style={styles.heroTitle} testID="text-hero-title">
          Professional PDF tools trusted by millions
        </Text>
        <Text style={styles.heroDesc} testID="text-hero-description">
          Every tool you need to use PDFs, at your fingertips. All are 100% FREE
          and easy to use! Merge, split, compress, convert, rotate, unlock and
          watermark PDFs with just a few clicks.
        </Text>

        <View style={styles.heroCtas}>
          <Button
            label="Start Converting Now"
            icon="zap"
            size="lg"
            fullWidth
            onPress={() => go(ROUTES.tools)}
            testID="button-start-converting"
          />
          <Button
            label="View Pricing"
            iconRight="arrow-right"
            variant="outline"
            size="lg"
            fullWidth
            onPress={() => go(ROUTES.pricing)}
            testID="button-view-pricing"
          />
        </View>

        <View style={styles.trustRow}>
          {TRUST_INDICATORS.map((t) => (
            <View key={t.text} style={styles.trustItem}>
              <Feather name={t.icon} size={14} color={C.mutedForeground} />
              <Text style={styles.trustText}>{t.text}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* ── 2. Stats row ────────────────────────────────────────────────── */}
      <View style={styles.statsGrid}>
        {HOME_STATS.map((stat) => (
          <Card key={stat.label} style={styles.statCard}>
            <Text style={styles.statValue}>{stat.value}</Text>
            <Text style={styles.statLabel}>{stat.label}</Text>
          </Card>
        ))}
      </View>

      {/* ── 3. Featured tools ───────────────────────────────────────────── */}
      <SectionHeading
        eyebrow="Popular conversions"
        title="Everything You Need for PDF Success"
        subtitle="All your PDF and image tools in one place — tap any tool to get started instantly."
        style={styles.sectionHead}
      />
      <View style={styles.toolGrid}>
        {featuredTools.map((tool) => (
          <View key={tool.id} style={styles.toolGridItem}>
            <ToolCard tool={tool} variant="grid" />
          </View>
        ))}
      </View>
      <Button
        label="Browse All Tools — Free"
        iconRight="arrow-right"
        fullWidth
        style={styles.blockBtn}
        onPress={() => go(ROUTES.tools)}
        testID="button-browse-tools"
      />

      {/* ── 4. Features ─────────────────────────────────────────────────── */}
      <SectionHeading
        eyebrow="Industry leading performance"
        title="Transform Your PDF Workflow"
        subtitle="Discover how millions of users worldwide are revolutionizing their document management with our powerful PDF tools."
        style={styles.sectionHead}
      />
      <View style={styles.featureList}>
        {FEATURE_CARDS.map((card) => (
          <Card key={card.title} style={styles.featureCard}>
            <View style={styles.featureIconTile}>
              <Feather name={card.icon} size={26} color={C.primary} />
            </View>
            <Text style={styles.featureTitle}>{card.title}</Text>
            <Text style={styles.featureDesc}>{card.description}</Text>
            <View style={styles.featureBullets}>
              {card.features.map((f) => (
                <View key={f} style={styles.bulletRow}>
                  <View style={styles.bulletDot} />
                  <Text style={styles.bulletText}>{f}</Text>
                </View>
              ))}
            </View>
          </Card>
        ))}
      </View>

      {/* ── 5. Testimonials ─────────────────────────────────────────────── */}
      <SectionHeading
        eyebrow="Loved by professionals"
        title="What Our Users Say"
        subtitle="Join millions who trust PDF Convert Master for their document workflow."
        style={styles.sectionHead}
      />
      <View style={styles.testimonialList}>
        {TESTIMONIALS.map((t) => (
          <Card key={t.name} style={styles.testimonialCard}>
            <View style={styles.starRow}>
              {[0, 1, 2, 3, 4].map((i) => (
                <Feather key={i} name="star" size={14} color={C.warning} />
              ))}
            </View>
            <Text style={styles.quote}>“{t.quote}”</Text>
            <View style={styles.authorRow}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{t.initials}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.authorName}>{t.name}</Text>
                <Text style={styles.authorRole}>{t.role}</Text>
              </View>
            </View>
          </Card>
        ))}
      </View>

      {/* ── 6. API / CTA band ───────────────────────────────────────────── */}
      <View style={[styles.apiBand, cardShadow]}>
        <Badge label="Developer API" tone="primary" style={styles.apiBadge} />
        <SectionHeading
          align="center"
          title="Powerful PDF API for Developers"
          subtitle="Integrate PDF conversion and processing directly into your applications. Trusted by 10,000+ developers worldwide."
        />

        <View style={styles.apiFeatures}>
          {API_FEATURES.map((f) => (
            <View key={f.title} style={styles.apiFeatureRow}>
              <View style={styles.apiFeatureIcon}>
                <Feather name={f.icon} size={20} color={C.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.apiFeatureTitle}>{f.title}</Text>
                <Text style={styles.apiFeatureDesc}>{f.description}</Text>
              </View>
            </View>
          ))}
        </View>

        <Text style={styles.codeHeading}>Simple Integration</Text>
        <Text style={styles.codeSub}>Get started with just a few lines of code</Text>
        <View style={styles.codeBlock}>
          <Text style={styles.codeText}>{CODE_SAMPLE}</Text>
        </View>

        <Divider />

        <View style={styles.apiStatsGrid}>
          {API_STATS.map((s) => (
            <View key={s.label} style={styles.apiStatItem}>
              <Text style={styles.apiStatValue}>{s.value}</Text>
              <Text style={styles.apiStatLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.apiCtaTitle}>
          Ready to integrate PDF processing into your app?
        </Text>
        <Text style={styles.apiCtaDesc}>
          Get started with our free tier - 1,000 API calls per month, no credit
          card required.
        </Text>
        <View style={styles.apiCtaBtns}>
          <Button
            label="Get API Key"
            icon="code"
            fullWidth
            onPress={() => go(ROUTES.apiSetup)}
            testID="button-get-api-key"
          />
          <Button
            label="View Documentation"
            icon="book-open"
            iconRight="arrow-right"
            variant="outline"
            fullWidth
            onPress={() => go(ROUTES.apiReference)}
            testID="button-view-docs"
          />
        </View>
      </View>

      <AppFooter />
    </ScreenScroll>
  );
}

const styles = StyleSheet.create({
  // Hero
  hero: {
    backgroundColor: C.surfaceAlt,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: C.border,
    padding: 22,
    gap: 14,
    marginBottom: 24,
  },
  heroTitle: {
    fontSize: 30,
    lineHeight: 38,
    color: C.foreground,
    fontFamily: fonts.headingBold,
  },
  heroDesc: {
    fontSize: 15,
    lineHeight: 23,
    color: C.mutedForeground,
    fontFamily: fonts.body,
  },
  heroCtas: { gap: 12, marginTop: 4 },
  trustRow: { flexDirection: "row", flexWrap: "wrap", gap: 16, marginTop: 6 },
  trustItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  trustText: { fontSize: 13, color: C.mutedForeground, fontFamily: fonts.body },

  // Stats
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 12,
    marginBottom: 28,
  },
  statCard: { width: "48%", alignItems: "center", paddingVertical: 18 },
  statValue: { fontSize: 24, color: C.primary, fontFamily: fonts.headingBold },
  statLabel: {
    fontSize: 12.5,
    color: C.mutedForeground,
    fontFamily: fonts.body,
    marginTop: 4,
    textAlign: "center",
  },

  // Section heading spacing
  sectionHead: { marginBottom: 18 },

  // Featured tools grid
  toolGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 12,
  },
  toolGridItem: { width: "48%" },
  blockBtn: { marginTop: 16, marginBottom: 32 },

  // Feature cards
  featureList: { gap: 14, marginBottom: 32 },
  featureCard: { gap: 12 },
  featureIconTile: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: C.blue50,
    alignItems: "center",
    justifyContent: "center",
  },
  featureTitle: { fontSize: 19, color: C.foreground, fontFamily: fonts.headingBold },
  featureDesc: {
    fontSize: 14,
    lineHeight: 21,
    color: C.mutedForeground,
    fontFamily: fonts.body,
  },
  featureBullets: { gap: 8, marginTop: 2 },
  bulletRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  bulletDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.primary },
  bulletText: { fontSize: 13.5, color: C.foreground, fontFamily: fonts.body },

  // Testimonials
  testimonialList: { gap: 14, marginBottom: 32 },
  testimonialCard: { gap: 14 },
  starRow: { flexDirection: "row", gap: 3 },
  quote: {
    fontSize: 15,
    lineHeight: 23,
    color: C.foreground,
    fontFamily: fonts.body,
  },
  authorRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: C.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontSize: 14, color: C.primary, fontFamily: fonts.bodyBold },
  authorName: { fontSize: 14.5, color: C.foreground, fontFamily: fonts.headingSemibold },
  authorRole: { fontSize: 12.5, color: C.mutedForeground, fontFamily: fonts.body },

  // API / CTA band
  apiBand: {
    backgroundColor: C.surfaceAlt,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: C.border,
    padding: 22,
    gap: 16,
    marginBottom: 8,
  },
  apiBadge: { alignSelf: "center" },
  apiFeatures: { gap: 12 },
  apiFeatureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: C.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    padding: 14,
  },
  apiFeatureIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: C.blue50,
    alignItems: "center",
    justifyContent: "center",
  },
  apiFeatureTitle: { fontSize: 15, color: C.foreground, fontFamily: fonts.headingSemibold },
  apiFeatureDesc: { fontSize: 13, color: C.mutedForeground, fontFamily: fonts.body, marginTop: 2 },
  codeHeading: {
    fontSize: 18,
    color: C.foreground,
    fontFamily: fonts.headingBold,
    textAlign: "center",
  },
  codeSub: {
    fontSize: 13,
    color: C.mutedForeground,
    fontFamily: fonts.body,
    textAlign: "center",
    marginTop: -8,
  },
  codeBlock: {
    backgroundColor: "#0f172a",
    borderRadius: 14,
    padding: 16,
  },
  codeText: {
    fontSize: 12,
    lineHeight: 19,
    color: "#e2e8f0",
    fontFamily: "monospace",
  },
  apiStatsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 16,
  },
  apiStatItem: { width: "48%", alignItems: "center" },
  apiStatValue: { fontSize: 22, color: C.foreground, fontFamily: fonts.headingBold },
  apiStatLabel: {
    fontSize: 12.5,
    color: C.mutedForeground,
    fontFamily: fonts.body,
    marginTop: 4,
    textAlign: "center",
  },
  apiCtaTitle: {
    fontSize: 19,
    lineHeight: 26,
    color: C.foreground,
    fontFamily: fonts.headingBold,
    textAlign: "center",
  },
  apiCtaDesc: {
    fontSize: 14,
    lineHeight: 21,
    color: C.mutedForeground,
    fontFamily: fonts.body,
    textAlign: "center",
    marginTop: -8,
  },
  apiCtaBtns: { gap: 12 },
});
