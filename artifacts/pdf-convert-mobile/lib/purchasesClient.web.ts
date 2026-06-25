/**
 * Web stub for the native RevenueCat SDK. `react-native-purchases` has no web
 * build, so on web we expose the same surface but report unavailable and no-op /
 * throw. Type-only imports are erased at build time, so the native package is
 * never bundled for web.
 */
import type {
  CustomerInfo,
  PurchasesOfferings,
  PurchasesPackage,
} from "react-native-purchases";

const NOT_AVAILABLE = "In-app purchases aren't available in this environment.";

/** Always false on web — purchases require a native build. */
export const purchasesAvailable = false;

export function configurePurchases(_apiKey: string): void {
  throw new Error(NOT_AVAILABLE);
}

export async function logInPurchases(_userId: string): Promise<unknown> {
  return null;
}

export async function getOfferings(): Promise<PurchasesOfferings> {
  throw new Error(NOT_AVAILABLE);
}

export async function getCustomerInfo(): Promise<CustomerInfo> {
  throw new Error(NOT_AVAILABLE);
}

export async function purchasePackage(
  _pkg: PurchasesPackage,
): Promise<{ customerInfo: CustomerInfo }> {
  throw new Error(NOT_AVAILABLE);
}

export async function restorePurchases(): Promise<CustomerInfo> {
  throw new Error(NOT_AVAILABLE);
}
