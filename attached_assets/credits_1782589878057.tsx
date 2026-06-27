import { Feather } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import LottieView from "lottie-react-native";
import React, { useCallback, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import type { PurchasesPackage } from "react-native-purchases";

import {
  PurchaseConfirmModal,
  type PurchaseConfirmDetails,
} from "@/components/PurchaseConfirmModal";
import { SignInRequiredIcon } from "@/components/SignInRequiredIcon";
import { Button, Card, ScreenScroll } from "@/components/ui";
import colors from "@/constants/colors";
import { ROUTES } from "@/constants/routes";
import { cardShadow, fonts } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/lib/revenuecat";

const C = colors.light;

// Animated credit coin used in the balance hero. Bundled as a real asset (no
// placeholder) so it renders identically in the production build.
const creditAnimation = require("../../assets/lottie/credit.json");

// Pull the credit count out of a pack's store identifier (e.g. "credits_500" ->
// 500) so each box can show "+500" even before the store title loads. Falls back
// to null when the identifier doesn't encode an amount.
function packCreditAmount(pkg: PurchasesPackage): number | null {
  const id = `${pkg.product.identifier ?? pkg.identifier ?? ""}`;
  const match = id.match(/(\d[\d,]*)/);
  if (!match) return null;
  const n = Number(match[1].replace(/,/g, ""));
  return Number.isFinite(n) && n > 0 ? n : null;
}

function AuthGate() {
  const router = useRouter();
  return (
    <View style={styles.gate}>
      <View style={styles.gateIcon}>
        <SignInRequiredIcon />
      </View>
      <Text style={styles.gateTitle}>Sign in required</Text>
      <Text style={styles.gateText}>
        Sign in to view your credit balance and buy credit packs.
      </Text>
      <Button
        label="Sign In"
        icon="log-in"
        onPress={() => router.push(ROUTES.signIn as never)}
        style={{ alignSelf: "center" }}
      />
    </View>
  );
}

export default function CreditsScreen() {
  const { isAuthenticated, refreshUser } = useAuth();
  const {
    available,
    creditsOffering,
    credits,
    purchase,
    isPurchasing,
    restore,
    isRestoring,
  } = useSubscription();

  // Pull the live credit balance from the backend every time this screen comes
  // into focus, so spending/purchases made elsewhere are reflected immediately.
  useFocusEffect(
    useCallback(() => {
      if (isAuthenticated) void refreshUser();
    }, [isAuthenticated, refreshUser]),
  );

  const [confirmation, setConfirmation] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingPurchase, setPendingPurchase] = useState<{
    pkg: PurchasesPackage;
    details: PurchaseConfirmDetails;
  } | null>(null);

  const creditPackages = [...(creditsOffering?.availablePackages ?? [])].sort(
    (a, b) => (packCreditAmount(a) ?? 0) - (packCreditAmount(b) ?? 0),
  );

  const handleBuyCredits = (pkg: PurchasesPackage) => {
    setError(null);
    setConfirmation(null);
    setPendingPurchase({
      pkg,
      details: {
        title: pkg.product.title || "Credit Pack",
        priceString: pkg.product.priceString,
        detail: "One-time purchase",
      },
    });
  };

  const confirmPurchase = async () => {
    if (!pendingPurchase) return;
    try {
      await purchase(pendingPurchase.pkg);
      setConfirmation("Credits added to your balance.");
    } catch (e: any) {
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
        <Text style={styles.pageTitle}>My Credits</Text>
        <Text style={styles.pageSub}>
          Top up credits to unlock more conversions
        </Text>
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

      {/* Balance */}
      <View style={styles.balanceCard}>
        <View style={styles.balanceIcon}>
          <LottieView
            source={creditAnimation as never}
            autoPlay
            loop
            style={styles.balanceLottie}
          />
        </View>
        <Text style={styles.balanceValue} testID="text-credit-balance">
          {credits.toLocaleString()}
        </Text>
        <Text style={styles.balanceLabel}>credits available</Text>
        <Text style={styles.balanceHint}>
          Credits are added to a balance you can spend anytime — use them for
          conversions once you reach your plan's limit.
        </Text>
      </View>

      {/* Credit packs (real in-app purchases) */}
      {available && creditPackages.length > 0 ? (
        <>
          <Text style={styles.sectionTitle}>Credit Packs</Text>
          {/* Box / grid view — at least two packs per row so the options read as
              selectable tiles. Each tile maps to a real store product. */}
          <View style={styles.packGrid}>
            {creditPackages.map((pkg) => {
              const amount = packCreditAmount(pkg);
              return (
                <View
                  key={pkg.identifier}
                  style={styles.packBox}
                  testID={`pack-${pkg.identifier}`}
                >
                  <View style={styles.packIcon}>
                    <Feather name="zap" size={20} color={C.primary} />
                  </View>
                  <Text style={styles.packAmount}>
                    {amount ? `+${amount.toLocaleString()}` : pkg.product.title || "Credits"}
                  </Text>
                  <Text style={styles.packCaption}>credits</Text>
                  {pkg.product.description ? (
                    <Text style={styles.packDesc} numberOfLines={2}>
                      {pkg.product.description}
                    </Text>
                  ) : null}
                  <Button
                    label={pkg.product.priceString}
                    variant="primary"
                    size="sm"
                    onPress={() => handleBuyCredits(pkg)}
                    style={styles.packBuyBtn}
                    testID={`button-buy-${pkg.identifier}`}
                  />
                </View>
              );
            })}
          </View>

          <Button
            label="Restore Purchases"
            variant="ghost"
            icon="refresh-ccw"
            loading={isRestoring}
            onPress={handleRestore}
            style={{ alignSelf: "center", marginTop: 22 }}
            testID="button-restore-purchases"
          />
        </>
      ) : (
        <Card style={styles.unavailable} elevated={false}>
          <Feather name="shopping-bag" size={22} color={C.mutedForeground} />
          <Text style={styles.unavailableTitle}>
            Credit packs aren't available here
          </Text>
          <Text style={styles.unavailableText}>
            In-app purchases only work in the installed app from the store. Open
            PDF Genius on your device to buy credits.
          </Text>
        </Card>
      )}

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
  pageTitle: {
    fontSize: 28,
    color: C.foreground,
    fontFamily: fonts.headingBold,
    textAlign: "center",
  },
  pageSub: {
    fontSize: 15,
    color: C.mutedForeground,
    fontFamily: fonts.body,
    marginTop: 6,
    textAlign: "center",
  },

  confirmBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#dcfce7",
    borderRadius: 12,
    padding: 14,
    marginBottom: 18,
  },
  confirmText: {
    flex: 1,
    fontSize: 13.5,
    color: "#166534",
    fontFamily: fonts.bodyMedium,
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#fee2e2",
    borderRadius: 12,
    padding: 14,
    marginBottom: 18,
  },
  errorText: {
    flex: 1,
    fontSize: 13.5,
    color: "#991b1b",
    fontFamily: fonts.bodyMedium,
  },

  balanceCard: {
    alignItems: "center",
    paddingVertical: 30,
    paddingHorizontal: 20,
    marginBottom: 24,
    borderRadius: 22,
    backgroundColor: C.primary,
  },
  balanceIcon: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
    overflow: "hidden",
  },
  balanceLottie: {
    width: 60,
    height: 60,
  },
  balanceValue: {
    fontSize: 48,
    color: "#ffffff",
    fontFamily: fonts.headingBold,
    lineHeight: 54,
  },
  balanceLabel: {
    fontSize: 15,
    color: "rgba(255,255,255,0.92)",
    fontFamily: fonts.bodySemibold,
    marginTop: 2,
  },
  balanceHint: {
    fontSize: 13,
    lineHeight: 19,
    color: "rgba(255,255,255,0.82)",
    fontFamily: fonts.body,
    textAlign: "center",
    marginTop: 12,
    paddingHorizontal: 16,
  },

  sectionTitle: {
    fontSize: 18,
    color: C.foreground,
    fontFamily: fonts.headingBold,
    marginBottom: 12,
  },
  packGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 12,
  },
  packBox: {
    width: "48.5%",
    alignItems: "center",
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 12,
    ...cardShadow,
  },
  packIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: C.accent,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  packAmount: {
    fontSize: 22,
    color: C.foreground,
    fontFamily: fonts.headingBold,
  },
  packCaption: {
    fontSize: 12,
    color: C.mutedForeground,
    fontFamily: fonts.bodyMedium,
    marginTop: 1,
  },
  packDesc: {
    fontSize: 12,
    lineHeight: 16,
    textAlign: "center",
    color: C.mutedForeground,
    fontFamily: fonts.body,
    marginTop: 6,
  },
  packBuyBtn: {
    alignSelf: "stretch",
    marginTop: 12,
  },

  unavailable: {
    alignItems: "center",
    gap: 8,
    paddingVertical: 28,
    ...cardShadow,
  },
  unavailableTitle: {
    fontSize: 16,
    color: C.foreground,
    fontFamily: fonts.bodySemibold,
    marginTop: 4,
  },
  unavailableText: {
    fontSize: 13.5,
    lineHeight: 19,
    color: C.mutedForeground,
    fontFamily: fonts.body,
    textAlign: "center",
    paddingHorizontal: 24,
  },

  gate: { alignItems: "center", paddingVertical: 60, gap: 12 },
  gateIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: C.accent,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
    overflow: "hidden",
  },
  gateTitle: {
    fontSize: 18,
    color: C.foreground,
    fontFamily: fonts.headingBold,
  },
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
