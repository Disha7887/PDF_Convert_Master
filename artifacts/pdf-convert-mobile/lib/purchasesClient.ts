/**
 * Native RevenueCat SDK wrapper (iOS / Android / Expo Go via the test store).
 *
 * All direct `react-native-purchases` access lives here so the rest of the app
 * never imports the native module at runtime. On web, Metro picks the sibling
 * `purchasesClient.web.ts` stub instead — `react-native-purchases` has no web
 * build and pulls transitive deps Metro can't resolve, which would otherwise
 * break the web bundle.
 */
import Purchases, {
  type CustomerInfo,
  type PurchasesOfferings,
  type PurchasesPackage,
} from "react-native-purchases";

/** True on native platforms where the SDK can actually run. */
export const purchasesAvailable = true;

export function configurePurchases(apiKey: string): void {
  Purchases.setLogLevel(Purchases.LOG_LEVEL.WARN);
  Purchases.configure({ apiKey });
}

export function logInPurchases(userId: string): Promise<unknown> {
  return Purchases.logIn(userId);
}

export function getOfferings(): Promise<PurchasesOfferings> {
  return Purchases.getOfferings();
}

export function getCustomerInfo(): Promise<CustomerInfo> {
  return Purchases.getCustomerInfo();
}

export function purchasePackage(
  pkg: PurchasesPackage,
): Promise<{ customerInfo: CustomerInfo }> {
  return Purchases.purchasePackage(pkg);
}

export function restorePurchases(): Promise<CustomerInfo> {
  return Purchases.restorePurchases();
}
