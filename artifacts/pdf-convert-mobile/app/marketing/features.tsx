import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

import AppFooter from "@/components/AppFooter";
import { Button, Card, ScreenScroll, SectionHeading } from "@/components/ui";
import colors from "@/constants/colors";
import { ROUTES } from "@/constants/routes";
import { fonts, heroShadow } from "@/constants/theme";

const C = colors.light;

const HERO_GRADIENT = ["#0f172a", "#1e3a8a", "#1e293b"] as const;

const FEATURES: { icon: keyof typeof Feather.glyphMap; title: string; description: string }[] = [
  {
    icon: "zap",
    title: "Lightning Fast Processing",
    description: "Convert and process documents in seconds, not minutes",
  },
  {
    icon: "shield",
    title: "Enterprise-Grade Security",
    description: "Your documents are encrypted and processed securely",
  },
  {
    icon: "smartphone",
    title: "Cross-Platform Compatibility",
    description: "Works seamlessly across all devices and operating systems",
  },
];

export default function Screen() {
  const router = useRouter();

  return (
    <ScreenScroll>
      <LinearGradient
        colors={HERO_GRADIENT}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.hero, heroShadow]}
      >
        <Text style={styles.heroTitle}>Professional PDF Tools Built for Modern Workflows</Text>
        <Text style={styles.heroSubtitle}>
          From converting documents to merging files, our comprehensive suite of PDF tools handles
          every aspect of your document workflow with precision and speed.
        </Text>
      </LinearGradient>

      <SectionHeading
        align="center"
        eyebrow="Features"
        title="Everything you need to work with PDFs"
        style={{ marginTop: 28, marginBottom: 18 }}
      />

      <View style={{ gap: 16 }}>
        {FEATURES.map((feature) => (
          <Card key={feature.title} style={styles.featureCard}>
            <View style={styles.iconTile}>
              <Feather name={feature.icon} size={22} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.featureTitle}>{feature.title}</Text>
              <Text style={styles.featureDesc}>{feature.description}</Text>
            </View>
          </Card>
        ))}
      </View>

      <View style={{ marginTop: 24, gap: 12 }}>
        <Button
          label="Learn More..."
          iconRight="arrow-right"
          fullWidth
          onPress={() => router.push(ROUTES.learnMore as never)}
          testID="button-learn-more"
        />
        <Button
          label="Watch Demo"
          variant="outline"
          icon="play"
          fullWidth
          onPress={() => router.push(ROUTES.tools as never)}
          testID="button-watch-demo"
        />
      </View>

      <AppFooter />
    </ScreenScroll>
  );
}

const styles = StyleSheet.create({
  hero: {
    borderRadius: 20,
    padding: 24,
    gap: 14,
  },
  heroTitle: {
    fontSize: 26,
    lineHeight: 32,
    color: "#ffffff",
    fontFamily: fonts.headingBold,
  },
  heroSubtitle: {
    fontSize: 15,
    lineHeight: 23,
    color: "rgba(255,255,255,0.82)",
    fontFamily: fonts.body,
  },
  featureCard: { flexDirection: "row", alignItems: "center", gap: 14 },
  iconTile: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: C.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  featureTitle: { fontSize: 16, color: C.foreground, fontFamily: fonts.headingSemibold },
  featureDesc: {
    fontSize: 14,
    lineHeight: 20,
    color: C.mutedForeground,
    fontFamily: fonts.body,
    marginTop: 3,
  },
});
