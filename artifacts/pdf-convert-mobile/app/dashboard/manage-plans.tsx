import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import type { PurchasesPackage } from "react-native-purchases";

import {
  PurchaseConfirmModal,
  type PurchaseConfirmDetails,
} from "@/components/PurchaseConfirmModal";
import { Badge, Button, Card, ScreenScroll } from "@/components/ui";
import colors from "@/constants/colors";
import { ROUTES } from "@/constants/routes";
import { cardShadow, fonts } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/lib/revenuecat";
import { type MockUser } from "@/mocks/data";
import {
  changePlan,
  fetchPlans,
  formatBytes,
  formatLimit,
  usagePercent,
  type Plan,
} from "@/services/plans";
import { fetchUsage, type UsageTotals } from "@/services/account";

const C = colors.light;

/**
 * Find the in-app-purchase package for a subscription plan, preferring the
 * monthly option. Matches on the store product id (e.g. "pro_monthly").
 */
function findSubscriptionPackage(
  packages: PurchasesPackage[],
  planId: string,
): PurchasesPackage | null {
  const matches = packages.filter((p) =>
    p.product.identifier.toLowerCase().startsWith(planId.toLowerCase()),
  );
  if (matches.length === 0) return null;
  return matches.find((p) => /month/i.test(p.product.identifier)) ?? matches[0];
}

function UsageStat({
  title,
  icon,
  used,
  limit,
  fmt,
}: {
  title: string;
  icon: keyof typeof Feather.glyphMap;
  used: number;
  limit: number;
  fmt: (n: number) => string;
}) {
  const pct = usagePercent(used, limit);
  return (
    <View style={styles.usageCard}>
      <View style={styles.usageHead}>
        <Text style={styles.usageTitle}>{title}</Text>
        <Feather name={icon} size={18} color={C.primary} />
      </View>
      <View style={styles.usageValueRow}>
        <Text style={styles.usageValue}>{fmt(used)}</Text>
        <Text style={styles.usageOf}>
          {limit === 0 ? "not included" : `of ${formatLimit(limit, fmt)}`}
        </Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${pct}%` }]} />
      </View>
      <Text style={styles.usagePct}>
        {limit < 0
          ? "Unlimited"
          : limit === 0
            ? "Upgrade to unlock"
            : `${pct}% used`}
      </Text>
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
      <Text style={styles.gateText}>Sign in to manage your subscription.</Text>
      <Button label="Sign In" icon="log-in" onPress={() => router.push(ROUTES.signIn as never)} style={{ alignSelf: "center" }} />
    </View>
  );
}

export default function ManagePlansScreen() {
  const { isAuthenticated, user, token, updateUser } = useAuth();
  const {
    available,
    subscriptionsOffering,
    creditsOffering,
    credits,
    purchase,
    isPurchasing,
    restore,
    isRestoring,
  } = useSubscription();

  const [plans, setPlans] = useState<Plan[]>([]);
  const [totals, setTotals] = useState<UsageTotals | null>(null);
  const [confirmation, setConfirmation] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingPurchase, setPendingPurchase] = useState<{
    pkg: PurchasesPackage;
    details: PurchaseConfirmDetails;
    kind: "subscription" | "credits";
  } | null>(null);

  useEffect(() => {
    let active = true;
    fetchPlans()
      .then((p) => active && setPlans(p))
      .catch((e) => active && setError(e.message));
    return () => {
      active = false;
    };
  }, []);

  const loadUsage = useCallback(() => {
    if (!token) return;
    fetchUsage(token)
      .then((u) => setTotals(u.totals))
      .catch(() => {});
  }, [token]);

  useEffect(() => {
    if (isAuthenticated) loadUsage();
  }, [isAuthenticated, loadUsage]);

  const currentPlanId = (user?.plan ?? "free").toLowerCase();
  const currentPlan = useMemo(
    () => plans.find((p) => p.id === currentPlanId),
    [plans, currentPlanId],
  );
  const currentIndex = useMemo(
    () => plans.findIndex((p) => p.id === currentPlanId),
    [plans, currentPlanId],
  );

  const handleSwitch = async (plan: Plan) => {
    if (!token || plan.id === currentPlanId) return;
    setPendingId(plan.id);
    setConfirmation(null);
    try {
      const updated = await changePlan(token, plan.id);
      await updateUser({ plan: updated.name as MockUser["plan"] });
      setConfirmation(`You're now on the ${updated.name} plan.`);
      loadUsage();
    } catch (e: any) {
      setError(e?.message ?? "Could not change plan.");
    } finally {
      setPendingId(null);
    }
  };

  // Subscription packages keyed by plan id, when real IAP is available.
  const subPackages = subscriptionsOffering?.availablePackages ?? [];
  const creditPackages = creditsOffering?.availablePackages ?? [];

  // Either open the native purchase confirm (real IAP) or fall back to the
  // instant plan switch when in-app purchases aren't available in this build.
  const handleUpgrade = (plan: Plan) => {
    setError(null);
    setConfirmation(null);
    const pkg = available ? findSubscriptionPackage(subPackages, plan.id) : null;
    if (!pkg) {
      handleSwitch(plan);
      return;
    }
    setPendingPurchase({
      pkg,
      kind: "subscription",
      details: {
        title: pkg.product.title || `${plan.name} Plan`,
        priceString: pkg.product.priceString,
        detail: "Recurring subscription",
      },
    });
  };

  const handleBuyCredits = (pkg: PurchasesPackage) => {
    setError(null);
    setConfirmation(null);
    setPendingPurchase({
      pkg,
      kind: "credits",
      details: {
        title: pkg.product.title || "Credit Pack",
        priceString: pkg.product.priceString,
        detail: "One-time purchase",
      },
    });
  };

  const confirmPurchase = async () => {
    if (!pendingPurchase) return;
    const { pkg, kind } = pendingPurchase;
    try {
      await purchase(pkg);
      setConfirmation(
        kind === "credits"
          ? "Credits added to your balance."
          : "Subscription activated.",
      );
      loadUsage();
    } catch (e: any) {
      // User-cancelled purchases aren't errors.
      if (!e?.userCancelled) {
        setError(e?.message ?? "Purchase could not be completed.");
      }
    } finally {
      setPendingPurchase(null);
    }
  };

  const handleRestore = async () => {
    setError(null);
    setConfirmation(null);
    try {
      await restore();
      setConfirmation("Purchases restored.");
      loadUsage();
    } catch (e: any) {
      setError(e?.message ?? "Could not restore purchases.");
    }
  };

  if (!isAuthenticated) {
    return (
      <ScreenScroll>
        <AuthGate />
      </ScreenScroll>
    );
  }

  return (
    <ScreenScroll>
      <View style={{ alignItems: "center", marginBottom: 22 }}>
        <Text style={styles.pageTitle}>Manage Plans</Text>
        <Text style={styles.pageSub}>Switch plans instantly — usage updates in real time</Text>
      </View>

      {confirmation ? (
        <View style={styles.confirmBanner}>
          <Feather name="check-circle" size={18} color="#166534" />
          <Text style={styles.confirmText}>{confirmation}</Text>
        </View>
      ) : null}

      {error ? (
        <View style={styles.errorBanner}>
          <Feather name="alert-circle" size={18} color="#991b1b" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      {/* Current Plan */}
      {currentPlan ? (
        <Card style={styles.block} elevated={false}>
          <View style={styles.currentHead}>
            <Text style={styles.currentLabel}>Current Plan</Text>
            <Badge label="Active" tone="success" />
          </View>
          <Text style={styles.currentName}>{currentPlan.name} Plan</Text>
          <Text style={styles.currentMeta}>
            {currentPlan.price === 0 ? "Free forever" : `$${currentPlan.price}/month`} • {currentPlan.description}
          </Text>
        </Card>
      ) : null}

      {/* Credit Balance */}
      <View style={styles.creditCard}>
        <View style={styles.creditIcon}>
          <Feather name="zap" size={20} color={C.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.creditLabel}>Credit Balance</Text>
          <Text style={styles.creditHint}>
            Credit packs add to a balance you can spend anytime.
          </Text>
        </View>
        <Text style={styles.creditValue} testID="text-credit-balance">
          {credits.toLocaleString()}
        </Text>
      </View>

      {/* Usage Statistics (real data) */}
      {currentPlan && totals ? (
        <View style={styles.usageGrid}>
          <UsageStat
            title="API Calls"
            icon="code"
            used={totals.apiCalls}
            limit={currentPlan.limits.apiCalls}
            fmt={(n) => n.toLocaleString()}
          />
          <UsageStat
            title="Storage"
            icon="archive"
            used={totals.dataProcessed}
            limit={currentPlan.limits.storageBytes}
            fmt={formatBytes}
          />
          <UsageStat
            title="Conversions"
            icon="image"
            used={totals.total}
            limit={currentPlan.limits.conversions}
            fmt={(n) => n.toLocaleString()}
          />
        </View>
      ) : null}

      {/* Available Plans */}
      <Text style={styles.sectionTitle}>Available Plans</Text>
      <View style={{ gap: 14 }}>
        {plans.map((plan, index) => {
          const isCurrent = plan.id === currentPlanId;
          const isUpgrade = currentIndex >= 0 ? index > currentIndex : true;
          return (
            <View
              key={plan.id}
              style={[styles.planCard, isCurrent && styles.planCardCurrent]}
              testID={`plan-${plan.id}`}
            >
              <View style={styles.planTop}>
                <Text style={styles.planName}>{plan.name}</Text>
                {isCurrent ? (
                  <Badge label="Your Plan" tone="primary" />
                ) : plan.popular ? (
                  <Badge label="Most Popular" tone="primary" />
                ) : null}
              </View>
              <View style={styles.priceRow}>
                <Text style={styles.price}>${plan.price}</Text>
                <Text style={styles.pricePer}>/month</Text>
              </View>
              <Text style={styles.planDesc}>{plan.description}</Text>

              <View style={{ gap: 10, marginTop: 12, marginBottom: 16 }}>
                {plan.features.map((feature) => (
                  <View key={feature} style={styles.featureRow}>
                    <Feather name="check" size={16} color={C.primary} />
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
                  onPress={() => handleUpgrade(plan)}
                  testID={`button-subscribe-${plan.id}`}
                />
              )}
            </View>
          );
        })}
      </View>

      {/* Credit Packs (real in-app purchases) */}
      {available && creditPackages.length > 0 ? (
        <>
          <Text style={[styles.sectionTitle, { marginTop: 26 }]}>Credit Packs</Text>
          <View style={{ gap: 12 }}>
            {creditPackages.map((pkg) => (
              <View key={pkg.identifier} style={styles.packRow} testID={`pack-${pkg.identifier}`}>
                <View style={styles.packIcon}>
                  <Feather name="zap" size={18} color={C.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.packTitle}>
                    {pkg.product.title || pkg.product.identifier}
                  </Text>
                  {pkg.product.description ? (
                    <Text style={styles.packDesc} numberOfLines={2}>
                      {pkg.product.description}
                    </Text>
                  ) : null}
                </View>
                <Button
                  label={pkg.product.priceString}
                  variant="primary"
                  size="sm"
                  onPress={() => handleBuyCredits(pkg)}
                  testID={`button-buy-${pkg.identifier}`}
                />
              </View>
            ))}
          </View>
        </>
      ) : null}

      {/* Restore purchases — only meaningful when real IAP is available */}
      {available ? (
        <Button
          label="Restore Purchases"
          variant="ghost"
          icon="refresh-ccw"
          loading={isRestoring}
          onPress={handleRestore}
          style={{ alignSelf: "center", marginTop: 22 }}
          testID="button-restore-purchases"
        />
      ) : null}

      <PurchaseConfirmModal
        visible={pendingPurchase !== null}
        details={pendingPurchase?.details ?? null}
        loading={isPurchasing}
        onConfirm={confirmPurchase}
        onCancel={() => setPendingPurchase(null)}
      />
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
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#fee2e2",
    borderRadius: 12,
    padding: 14,
    marginBottom: 18,
  },
  errorText: { flex: 1, fontSize: 13.5, color: "#991b1b", fontFamily: fonts.bodyMedium },

  block: { marginBottom: 18, ...cardShadow },

  creditCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 16,
    padding: 16,
    marginBottom: 22,
    ...cardShadow,
  },
  creditIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: C.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  creditLabel: { fontSize: 15, color: C.foreground, fontFamily: fonts.bodySemibold },
  creditHint: { fontSize: 12.5, lineHeight: 17, color: C.mutedForeground, fontFamily: fonts.body, marginTop: 2 },
  creditValue: { fontSize: 26, color: C.primary, fontFamily: fonts.headingBold },

  packRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 16,
    padding: 14,
    ...cardShadow,
  },
  packIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: C.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  packTitle: { fontSize: 15, color: C.foreground, fontFamily: fonts.bodySemibold },
  packDesc: { fontSize: 12.5, lineHeight: 17, color: C.mutedForeground, fontFamily: fonts.body, marginTop: 2 },
  currentHead: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 8 },
  currentLabel: { fontSize: 18, color: C.foreground, fontFamily: fonts.headingBold },
  currentName: { fontSize: 26, color: C.foreground, fontFamily: fonts.headingBold, marginBottom: 4 },
  currentMeta: { fontSize: 14, lineHeight: 20, color: C.mutedForeground, fontFamily: fonts.body },

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
  planCardCurrent: { borderWidth: 2, borderColor: C.primary, backgroundColor: C.accent },
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
