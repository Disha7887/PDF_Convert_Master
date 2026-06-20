import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import AppFooter from "@/components/AppFooter";
import { Badge, Button, Card, Field, ScreenScroll } from "@/components/ui";
import colors from "@/constants/colors";
import { fonts, heroShadow } from "@/constants/theme";

const C = colors.light;
type FeatherName = keyof typeof Feather.glyphMap;

const HERO_STATS: { value: string; label: string }[] = [
  { value: "24/7", label: "Support Available" },
  { value: "<1hr", label: "Response Time" },
];

const METHODS: {
  icon: FeatherName;
  title: string;
  blurb: string;
  info: string;
  meta: string;
  comingSoon?: boolean;
}[] = [
  {
    icon: "phone",
    title: "Phone Support",
    blurb: "Call us directly for immediate assistance",
    info: "+447429919748",
    meta: "24/7 Available",
  },
  {
    icon: "mail",
    title: "Email Support",
    blurb: "Send us an email for detailed inquiries",
    info: "support@pdfconvertmaster.com",
    meta: "Response within 1 hour",
  },
  {
    icon: "message-square",
    title: "Live Chat",
    blurb: "Chat with our support team in real-time",
    info: "Feature in development",
    meta: "Coming Q2 2024",
    comingSoon: true,
  },
  {
    icon: "message-circle",
    title: "WhatsApp",
    blurb: "Quick support via WhatsApp messaging",
    info: "+447429919748",
    meta: "Quick response",
  },
];

export default function Screen() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const canSubmit = name.trim() !== "" && email.trim() !== "" && message.trim() !== "";

  const onSubmit = () => {
    if (!canSubmit) return;
    setSubmitted(true);
  };

  const reset = () => {
    setName("");
    setEmail("");
    setMessage("");
    setSubmitted(false);
  };

  return (
    <ScreenScroll contentStyle={{ paddingHorizontal: 0 }}>
      {/* Hero */}
      <LinearGradient
        colors={[C.blue900, C.primary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.hero, heroShadow]}
      >
        <Text style={styles.heroTitle}>Get Expert Help & Support</Text>
        <Text style={styles.heroSubtitle}>
          Our dedicated team is here to assist you with any questions, technical issues, or business
          inquiries. Choose how you'd like to connect with us.
        </Text>
        <View style={styles.heroStats}>
          {HERO_STATS.map((s) => (
            <View key={s.label} style={styles.heroStat}>
              <Text style={styles.heroStatValue}>{s.value}</Text>
              <Text style={styles.heroStatLabel}>{s.label}</Text>
            </View>
          ))}
        </View>
      </LinearGradient>

      <View style={styles.body}>
        {/* Contact Methods */}
        <View style={styles.sectionHead}>
          <Text style={styles.h2Center}>Choose Your Preferred Contact Method</Text>
          <Text style={styles.leadCenter}>
            We offer multiple ways to reach our support team. Pick the method that works best for you.
          </Text>
        </View>

        <View style={styles.stack}>
          {METHODS.map((m) => (
            <Card key={m.title}>
              <View style={styles.methodHead}>
                <View style={styles.methodIcon}>
                  <Feather name={m.icon} size={22} color={C.primary} />
                </View>
                {m.comingSoon ? <Badge label="Coming Soon" tone="warning" /> : null}
              </View>
              <Text style={styles.cardTitle}>{m.title}</Text>
              <Text style={styles.cardBody}>{m.blurb}</Text>
              <Text style={styles.methodInfoLabel}>Contact Info:</Text>
              <Text style={styles.methodInfo}>{m.info}</Text>
              <View style={styles.methodMetaRow}>
                <Feather name="clock" size={14} color={C.mutedForeground} />
                <Text style={styles.methodMeta}>{m.meta}</Text>
              </View>
            </Card>
          ))}
        </View>

        {/* Send Us a Message */}
        <View style={styles.sectionHead}>
          <Text style={styles.h2Center}>Send Us a Message</Text>
          <Text style={styles.leadCenter}>
            Fill out the form below and we'll get back to you as soon as possible
          </Text>
        </View>

        <Card>
          {submitted ? (
            <View style={styles.success}>
              <View style={styles.successIcon}>
                <Feather name="check-circle" size={32} color={C.success} />
              </View>
              <Text style={styles.successTitle}>Message Sent!</Text>
              <Text style={styles.successBody}>
                Thanks for reaching out. We'll get back to you as soon as possible.
              </Text>
              <Button label="Send another message" variant="outline" onPress={reset} />
            </View>
          ) : (
            <View style={styles.form}>
              <Field
                label="Full Name *"
                icon="user"
                placeholder="Enter your full name"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />
              <Field
                label="Email Address *"
                icon="mail"
                placeholder="your@email.com"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <Field
                label="Message *"
                placeholder="Please provide detailed information about your inquiry..."
                value={message}
                onChangeText={setMessage}
                multiline
                numberOfLines={5}
                style={styles.messageInput}
              />
              <View style={styles.secureRow}>
                <Feather name="shield" size={16} color={C.primary} />
                <Text style={styles.secureText}>Your information is secure and confidential</Text>
              </View>
              <Button
                label="Send Message"
                size="lg"
                fullWidth
                disabled={!canSubmit}
                onPress={onSubmit}
              />
            </View>
          )}
        </Card>

        <AppFooter />
      </View>
    </ScreenScroll>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: 20 },
  hero: { paddingHorizontal: 24, paddingVertical: 44, gap: 16 },
  heroTitle: { fontSize: 28, lineHeight: 36, color: "#fff", fontFamily: fonts.headingBold },
  heroSubtitle: { fontSize: 15, lineHeight: 23, color: "#ffe1de", fontFamily: fonts.body },
  heroStats: { flexDirection: "row", gap: 12, marginTop: 4 },
  heroStat: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
  },
  heroStatValue: { fontSize: 26, color: C.blue200, fontFamily: fonts.headingBold, marginBottom: 4 },
  heroStatLabel: { fontSize: 13, color: "#e2e8f0", fontFamily: fonts.body },

  sectionHead: { alignItems: "center", marginTop: 40, marginBottom: 20, gap: 8 },
  h2Center: { fontSize: 24, color: C.foreground, fontFamily: fonts.headingBold, textAlign: "center" },
  leadCenter: { fontSize: 15, lineHeight: 22, color: C.mutedForeground, fontFamily: fonts.body, textAlign: "center" },

  stack: { gap: 16 },
  methodHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    marginBottom: 14,
  },
  methodIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: C.blue100,
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: { fontSize: 18, color: C.foreground, fontFamily: fonts.headingBold, marginBottom: 6 },
  cardBody: { fontSize: 14, lineHeight: 22, color: C.mutedForeground, fontFamily: fonts.body, marginBottom: 14 },
  methodInfoLabel: { fontSize: 13, color: C.mutedForeground, fontFamily: fonts.body, marginBottom: 2 },
  methodInfo: { fontSize: 15, color: C.foreground, fontFamily: fonts.bodySemibold, marginBottom: 12 },
  methodMetaRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  methodMeta: { fontSize: 13, color: C.mutedForeground, fontFamily: fonts.body },

  form: { gap: 16 },
  messageInput: { minHeight: 120, textAlignVertical: "top", paddingTop: 6 },
  secureRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  secureText: { fontSize: 13, color: C.mutedForeground, fontFamily: fonts.body },

  success: { alignItems: "center", gap: 12, paddingVertical: 12 },
  successIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#dcfce7",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  successTitle: { fontSize: 20, color: C.foreground, fontFamily: fonts.headingBold },
  successBody: {
    fontSize: 14,
    lineHeight: 22,
    color: C.mutedForeground,
    fontFamily: fonts.body,
    textAlign: "center",
    marginBottom: 8,
  },
});
