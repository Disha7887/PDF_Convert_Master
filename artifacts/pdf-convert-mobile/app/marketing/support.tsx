import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import AppFooter from "@/components/AppFooter";
import { Badge, Button, Card, Chip, Field, ScreenScroll, SectionHeading } from "@/components/ui";
import colors from "@/constants/colors";
import { ROUTES } from "@/constants/routes";
import { fonts, heroShadow } from "@/constants/theme";

const C = colors.light;

const HERO_GRADIENT = ["#f7433d", "#e02d27", "#b9211c"] as const;

type FeatherName = keyof typeof Feather.glyphMap;

const POPULAR_TOPICS = [
  "How to convert PDF to Word",
  "Troubleshooting upload issues",
  "Account verification process",
  "API rate limits",
  "File size limitations",
];

const CONVERSION_GUIDE: { title: string; description: string }[] = [
  {
    title: "PDF to Word",
    description:
      "Convert PDF documents to editable Word files while preserving formatting and layout.",
  },
  {
    title: "PDF to Excel",
    description: "Extract tables and data from PDFs into Excel spreadsheets for analysis.",
  },
  {
    title: "Batch Conversion",
    description: "Process multiple files simultaneously to save time and improve efficiency.",
  },
];

const KNOWLEDGE_BASE: { title: string; description: string; icon: FeatherName; articles: number }[] = [
  { title: "Getting Started", description: "Basic setup and first steps", icon: "book-open", articles: 12 },
  { title: "Troubleshooting", description: "Common issues and solutions", icon: "tool", articles: 18 },
  { title: "Account & Billing", description: "Manage your account and payments", icon: "credit-card", articles: 8 },
  { title: "API Documentation", description: "Developer resources and guides", icon: "code", articles: 15 },
  { title: "File Conversion", description: "Converting between formats", icon: "file-text", articles: 22 },
  { title: "Advanced Features", description: "Pro tips and advanced usage", icon: "settings", articles: 9 },
];

const GETTING_STARTED_TOPICS = [
  "How to convert your first PDF",
  "Understanding file formats",
  "Creating your account",
  "Navigating the interface",
  "Setting up preferences",
  "Managing your files",
  "Understanding conversion limits",
  "Using batch conversion",
];

const HELP_OPTIONS: {
  title: string;
  description: string;
  icon: FeatherName;
  action: string;
  availability: string;
  route: string;
}[] = [
  {
    title: "Live Chat",
    description: "Get instant help from our support team",
    icon: "message-circle",
    action: "Start Chat",
    availability: "24/7 Support",
    route: ROUTES.contact,
  },
  {
    title: "Email Support",
    description: "Send us detailed questions via email",
    icon: "mail",
    action: "Send Email",
    availability: "< 2h response",
    route: ROUTES.contact,
  },
  {
    title: "Phone Support",
    description: "Speak directly with our experts",
    icon: "phone",
    action: "Call Now",
    availability: "+447429919748",
    route: ROUTES.contact,
  },
  {
    title: "Video Tutorials",
    description: "Watch step-by-step video guides",
    icon: "play",
    action: "Watch Videos",
    availability: "15+ tutorials",
    route: ROUTES.learnMore,
  },
];

const SUPPORT_STATS: { title: string; value: string; description: string; icon: FeatherName }[] = [
  { title: "Response Time", value: "< 2h", description: "Average response time", icon: "clock" },
  { title: "Satisfaction Rate", value: "98.3%", description: "Customer satisfaction", icon: "award" },
  { title: "Resolution Rate", value: "99.2%", description: "Issues resolved", icon: "target" },
  { title: "Articles Available", value: "15+", description: "Help articles", icon: "book-open" },
];

const SERVICE_STATUS = [
  "PDF Conversion API",
  "File Upload Service",
  "User Authentication",
  "Payment Processing",
];

const PERFORMANCE_METRICS: { label: string; value: string }[] = [
  { label: "API Response Time", value: "245ms" },
  { label: "Uptime (30 days)", value: "99.98%" },
  { label: "Conversion Success Rate", value: "99.95%" },
  { label: "Active Users", value: "15,432" },
];

export default function Screen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredCategories = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return KNOWLEDGE_BASE;
    return KNOWLEDGE_BASE.filter(
      (category) =>
        category.title.toLowerCase().includes(q) ||
        category.description.toLowerCase().includes(q),
    );
  }, [searchQuery]);

  return (
    <ScreenScroll>
      <LinearGradient
        colors={HERO_GRADIENT}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.hero, heroShadow]}
      >
        <Text style={styles.heroTitle}>How Can We Help You?</Text>
        <Text style={styles.heroSubtitle}>
          Get help with PDF Genius services with comprehensive support for all your PDF
          conversion needs
        </Text>

        <View style={{ marginTop: 6 }}>
          <Field
            icon="search"
            placeholder="Search for help topics..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
          />
        </View>

        <View style={styles.chipRow}>
          {POPULAR_TOPICS.map((topic) => (
            <Chip
              key={topic}
              label={topic}
              active={searchQuery === topic}
              onPress={() => setSearchQuery(topic)}
            />
          ))}
        </View>
      </LinearGradient>

      {/* File Conversion Guide */}
      <View style={{ marginTop: 28 }}>
        <SectionHeading
          align="center"
          title="File Conversion Guide"
          subtitle="Learn how to convert between different file formats with ease"
          style={{ marginBottom: 18 }}
        />
        <View style={{ gap: 16 }}>
          {CONVERSION_GUIDE.map((guide) => (
            <Card key={guide.title} style={{ gap: 12 }}>
              <Text style={styles.cardTitle}>{guide.title}</Text>
              <Text style={styles.cardBody}>{guide.description}</Text>
              <Button
                label="Learn More"
                variant="outline"
                size="sm"
                onPress={() => router.push(ROUTES.learnMore as never)}
                testID={`button-guide-${guide.title}`}
              />
            </Card>
          ))}
        </View>
      </View>

      {/* Knowledge Base */}
      <View style={{ marginTop: 32 }}>
        <SectionHeading
          align="center"
          title="Knowledge Base"
          subtitle="Find answers to common questions and learn how to use our features"
          style={{ marginBottom: 18 }}
        />
        {filteredCategories.length === 0 ? (
          <View style={styles.emptyState}>
            <Feather name="search" size={36} color={C.mutedForeground} />
            <Text style={styles.emptyText}>No topics match your search.</Text>
          </View>
        ) : (
          <View style={{ gap: 16 }}>
            {filteredCategories.map((category) => (
              <Card key={category.title} style={styles.kbCard}>
                <View style={styles.kbIcon}>
                  <Feather name={category.icon} size={22} color="#fff" />
                </View>
                <View style={{ flex: 1, gap: 6 }}>
                  <Text style={styles.cardTitle}>{category.title}</Text>
                  <Badge label={`${category.articles} articles`} tone="neutral" />
                  <Text style={styles.cardBody}>{category.description}</Text>
                </View>
              </Card>
            ))}
          </View>
        )}
      </View>

      {/* Getting Started */}
      <View style={{ marginTop: 32 }}>
        <SectionHeading
          title="Getting Started"
          subtitle="New to PDF Genius? Start here with our most popular getting started topics."
          style={{ marginBottom: 18 }}
        />
        <Card style={{ gap: 4 }}>
          {GETTING_STARTED_TOPICS.map((topic) => (
            <View key={topic} style={styles.topicRow}>
              <Feather name="check-circle" size={18} color={C.success} />
              <Text style={styles.topicText}>{topic}</Text>
            </View>
          ))}
        </Card>

        <Card style={[styles.videoCard, { marginTop: 16 }]}>
          <View style={styles.videoThumb}>
            <Feather name="play" size={36} color={C.primary} />
          </View>
          <Text style={styles.cardTitle}>Quick Start Video</Text>
          <Text style={styles.cardBody}>Watch our 5-minute overview to get started quickly</Text>
        </Card>
      </View>

      {/* Multiple Ways to Get Help */}
      <View style={{ marginTop: 32 }}>
        <SectionHeading
          align="center"
          title="Multiple Ways to Get Help"
          subtitle="Choose the support option that works best for you"
          style={{ marginBottom: 18 }}
        />
        <View style={{ gap: 16 }}>
          {HELP_OPTIONS.map((option) => (
            <Card key={option.title} style={styles.helpCard}>
              <View style={styles.helpIcon}>
                <Feather name={option.icon} size={26} color="#fff" />
              </View>
              <Text style={styles.cardTitle}>{option.title}</Text>
              <Text style={[styles.cardBody, { textAlign: "center" }]}>{option.description}</Text>
              <Button
                label={option.action}
                fullWidth
                onPress={() => router.push(option.route as never)}
                testID={`button-help-${option.title}`}
              />
              <Text style={styles.availability}>{option.availability}</Text>
            </Card>
          ))}
        </View>
      </View>

      {/* Support Performance */}
      <View style={{ marginTop: 32 }}>
        <SectionHeading
          align="center"
          title="Support Performance"
          subtitle="Our commitment to excellent customer service"
          style={{ marginBottom: 18 }}
        />
        <View style={styles.statsGrid}>
          {SUPPORT_STATS.map((stat) => (
            <Card key={stat.title} style={styles.statCard}>
              <Feather name={stat.icon} size={24} color={C.primary} />
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statTitle}>{stat.title}</Text>
              <Text style={styles.statDesc}>{stat.description}</Text>
            </Card>
          ))}
        </View>
      </View>

      {/* System Status */}
      <View style={{ marginTop: 32 }}>
        <SectionHeading
          align="center"
          title="System Status & Performance"
          subtitle="Real-time monitoring of our services"
          style={{ marginBottom: 18 }}
        />
        <View style={{ gap: 16 }}>
          <Card style={{ gap: 14 }}>
            <View style={styles.statusHeader}>
              <Feather name="server" size={18} color={C.foreground} />
              <Text style={styles.statusHeaderText}>Service Status</Text>
            </View>
            {SERVICE_STATUS.map((service) => (
              <View key={service} style={styles.statusRow}>
                <Text style={styles.statusLabel}>{service}</Text>
                <Badge label="Operational" tone="success" />
              </View>
            ))}
          </Card>

          <Card style={{ gap: 14 }}>
            <View style={styles.statusHeader}>
              <Feather name="trending-up" size={18} color={C.foreground} />
              <Text style={styles.statusHeaderText}>Performance Metrics</Text>
            </View>
            {PERFORMANCE_METRICS.map((metric) => (
              <View key={metric.label} style={styles.statusRow}>
                <Text style={styles.statusLabel}>{metric.label}</Text>
                <Text style={styles.metricValue}>{metric.value}</Text>
              </View>
            ))}
          </Card>
        </View>
      </View>

      {/* Contact CTA */}
      <Card style={[styles.contactCard, { marginTop: 32 }]}>
        <Text style={styles.cardTitle}>Still have questions?</Text>
        <Text style={[styles.cardBody, { textAlign: "center" }]}>
          Our support team is here to help you with anything you need.
        </Text>
        <Button
          label="Contact Support"
          icon="mail"
          fullWidth
          onPress={() => router.push(ROUTES.contact as never)}
          testID="button-contact-support"
        />
      </Card>

      <AppFooter />
    </ScreenScroll>
  );
}

const styles = StyleSheet.create({
  hero: { borderRadius: 20, padding: 24, gap: 12 },
  heroTitle: { fontSize: 28, lineHeight: 34, color: "#ffffff", fontFamily: fonts.headingBold },
  heroSubtitle: {
    fontSize: 15,
    lineHeight: 23,
    color: "rgba(255,255,255,0.85)",
    fontFamily: fonts.body,
  },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 4 },
  cardTitle: { fontSize: 17, color: C.foreground, fontFamily: fonts.headingSemibold },
  cardBody: { fontSize: 14, lineHeight: 21, color: C.mutedForeground, fontFamily: fonts.body },
  kbCard: { flexDirection: "row", alignItems: "flex-start", gap: 14 },
  kbIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: C.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  topicRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 8 },
  topicText: { flex: 1, fontSize: 14, color: C.foreground, fontFamily: fonts.bodyMedium },
  videoCard: { alignItems: "center", gap: 10 },
  videoThumb: {
    width: "100%",
    height: 150,
    borderRadius: 12,
    backgroundColor: C.blue50,
    alignItems: "center",
    justifyContent: "center",
  },
  helpCard: { alignItems: "center", gap: 10 },
  helpIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: C.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  availability: { fontSize: 12, color: C.mutedForeground, fontFamily: fonts.body },
  emptyState: { alignItems: "center", gap: 10, paddingVertical: 28 },
  emptyText: { fontSize: 14, color: C.mutedForeground, fontFamily: fonts.body },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  statCard: { flexGrow: 1, flexBasis: "45%", alignItems: "center", gap: 4 },
  statValue: { fontSize: 26, color: C.foreground, fontFamily: fonts.headingBold, marginTop: 4 },
  statTitle: { fontSize: 14, color: C.foreground, fontFamily: fonts.bodySemibold },
  statDesc: { fontSize: 12, color: C.mutedForeground, fontFamily: fonts.body, textAlign: "center" },
  statusHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  statusHeaderText: { fontSize: 16, color: C.foreground, fontFamily: fonts.headingSemibold },
  statusRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  statusLabel: { flex: 1, fontSize: 14, color: C.foreground, fontFamily: fonts.body },
  metricValue: { fontSize: 14, color: C.foreground, fontFamily: fonts.bodySemibold },
  contactCard: { alignItems: "center", gap: 12 },
});
