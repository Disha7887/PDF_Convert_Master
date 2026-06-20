import { Feather } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";

import AppFooter from "@/components/AppFooter";
import ToolCard from "@/components/ToolCard";
import { Button, Card, ScreenScroll } from "@/components/ui";
import colors from "@/constants/colors";
import { ROUTES } from "@/constants/routes";
import { fonts, heroShadow } from "@/constants/theme";
import { getToolById } from "@/constants/tools";
import { HOME_STATS, TESTIMONIALS } from "@/mocks/data";

const C = colors.light;
type FeatherName = keyof typeof Feather.glyphMap;

const TRUST_INDICATORS: { icon: FeatherName; text: string }[] = [
  { icon: "shield", text: "100% Secure" },
  { icon: "zap", text: "Instant Processing" },
  { icon: "star", text: "Always Free" },
];

const FEATURE_CARDS: {
  icon: FeatherName;
  title: string;
  description: string;
  features: string[];
}[] = [
  {
    icon: "repeat",
    title: "Convert",
    description:
      "Transform your documents between formats with perfect quality preservation.",
    features: ["PDF to Word", "Word to PDF", "Excel to PDF", "Image to PDF"],
  },
  {
    icon: "layers",
    title: "Organize",
    description:
      "Merge, split, and reorganize your PDF documents with powerful editing tools.",
    features: ["Merge PDFs", "Split PDFs", "Compress Files", "Rotate Pages"],
  },
  {
    icon: "shield",
    title: "Secure",
    description:
      "Protect your documents with advanced security features and encryption.",
    features: ["Sign PDFs", "Add Watermark", "Remove Pages", "Crop & Redact"],
  },
];

const API_FEATURES: { icon: FeatherName; title: string; description: string }[] = [
  { icon: "zap", title: "Lightning Fast", description: "Process documents in seconds" },
  { icon: "lock", title: "Enterprise Security", description: "Bank-level encryption" },
  { icon: "globe", title: "99.9% Uptime", description: "Reliable global infrastructure" },
];

const CURL_SNIPPET = `curl -X POST "https://api.pdfconvertmaster.com/v1/convert" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: multipart/form-data" \\
  -F "file=@document.docx" \\
  -F "format=pdf"`;

const POPULAR_TOOL_IDS = [
  "pdf-to-word",
  "merge-pdfs",
  "compress-pdf",
  "pdf-to-excel",
  "images-to-pdf",
  "remove-background",
  "split-pdf",
  "edit-pdf",
];

function HeroButton({
  label,
  icon,
  onPress,
  variant,
  testID,
  style,
}: {
  label: string;
  icon: FeatherName;
  onPress: () => void;
  variant: "solid" | "outline";
  testID?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const isSolid = variant === "solid";
  return (
    <Pressable
      onPress={onPress}
      testID={testID}
      style={({ pressed }) => [
        styles.heroBtn,
        isSolid
          ? { backgroundColor: "#ffffff", borderColor: "#ffffff" }
          : { backgroundColor: "rgba(255,255,255,0.14)", borderColor: "rgba(255,255,255,0.6)" },
        { opacity: pressed ? 0.9 : 1 },
        style,
      ]}
    >
      <Feather name={icon} size={18} color={isSolid ? C.primary : "#ffffff"} />
      <Text style={[styles.heroBtnText, { color: isSolid ? C.primary : "#ffffff" }]}>
        {label}
      </Text>
    </Pressable>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [copied, setCopied] = useState(false);

  const go = (route: string) => router.push(route as never);

  const handleCopy = async () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
    await Clipboard.setStringAsync(CURL_SNIPPET);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const colWidth = width < 360 ? "100%" : "48%";

  return (
    <ScreenScroll navInset tabBar contentStyle={{ paddingHorizontal: 0 }}>
      {/* ─── Hero ─────────────────────────────────────────────────────────── */}
      <LinearGradient
        colors={[C.blue900, C.primary, C.blue500]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.hero, heroShadow]}
      >
        <View style={styles.heroBadge}>
          <Feather name="users" size={13} color="#fff" />
          <Text style={styles.heroBadgeText}>Trusted by 10M+ users worldwide</Text>
        </View>

        <Text style={styles.heroTitle} testID="text-hero-title">
          Professional PDF tools trusted by millions
        </Text>
        <Text style={styles.heroTagline} testID="text-hero-description">
          Every tool you need to work with PDFs, right in your pocket. Convert, merge,
          compress, sign and scan — fast, secure and 100% free.
        </Text>

        <View style={styles.heroCtaRow}>
          <HeroButton
            label="Start Converting"
            icon="zap"
            variant="solid"
            onPress={() => go(ROUTES.tools)}
            testID="button-hero-start"
            style={styles.heroCtaItem}
          />
          <HeroButton
            label="Scan a Document"
            icon="camera"
            variant="outline"
            onPress={() => go(ROUTES.scanner)}
            testID="button-hero-scan"
            style={styles.heroCtaItem}
          />
        </View>

        <View style={styles.trustRow}>
          {TRUST_INDICATORS.map((t) => (
            <View key={t.text} style={styles.trustItem}>
              <Feather name={t.icon} size={14} color="#ffe1de" />
              <Text style={styles.trustText}>{t.text}</Text>
            </View>
          ))}
        </View>
      </LinearGradient>

      <View style={styles.body}>
        {/* ─── Stats grid ─────────────────────────────────────────────────── */}
        <View style={styles.statsGrid}>
          {HOME_STATS.map((s) => (
            <Card key={s.label} style={styles.statCard}>
              <Text style={styles.statValue} testID={`text-stat-${s.label}`}>
                {s.value}
              </Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </Card>
          ))}
        </View>

        {/* ─── Feature cards ──────────────────────────────────────────────── */}
        <View style={styles.sectionHead}>
          <Text style={styles.eyebrow}>EVERYTHING IN ONE PLACE</Text>
          <Text style={styles.h2}>Transform your PDF workflow</Text>
          <Text style={styles.lead}>
            A comprehensive suite of tools that handles every aspect of your document
            workflow with precision and speed.
          </Text>
        </View>
        <View style={styles.stack}>
          {FEATURE_CARDS.map((card) => (
            <Card key={card.title}>
              <View style={styles.featureIcon}>
                <Feather name={card.icon} size={24} color={C.primary} />
              </View>
              <Text style={styles.cardTitle}>{card.title}</Text>
              <Text style={styles.cardBody}>{card.description}</Text>
              <View style={styles.featureList}>
                {card.features.map((f) => (
                  <View key={f} style={styles.featureRow}>
                    <View style={styles.featureDot} />
                    <Text style={styles.featureText}>{f}</Text>
                  </View>
                ))}
              </View>
            </Card>
          ))}
        </View>

        {/* ─── Popular tools grid ─────────────────────────────────────────── */}
        <View style={styles.sectionHead}>
          <Text style={styles.eyebrow}>POPULAR TOOLS</Text>
          <Text style={styles.h2}>Jump straight in</Text>
          <Text style={styles.lead}>
            Tap any tool to get started instantly — no sign-up required.
          </Text>
        </View>
        <View style={styles.toolsGrid}>
          {POPULAR_TOOL_IDS.map((id) => {
            const tool = getToolById(id);
            if (!tool) return null;
            return (
              <View key={id} style={{ width: colWidth }}>
                <ToolCard tool={tool} variant="grid" />
              </View>
            );
          })}
        </View>
        <Button
          label="Browse all tools"
          variant="outline"
          size="lg"
          fullWidth
          iconRight="arrow-right"
          onPress={() => go(ROUTES.tools)}
          testID="button-browse-tools"
          style={styles.browseBtn}
        />

        {/* ─── API / Developer card ───────────────────────────────────────── */}
        <View style={styles.sectionHead}>
          <Text style={styles.eyebrow}>DEVELOPER API</Text>
          <Text style={styles.h2}>Powerful PDF API for developers</Text>
          <Text style={styles.lead}>
            Integrate PDF conversion and processing directly into your applications.
            Trusted by 10,000+ developers worldwide.
          </Text>
        </View>

        <View style={styles.apiFeatureRow}>
          {API_FEATURES.map((f) => (
            <Card key={f.title} style={styles.apiFeatureCard}>
              <View style={styles.apiFeatureIcon}>
                <Feather name={f.icon} size={20} color={C.primary} />
              </View>
              <Text style={styles.apiFeatureTitle}>{f.title}</Text>
              <Text style={styles.apiFeatureDesc}>{f.description}</Text>
            </Card>
          ))}
        </View>

        <Card style={styles.codeCard} padded={false}>
          <View style={styles.codeHeader}>
            <Text style={styles.codeHeaderText}>Quick start</Text>
            <Pressable
              onPress={handleCopy}
              hitSlop={8}
              style={styles.copyBtn}
              testID="button-copy-curl"
            >
              <Feather
                name={copied ? "check" : "copy"}
                size={14}
                color={copied ? C.success : C.primary}
              />
              <Text style={[styles.copyText, copied && { color: C.success }]}>
                {copied ? "Copied" : "Copy"}
              </Text>
            </Pressable>
          </View>
          <View style={styles.codeBody}>
            <Text style={styles.codeText} selectable testID="text-curl-snippet">
              {CURL_SNIPPET}
            </Text>
          </View>
        </Card>

        <View style={styles.apiCtaRow}>
          <Button
            label="Get API Key"
            icon="code"
            size="lg"
            onPress={() => go(ROUTES.apiSetup)}
            testID="button-get-api-key"
            style={styles.apiCtaItem}
          />
          <Button
            label="View Docs"
            icon="book-open"
            variant="outline"
            size="lg"
            onPress={() => go(ROUTES.apiReference)}
            testID="button-view-docs"
            style={styles.apiCtaItem}
          />
        </View>

        {/* ─── Testimonials ───────────────────────────────────────────────── */}
        <View style={styles.sectionHead}>
          <Text style={styles.eyebrow}>LOVED BY PROFESSIONALS</Text>
          <Text style={styles.h2}>What our users say</Text>
        </View>
        <View style={styles.stack}>
          {TESTIMONIALS.map((t) => (
            <Card key={t.name}>
              <View style={styles.quoteStars}>
                {[0, 1, 2, 3, 4].map((i) => (
                  <Feather key={i} name="star" size={14} color={C.primary} />
                ))}
              </View>
              <Text style={styles.quote}>“{t.quote}”</Text>
              <View style={styles.quoteAuthor}>
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

        {/* ─── Final CTA ──────────────────────────────────────────────────── */}
        <Card style={styles.finalCta}>
          <Text style={styles.finalTitle}>Ready to transform your PDF workflow?</Text>
          <Text style={styles.finalBody}>
            Every tool is 100% free with no sign-up required. Create an account only when
            you&apos;re ready to access our developer API.
          </Text>
          <Button
            label="Browse all tools — Free"
            size="lg"
            fullWidth
            onPress={() => go(ROUTES.tools)}
            testID="button-final-browse"
          />
          <Button
            label="Learn how it works"
            variant="ghost"
            size="lg"
            fullWidth
            iconRight="arrow-right"
            onPress={() => go(ROUTES.learnMore)}
            testID="button-learn-more"
            style={{ marginTop: 8 }}
          />
        </Card>

        {/* ─── Footer ─────────────────────────────────────────────────────── */}
        <AppFooter />
      </View>
    </ScreenScroll>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: 20 },

  // Hero
  hero: {
    paddingHorizontal: 24,
    paddingVertical: 40,
    alignItems: "center",
    gap: 16,
  },
  heroBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    backgroundColor: "rgba(255,255,255,0.18)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.4)",
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
  },
  heroBadgeText: { fontSize: 12.5, color: "#fff", fontFamily: fonts.bodySemibold },
  heroTitle: {
    fontSize: 30,
    lineHeight: 38,
    textAlign: "center",
    color: "#fff",
    fontFamily: fonts.headingBold,
  },
  heroTagline: {
    fontSize: 15,
    lineHeight: 23,
    textAlign: "center",
    color: "#ffe1de",
    fontFamily: fonts.body,
  },
  heroCtaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 12,
    marginTop: 6,
    alignSelf: "stretch",
  },
  heroCtaItem: { flexGrow: 1, flexBasis: 150 },
  heroBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 14,
    paddingHorizontal: 18,
  },
  heroBtnText: { fontSize: 15, fontFamily: fonts.bodySemibold },
  trustRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 16,
    marginTop: 6,
  },
  trustItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  trustText: { fontSize: 13, color: "#ffe1de", fontFamily: fonts.bodyMedium },

  // Section headings
  sectionHead: { marginTop: 36, marginBottom: 18, gap: 8 },
  eyebrow: {
    fontSize: 12,
    letterSpacing: 1.2,
    color: C.primary,
    fontFamily: fonts.bodySemibold,
  },
  h2: { fontSize: 24, lineHeight: 30, color: C.foreground, fontFamily: fonts.headingBold },
  lead: { fontSize: 15, lineHeight: 23, color: C.mutedForeground, fontFamily: fonts.body },

  // Stats
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 12,
    marginTop: 24,
  },
  statCard: { width: "47%", flexGrow: 1, alignItems: "center", paddingVertical: 20 },
  statValue: { fontSize: 26, color: C.primary, fontFamily: fonts.headingBold, marginBottom: 4 },
  statLabel: { fontSize: 13, color: C.mutedForeground, fontFamily: fonts.body, textAlign: "center" },

  // Feature cards
  stack: { gap: 16 },
  featureIcon: {
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
  featureList: { marginTop: 14, gap: 9 },
  featureRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  featureDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.primary },
  featureText: { fontSize: 14, color: C.foreground, fontFamily: fonts.body },

  // Popular tools
  toolsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 12,
  },
  browseBtn: { marginTop: 16 },

  // API features
  apiFeatureRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 12,
  },
  apiFeatureCard: { width: "100%", flexGrow: 1 },
  apiFeatureIcon: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: C.blue50,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  apiFeatureTitle: { fontSize: 16, color: C.foreground, fontFamily: fonts.headingSemibold, marginBottom: 4 },
  apiFeatureDesc: { fontSize: 13.5, color: C.mutedForeground, fontFamily: fonts.body },

  // Code card
  codeCard: { marginTop: 16, overflow: "hidden" },
  codeHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  codeHeaderText: { fontSize: 13, color: C.mutedForeground, fontFamily: fonts.bodySemibold },
  copyBtn: { flexDirection: "row", alignItems: "center", gap: 6 },
  copyText: { fontSize: 13, color: C.primary, fontFamily: fonts.bodySemibold },
  codeBody: { padding: 16 },
  codeText: {
    fontSize: 12.5,
    lineHeight: 20,
    color: C.foreground,
    fontFamily: Platform.select({ ios: "Menlo", android: "monospace", default: "monospace" }),
  },

  apiCtaRow: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginTop: 16 },
  apiCtaItem: { flexGrow: 1, flexBasis: 150 },

  // Testimonials
  quoteStars: { flexDirection: "row", gap: 3, marginBottom: 12 },
  quote: { fontSize: 14.5, lineHeight: 23, color: C.foreground, fontFamily: fonts.body },
  quoteAuthor: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 16 },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: C.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: "#fff", fontSize: 15, fontFamily: fonts.headingBold },
  authorName: { fontSize: 15, color: C.foreground, fontFamily: fonts.bodySemibold },
  authorRole: { fontSize: 13, color: C.mutedForeground, fontFamily: fonts.body, marginTop: 1 },

  // Final CTA
  finalCta: { marginTop: 36, alignItems: "center", paddingVertical: 28, gap: 6 },
  finalTitle: {
    fontSize: 20,
    lineHeight: 27,
    color: C.foreground,
    fontFamily: fonts.headingBold,
    textAlign: "center",
  },
  finalBody: {
    fontSize: 14,
    lineHeight: 22,
    color: C.mutedForeground,
    fontFamily: fonts.body,
    textAlign: "center",
    marginBottom: 14,
  },
});
