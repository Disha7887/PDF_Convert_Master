/**
 * RevenueCat client integration.
 *
 * Real Google Play / App Store in-app purchases via `react-native-purchases`.
 * Two product kinds live in the RevenueCat project:
 *   - recurring subscriptions (entitlements `pro` / `business`) in the
 *     `default` offering — buying one activates that plan.
 *   - consumable credit packs in the `credits` offering — buying one tops up a
 *     durable credit balance.
 *
 * The native SDK only exists in real dev/EAS/store builds. In Expo Go and on
 * web the native module is absent, so `initializeRevenueCat` fails softly and
 * `available` stays false — the UI degrades gracefully instead of crashing.
 *
 * After any purchase or restore we ask the backend to reconcile (plan +
 * credits). The server, not the client, is the source of truth.
 */
import Constants from "expo-constants";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  type ReactNode,
} from "react";
import { Platform } from "react-native";
import type {
  CustomerInfo,
  PurchasesOfferings,
  PurchasesOffering,
  PurchasesPackage,
} from "react-native-purchases";
import { useMutation, useQuery } from "@tanstack/react-query";

import { useAuth } from "@/contexts/AuthContext";
import {
  configurePurchases,
  getCustomerInfo,
  getOfferings,
  logInPurchases,
  purchasePackage,
  purchasesAvailable,
  restorePurchases,
} from "@/lib/purchasesClient";
import { syncRevenueCatPurchases } from "@/services/revenuecat";
import type { MockUser } from "@/mocks/data";

const TEST_API_KEY = process.env.EXPO_PUBLIC_REVENUECAT_TEST_API_KEY;
const IOS_API_KEY = process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY;
const ANDROID_API_KEY = process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY;

/** Entitlement lookup keys (must match the seed script). */
export const ENTITLEMENTS = { pro: "pro", business: "business" } as const;
/** Offering lookup keys (must match the seed script). */
export const SUBSCRIPTIONS_OFFERING_ID = "default";
export const CREDITS_OFFERING_ID = "credits";

let configured = false;

/** True once the native SDK has been configured (real builds only). */
export function isRevenueCatConfigured(): boolean {
  return configured;
}

function resolveApiKey(): string | undefined {
  // Test store key covers dev, web and Expo Go (storeClient); the platform
  // store keys are used in real standalone builds.
  if (
    __DEV__ ||
    Platform.OS === "web" ||
    Constants.executionEnvironment === "storeClient"
  ) {
    return TEST_API_KEY;
  }
  if (Platform.OS === "ios") return IOS_API_KEY;
  if (Platform.OS === "android") return ANDROID_API_KEY;
  return TEST_API_KEY;
}

/**
 * Configure the native SDK. Throws if keys are missing or the native module is
 * unavailable (Expo Go / web); callers wrap this in try/catch.
 */
export function initializeRevenueCat(): void {
  if (configured) return;
  if (!purchasesAvailable) {
    throw new Error("In-app purchases aren't available in this environment.");
  }
  const apiKey = resolveApiKey();
  if (!apiKey) {
    throw new Error(
      "RevenueCat public API key not found. Set EXPO_PUBLIC_REVENUECAT_* env vars.",
    );
  }
  configurePurchases(apiKey);
  configured = true;
}

/** Capitalise a plan id ("pro" -> "Pro") to the MockUser plan union shape. */
function toPlanLabel(plan: string): MockUser["plan"] {
  const label = plan.charAt(0).toUpperCase() + plan.slice(1).toLowerCase();
  if (label === "Pro" || label === "Business") return label;
  return "Free";
}

function useProvideSubscription() {
  const { user, token, updateUser } = useAuth();
  const available = isRevenueCatConfigured();

  // Identify the RevenueCat customer as our user so the backend can look them
  // up by the same id when reconciling purchases.
  useEffect(() => {
    if (!available || !user?.id) return;
    logInPurchases(user.id).catch(() => {
      // Non-fatal — purchases still work, attribution just lags.
    });
  }, [available, user?.id]);

  const offeringsQuery = useQuery<PurchasesOfferings>({
    queryKey: ["revenuecat", "offerings"],
    enabled: available,
    queryFn: () => getOfferings(),
    staleTime: 5 * 60 * 1000,
  });

  const customerInfoQuery = useQuery<CustomerInfo>({
    queryKey: ["revenuecat", "customer-info"],
    enabled: available,
    queryFn: () => getCustomerInfo(),
    staleTime: 60 * 1000,
  });

  /** Reconcile plan + credits on the backend and mirror onto the auth user. */
  const sync = useCallback(async () => {
    if (!token) return null;
    const result = await syncRevenueCatPurchases(token);
    await updateUser({
      plan: toPlanLabel(result.plan),
      credits: result.credits,
    });
    return result;
  }, [token, updateUser]);

  const purchaseMutation = useMutation({
    mutationFn: async (pkg: PurchasesPackage) => {
      const { customerInfo } = await purchasePackage(pkg);
      return customerInfo;
    },
    onSuccess: async () => {
      await customerInfoQuery.refetch();
      await sync();
    },
  });

  const restoreMutation = useMutation({
    mutationFn: async () => restorePurchases(),
    onSuccess: async () => {
      await customerInfoQuery.refetch();
      await sync();
    },
  });

  const offerings = offeringsQuery.data;
  const subscriptionsOffering: PurchasesOffering | null =
    offerings?.all?.[SUBSCRIPTIONS_OFFERING_ID] ?? offerings?.current ?? null;
  const creditsOffering: PurchasesOffering | null =
    offerings?.all?.[CREDITS_OFFERING_ID] ?? null;

  const active = customerInfoQuery.data?.entitlements.active ?? {};
  const isBusiness = active[ENTITLEMENTS.business] !== undefined;
  const isPro = active[ENTITLEMENTS.pro] !== undefined;
  const tier: "free" | "pro" | "business" = isBusiness
    ? "business"
    : isPro
      ? "pro"
      : "free";

  return {
    /** Whether real in-app purchases are usable in this build/runtime. */
    available,
    offerings,
    subscriptionsOffering,
    creditsOffering,
    customerInfo: customerInfoQuery.data,
    /** Highest active subscription tier from RevenueCat entitlements. */
    tier,
    isSubscribed: isPro || isBusiness,
    /** Durable credit balance (owned by the backend / auth user). */
    credits: user?.credits ?? 0,
    isLoading:
      available && (offeringsQuery.isLoading || customerInfoQuery.isLoading),
    purchase: purchaseMutation.mutateAsync,
    isPurchasing: purchaseMutation.isPending,
    restore: restoreMutation.mutateAsync,
    isRestoring: restoreMutation.isPending,
    sync,
  };
}

type SubscriptionContextValue = ReturnType<typeof useProvideSubscription>;
const Context = createContext<SubscriptionContextValue | null>(null);

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const value = useProvideSubscription();
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useSubscription(): SubscriptionContextValue {
  const ctx = useContext(Context);
  if (!ctx) {
    throw new Error("useSubscription must be used within a SubscriptionProvider");
  }
  return ctx;
}
