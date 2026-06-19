import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { Badge, Button, Card, ScreenScroll } from "@/components/ui";
import colors from "@/constants/colors";
import { ROUTES } from "@/constants/routes";
import { cardShadow, fonts } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import { DEMO_USER, USAGE_STATS, type Plan } from "@/mocks/data";
import { mockApi } from "@/mocks/mockApi";

const C = colors.light;

function formatPrice(plan: Plan): string {
  return plan.price === 0 ? "$0" : `$${plan.price}`;
}

function UsageStat({
  title,
  icon,
  used,
  total,
  usedLabel,
  totalLabel,
}: {
  title: string;
  icon: keyof typeof Feather.glyphMap;
  used: number;
  total: number;
  usedLabel: string;
  totalLabel: string;
}) {
  const pct = total > 0 ? Math.min(100, (used / total) * 100) : 0;
  return (
    <View style={styles.usageCard}>
      <View style={styles.usageHead}>
        <Text style={styles.usageTitle}>{title}</Text>
        <Feather name={icon} size={18} color={C.primary} />
      </View>
      <View style={styles.usageValueRow}>
        <Text style={styles.usageValue}>{usedLabel}</Text>
        <Text style={styles.usageOf}>of {totalLabel}</Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${pct}%` }]} />
      </View>
      <Text style={styles.usagePct}>{pct.toFixed(1)}% used</Text>
    </View>
  );
}

function AuthGate() {
  const router = useRouter();
  return (
    <View style={styles.gate}>
      <View style={styles.gateIcon}>
        <Feather name="lock" size={28} color={C.primary} />
      </View>
      <Text style={styles.gateTitle}>Sign in required</Text>
      <Text style={styles.gateText}>Sign in to manage your subscription and billing.</Text>
      <Button label="Sign In" icon="log-in" onPress={() => router.push(ROUTES.signIn as never)} />
    </View>
  );
}

export default function ManagePlansScreen() {
  const { isAuthenticated, user } = useAuth();

  const [plans, setPlans] = useState<Plan[]>([]);
  const [confirmation, setConfirmation] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) return;
    let active = true;
    mockApi.getPlans().then((p) => {
      if (active) setPlans(p);
    });
    return () => {
      active = false;
    };
  }, [isAuthenticated]);

  const currentPlanId = (user?.plan ?? DEMO_USER.plan).toLowerCase();
  const currentPlan = useMemo(
    () => plans.find((p) => p.id === currentPlanId),
    [plans, currentPlanId],
  );

  const handleSubscribe = async (plan: Plan) => {
    setPendingId(plan.id);
    await mockApi.subscribe(plan.id);
    setPendingId(null);
    setConfirmation(`Your plan change to ${plan.name} has been requested.`);
  };

  if (!isAuthenticated) {
    return (
      <ScreenScroll>
        <AuthGate />
      </ScreenScroll>
    );
  }

  const storageGbUsed = (USAGE_STATS.storageUsedMB / 1024).toFixed(1);
  const storageGbTotal = Math.round(USAGE_STATS.storageLimitMB / 1024);

  return (
    <ScreenScroll>
      {/* Page Title */}
      <View style={{ alignItems: "center", marginBottom: 22 }}>
        <Text style={styles.pageTitle}>Manage Plans</Text>
        <Text style={styles.pageSub}>Manage your subscription and billing</Text>
      </View>

      {confirmation ? (
        <View style={styles.confirmBanner}>
          <Feather name="check-circle" size={18} color="#166534" />
          <Text style={styles.confirmText}>{confirmation}</Text>
        </View>
      ) : null}

      {/* Current Plan */}
      <Card style={styles.block} elevated={false}>
        <View style={styles.currentHead}>
          <Text style={styles.currentLabel}>Current Plan</Text>
          <Badge label="Active" tone="success" />
        </View>
        <Text style={styles.currentName}>{currentPlan ? currentPlan.name : user?.plan} Plan</Text>
        <Text style={styles.currentMeta}>
          {currentPlan
            ? `${formatPrice(currentPlan)}/${currentPlan.period} • ${currentPlan.description}`
            : "—"}
        </Text>
        <View style={styles.currentActions}>
          <Button label="Change Plan" variant="outline" size="sm" />
          <Button label="Cancel Subscription" variant="outline" size="sm" />
        </View>
      </Card>

      {/* Usage Statistics */}
      <View style={styles.usageGrid}>
        <UsageStat
          title="API Calls"
          icon="code"
          used={USAGE_STATS.apiCalls}
          total={50000}
          usedLabel={USAGE_STATS.apiCalls.toLocaleString()}
          totalLabel="50,000"
        />
        <UsageStat
          title="Storage"
          icon="archive"
          used={USAGE_STATS.storageUsedMB}
          total={USAGE_STATS.storageLimitMB}
          usedLabel={`${storageGbUsed} GB`}
          totalLabel={`${storageGbTotal} GB`}
        />
        <UsageStat
          title="Conversions"
          icon="image"
          used={USAGE_STATS.totalConversions}
          total={10000}
          usedLabel={USAGE_STATS.totalConversions.toLocaleString()}
          totalLabel="10,000"
        />
      </View>

      {/* Available Plans */}
      <Text style={styles.sectionTitle}>Available Plans</Text>
      <View style={{ gap: 14 }}>
        {plans.map((plan) => {
          const isCurrent = plan.id === currentPlanId;
          const isUpgrade = currentPlan ? plan.price > currentPlan.price : false;
          return (
            <View
              key={plan.id}
              style={[styles.planCard, isCurrent && styles.planCardCurrent]}
              testID={`plan-${plan.id}`}
            >
              <View style={styles.planTop}>
                <Text style={styles.planName}>{plan.name}</Text>
                {plan.popular ? <Badge label="Most Popular" tone="primary" /> : null}
              </View>
              <View style={styles.priceRow}>
                <Text style={styles.price}>{formatPrice(plan)}</Text>
                <Text style={styles.pricePer}>/{plan.period}</Text>
              </View>
              <Text style={styles.planDesc}>{plan.description}</Text>

              <View style={{ gap: 10, marginTop: 12, marginBottom: 16 }}>
                {plan.features.map((feature) => (
                  <View key={feature} style={styles.featureRow}>
                    <Feather name="check" size={16} color={C.success} />
                    <Text style={styles.featureText}>{feature}</Text>
                  </View>
                ))}
              </View>

              {isCurrent ? (
                <Button label="Current Plan" variant="secondary" disabled fullWidth />
              ) : (
                <Button
                  label={isUpgrade ? "Upgrade" : "Downgrade"}
                  variant={isUpgrade ? "primary" : "outline"}
                  fullWidth
                  loading={pendingId === plan.id}
                  onPress={() => handleSubscribe(plan)}
                  testID={`button-subscribe-${plan.id}`}
                />
              )}
            </View>
          );
        })}
      </View>
    </ScreenScroll>
  );
}

const styles = StyleSheet.create({
  pageTitle: { fontSize: 28, color: C.foreground, fontFamily: fonts.headingBold, textAlign: "center" },
  pageSub: { fontSize: 15, color: C.mutedForeground, fontFamily: fonts.body, marginTop: 6, textAlign: "center" },

  confirmBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#dcfce7",
    borderRadius: 12,
    padding: 14,
    marginBottom: 18,
  },
  confirmText: { flex: 1, fontSize: 13.5, color: "#166534", fontFamily: fonts.bodyMedium },

  block: { marginBottom: 18, ...cardShadow },
  currentHead: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 8 },
  currentLabel: { fontSize: 18, color: C.foreground, fontFamily: fonts.headingBold },
  currentName: { fontSize: 26, color: C.foreground, fontFamily: fonts.headingBold, marginBottom: 4 },
  currentMeta: { fontSize: 14, lineHeight: 20, color: C.mutedForeground, fontFamily: fonts.body },
  currentActions: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 16 },

  usageGrid: { gap: 12, marginBottom: 22 },
  usageCard: {
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 16,
    padding: 16,
    ...cardShadow,
  },
  usageHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  usageTitle: { fontSize: 15, color: C.foreground, fontFamily: fonts.bodySemibold },
  usageValueRow: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 8 },
  usageValue: { fontSize: 22, color: C.foreground, fontFamily: fonts.headingBold },
  usageOf: { fontSize: 13, color: C.mutedForeground, fontFamily: fonts.body },
  track: { height: 8, borderRadius: 999, backgroundColor: C.border, overflow: "hidden" },
  fill: { height: 8, borderRadius: 999, backgroundColor: C.primary },
  usagePct: { fontSize: 13, color: C.mutedForeground, fontFamily: fonts.body, marginTop: 8 },

  sectionTitle: { fontSize: 18, color: C.foreground, fontFamily: fonts.headingBold, marginBottom: 12 },
  planCard: {
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 16,
    padding: 18,
    ...cardShadow,
  },
  planCardCurrent: { borderWidth: 2, borderColor: C.blue200, backgroundColor: C.blue50 },
  planTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 4 },
  planName: { fontSize: 18, color: C.foreground, fontFamily: fonts.headingBold },
  priceRow: { flexDirection: "row", alignItems: "flex-end", marginTop: 4 },
  price: { fontSize: 32, color: C.foreground, fontFamily: fonts.headingBold },
  pricePer: { fontSize: 14, color: C.mutedForeground, fontFamily: fonts.body, marginLeft: 4, marginBottom: 6 },
  planDesc: { fontSize: 14, lineHeight: 20, color: C.mutedForeground, fontFamily: fonts.body, marginTop: 6 },
  featureRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  featureText: { flex: 1, fontSize: 14, color: C.foreground, fontFamily: fonts.body },

  gate: { alignItems: "center", paddingVertical: 60, gap: 12 },
  gateIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: C.accent,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  gateTitle: { fontSize: 18, color: C.foreground, fontFamily: fonts.headingBold },
  gateText: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
    color: C.mutedForeground,
    fontFamily: fonts.body,
    paddingHorizontal: 20,
    marginBottom: 8,
  },
});
