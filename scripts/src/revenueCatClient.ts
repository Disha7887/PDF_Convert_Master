import { createClient } from "@replit/revenuecat-sdk/client";

/**
 * Creates an authenticated RevenueCat v2 REST client using the secret API key
 * stored in the REVENUECAT_API_KEY environment variable.
 *
 * This is for server-side / script use ONLY. The secret key must never be
 * shipped to the mobile client.
 */
export function getUncachableRevenueCatClient() {
  const apiKey = process.env.REVENUECAT_API_KEY;
  if (!apiKey) {
    throw new Error(
      "REVENUECAT_API_KEY is not set. Add your RevenueCat v2 secret API key (starts with sk_) to the environment.",
    );
  }

  return createClient({
    baseUrl: "https://api.revenuecat.com/v2",
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  });
}
