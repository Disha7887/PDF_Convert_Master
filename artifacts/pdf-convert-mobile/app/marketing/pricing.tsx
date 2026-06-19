import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import AppFooter from "@/components/AppFooter";
import { Badge, Button, Card, Divider, ScreenScroll, SectionHeading } from "@/components/ui";
import colors from "@/constants/colors";
import { ROUTES } from "@/constants/routes";
import { fonts } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import { PLANS, type Plan } from "@/mocks/data";
import { mockApi } from "@/mocks/mockApi";

const C = colors.light;

export default function Screen() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [plans, setPlans] = useState<Plan[]>(PLANS);

  useEffect(() => {
    let mounted = true;
    mockApi.getPlans().then((p) => {
      if (mounted) setPlans(p);
    });
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <ScreenScroll>
      <SectionHeading
        align="center"
        eyebrow="Pricing"
        title={isAuthenticated ? "Manage Plans" : "Available Plans"}
        subtitle={
          isAuthenticated
            ? "Manage your subscription and billing"
            : "Pricing unlocks our developer API — every web tool stays free, no account required"
        }
        style={{ marginBottom: 24 }}
      />

      <View style={{ gap: 20 }}>
        {plans.map((plan) => {
          const popular = plan.popular;
          return (
            <Card
              key={plan.id}
              style={[
                styles.planCard,
                popular && { borderColor: C.primary, borderWidth: 2, backgroundColor: C.accent },
              ]}
            >
              {popular && (
                <Badge label="Most Popular" tone="primary" style={styles.popularBadge} />
              )}

              <Text style={styles.planName}>{plan.name}</Text>

              <View style={styles.priceRow}>
                <Text style={styles.price}>${plan.price}</Text>
                <Text style={styles.period}>/{plan.period}</Text>
              </View>

              <Text style={styles.planDesc}>{plan.description}</Text>

              <View style={styles.promo}>
                <Feather name="gift" size={14} color={C.blue700} />
                <Text style={styles.promoText}>12 months free</Text>
              </View>

              <Divider />

              <View style={{ gap: 12 }}>
                {plan.features.map((feature) => (
                  <View key={feature} style={styles.featureRow}>
                    <Feather name="check" size={18} color={C.success} />
                    <Text style={styles.featureText}>{feature}</Text>
                  </View>
                ))}
              </View>

              <Button
                label={plan.cta}
                variant={popular ? "primary" : "outline"}
                fullWidth
                onPress={() => router.push(ROUTES.signUp as never)}
                style={{ marginTop: 20 }}
                testID={`button-plan-${plan.id}`}
              />
            </Card>
          );
        })}
      </View>

      <AppFooter />
    </ScreenScroll>
  );
}

const styles = StyleSheet.create({
  planCard: { gap: 8 },
  popularBadge: { alignSelf: "center", marginBottom: 4 },
  planName: {
    fontSize: 20,
    color: C.foreground,
    fontFamily: fonts.headingBold,
    textAlign: "center",
  },
  priceRow: { flexDirection: "row", alignItems: "flex-end", justifyContent: "center" },
  price: { fontSize: 38, color: C.foreground, fontFamily: fonts.headingBold },
  period: {
    fontSize: 15,
    color: C.mutedForeground,
    fontFamily: fonts.body,
    marginLeft: 4,
    marginBottom: 6,
  },
  planDesc: {
    fontSize: 14,
    lineHeight: 20,
    color: C.mutedForeground,
    fontFamily: fonts.body,
    textAlign: "center",
  },
  promo: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "center",
    gap: 6,
    backgroundColor: C.blue50,
    borderWidth: 1,
    borderColor: C.blue200,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 5,
    marginTop: 4,
  },
  promoText: { fontSize: 12, color: C.blue700, fontFamily: fonts.bodySemibold },
  featureRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  featureText: { flex: 1, fontSize: 14, color: C.foreground, fontFamily: fonts.body },
});
