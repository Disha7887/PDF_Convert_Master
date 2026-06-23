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
import { fetchPlans, type Plan } from "@/services/plans";

const C = colors.light;

export default function Screen() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  const [plans, setPlans] = useState<Plan[]>([]);

  useEffect(() => {
    let mounted = true;
    fetchPlans()
      .then((p) => mounted && setPlans(p))
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  const currentPlanId = (user?.plan ?? "free").toLowerCase();

  return (
    <ScreenScroll>
      <SectionHeading
        align="center"
        eyebrow="Pricing"
        title={isAuthenticated ? "Your Plans" : "Available Plans"}
        subtitle={
          isAuthenticated
            ? "Switch plans instantly — manage your subscription anytime"
            : "Pricing unlocks our developer API — every web tool stays free, no account required"
        }
        style={{ marginBottom: 24 }}
      />

      <View style={{ gap: 20 }}>
        {plans.map((plan) => {
          const popular = plan.popular;
          const isCurrent = isAuthenticated && plan.id === currentPlanId;
          return (
            <Card
              key={plan.id}
              style={[
                styles.planCard,
                (popular || isCurrent) && {
                  borderColor: C.primary,
                  borderWidth: 2,
                  backgroundColor: C.accent,
                },
              ]}
            >
              {isCurrent ? (
                <Badge label="Your Plan" tone="primary" style={styles.popularBadge} />
              ) : popular ? (
                <Badge label="Most Popular" tone="primary" style={styles.popularBadge} />
              ) : null}

              <Text style={styles.planName}>{plan.name}</Text>

              <View style={styles.priceRow}>
                <Text style={styles.price}>${plan.price}</Text>
                <Text style={styles.period}>/month</Text>
              </View>

              <Text style={styles.planDesc}>{plan.description}</Text>

              <Divider />

              <View style={{ gap: 12 }}>
                {plan.features.map((feature) => (
                  <View key={feature} style={styles.featureRow}>
                    <Feather name="check" size={18} color={C.primary} />
                    <Text style={styles.featureText}>{feature}</Text>
                  </View>
                ))}
              </View>

              <Button
                label={
                  isCurrent
                    ? "Current Plan"
                    : isAuthenticated
                      ? "Manage Plan"
                      : plan.cta
                }
                variant={isCurrent ? "secondary" : popular ? "primary" : "outline"}
                disabled={isCurrent}
                fullWidth
                onPress={() =>
                  router.push(
                    (isAuthenticated ? ROUTES.managePlans : ROUTES.signUp) as never,
                  )
                }
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
  featureRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  featureText: { flex: 1, fontSize: 14, color: C.foreground, fontFamily: fonts.body },
});
