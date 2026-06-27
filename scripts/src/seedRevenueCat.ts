import { getUncachableRevenueCatClient } from "./revenueCatClient";

import {
  listProjects,
  createProject,
  listApps,
  createApp,
  listAppPublicApiKeys,
  listProducts,
  createProduct,
  listEntitlements,
  createEntitlement,
  attachProductsToEntitlement,
  listOfferings,
  createOffering,
  updateOffering,
  updateApp,
  listPackages,
  createPackages,
  attachProductsToPackage,
  type App,
  type Product,
  type Project,
  type Entitlement,
  type Offering,
  type CreateProductData,
} from "@replit/revenuecat-sdk";

const PROJECT_NAME = "PDF Genius";

const APP_STORE_APP_NAME = "PDF Genius (iOS)";
const APP_STORE_BUNDLE_ID = "com.pdfgenius.app";
const PLAY_STORE_APP_NAME = "PDF Genius (Android)";
const PLAY_STORE_PACKAGE_NAME = "com.pdfgenius.app";

type Duration = "P1W" | "P1M" | "P2M" | "P3M" | "P6M" | "P1Y";

interface PriceInput {
  amount_micros: number;
  currency: string;
}

// Recurring subscription products (Pro / Business, monthly + yearly).
// Each maps to an entitlement that unlocks the matching plan in the app.
interface SubscriptionConfig {
  baseIdentifier: string; // store id for Test Store + App Store
  playBasePlanId: string; // Play Store base plan id (-> "{baseIdentifier}:{playBasePlanId}")
  displayName: string;
  title: string;
  duration: Duration;
  entitlement: string;
  packageLookupKey: string;
  prices: PriceInput[];
}

const ENTITLEMENTS: { lookupKey: string; displayName: string }[] = [
  { lookupKey: "pro", displayName: "Pro Access" },
  { lookupKey: "business", displayName: "Business Access" },
];

const SUBSCRIPTIONS: SubscriptionConfig[] = [
  {
    baseIdentifier: "pro_monthly",
    playBasePlanId: "monthly",
    displayName: "Pro Monthly",
    title: "PDF Genius Pro (Monthly)",
    duration: "P1M",
    entitlement: "pro",
    packageLookupKey: "pro_monthly",
    prices: [
      { amount_micros: 4990000, currency: "USD" },
      { amount_micros: 4990000, currency: "EUR" },
    ],
  },
  {
    baseIdentifier: "pro_yearly",
    playBasePlanId: "yearly",
    displayName: "Pro Yearly",
    title: "PDF Genius Pro (Yearly)",
    duration: "P1Y",
    entitlement: "pro",
    packageLookupKey: "pro_yearly",
    prices: [
      { amount_micros: 49990000, currency: "USD" },
      { amount_micros: 49990000, currency: "EUR" },
    ],
  },
  {
    baseIdentifier: "business_monthly",
    playBasePlanId: "monthly",
    displayName: "Business Monthly",
    title: "PDF Genius Business (Monthly)",
    duration: "P1M",
    entitlement: "business",
    packageLookupKey: "business_monthly",
    prices: [
      { amount_micros: 12990000, currency: "USD" },
      { amount_micros: 12990000, currency: "EUR" },
    ],
  },
  {
    baseIdentifier: "business_yearly",
    playBasePlanId: "yearly",
    displayName: "Business Yearly",
    title: "PDF Genius Business (Yearly)",
    duration: "P1Y",
    entitlement: "business",
    packageLookupKey: "business_yearly",
    prices: [
      { amount_micros: 129990000, currency: "USD" },
      { amount_micros: 129990000, currency: "EUR" },
    ],
  },
];

// One-time consumable credit packs. No entitlement; the backend grants the
// matching number of credits when the purchase is verified.
interface CreditPackConfig {
  identifier: string; // same store id across Test/App/Play (one-time SKU)
  displayName: string;
  title: string;
  credits: number;
  packageLookupKey: string;
  prices: PriceInput[];
}

const CREDIT_PACKS: CreditPackConfig[] = [
  {
    identifier: "credits_10",
    displayName: "10 Credits",
    title: "10 Conversion Credits",
    credits: 10,
    packageLookupKey: "credits_10",
    prices: [
      { amount_micros: 490000, currency: "USD" },
      { amount_micros: 490000, currency: "EUR" },
    ],
  },
  {
    identifier: "credits_50",
    displayName: "50 Credits",
    title: "50 Conversion Credits",
    credits: 50,
    packageLookupKey: "credits_50",
    prices: [
      { amount_micros: 990000, currency: "USD" },
      { amount_micros: 990000, currency: "EUR" },
    ],
  },
  {
    identifier: "credits_100",
    displayName: "100 Credits",
    title: "100 Conversion Credits",
    credits: 100,
    packageLookupKey: "credits_100",
    prices: [
      { amount_micros: 1990000, currency: "USD" },
      { amount_micros: 1990000, currency: "EUR" },
    ],
  },
  {
    identifier: "credits_250",
    displayName: "250 Credits",
    title: "250 Conversion Credits",
    credits: 250,
    packageLookupKey: "credits_250",
    prices: [
      { amount_micros: 4490000, currency: "USD" },
      { amount_micros: 4490000, currency: "EUR" },
    ],
  },
  {
    identifier: "credits_500",
    displayName: "500 Credits",
    title: "500 Conversion Credits",
    credits: 500,
    packageLookupKey: "credits_500",
    prices: [
      { amount_micros: 7990000, currency: "USD" },
      { amount_micros: 7990000, currency: "EUR" },
    ],
  },
  {
    identifier: "credits_1000",
    displayName: "1000 Credits",
    title: "1000 Conversion Credits",
    credits: 1000,
    packageLookupKey: "credits_1000",
    prices: [
      { amount_micros: 13990000, currency: "USD" },
      { amount_micros: 13990000, currency: "EUR" },
    ],
  },
];

const SUBSCRIPTION_OFFERING = {
  lookupKey: "default",
  displayName: "Subscriptions",
};
const CREDITS_OFFERING = {
  lookupKey: "credits",
  displayName: "Credit Packs",
};

type TestStorePricesResponse = {
  object: string;
  prices: { amount_micros: number; currency: string }[];
};

type Client = ReturnType<typeof getUncachableRevenueCatClient>;

async function ensureProject(client: Client): Promise<Project> {
  const { data, error } = await listProjects({ client, query: { limit: 20 } });
  if (error) throw new Error("Failed to list projects");
  const existing = data.items?.find((p) => p.name.toLowerCase() === PROJECT_NAME.toLowerCase());
  if (existing) {
    console.log("Project already exists:", existing.id);
    return existing;
  }
  const { data: created, error: createErr } = await createProject({
    client,
    body: { name: PROJECT_NAME },
  });
  if (createErr) throw new Error("Failed to create project");
  console.log("Created project:", created.id);
  return created;
}

async function ensureApps(client: Client, projectId: string) {
  const { data: apps, error } = await listApps({
    client,
    path: { project_id: projectId },
    query: { limit: 20 },
  });
  if (error || !apps || apps.items.length === 0) {
    throw new Error("No apps found (a Test Store app is created with the project)");
  }

  const testStore = apps.items.find((a) => a.type === "test_store");
  if (!testStore) throw new Error("No Test Store app found");
  console.log("Test Store app:", testStore.id);

  let appStore = apps.items.find((a) => a.type === "app_store");
  if (!appStore) {
    const { data, error: err } = await createApp({
      client,
      path: { project_id: projectId },
      body: {
        name: APP_STORE_APP_NAME,
        type: "app_store",
        app_store: { bundle_id: APP_STORE_BUNDLE_ID },
      },
    });
    if (err) throw new Error("Failed to create App Store app");
    appStore = data;
    console.log("Created App Store app:", appStore.id);
  } else {
    console.log("App Store app:", appStore.id);
    const currentBundleId = (appStore as { app_store?: { bundle_id?: string } }).app_store?.bundle_id;
    if (currentBundleId && currentBundleId !== APP_STORE_BUNDLE_ID) {
      const { data, error: err } = await updateApp({
        client,
        path: { project_id: projectId, app_id: appStore.id },
        body: { app_store: { bundle_id: APP_STORE_BUNDLE_ID } },
      });
      if (err) throw new Error("Failed to update App Store bundle id: " + JSON.stringify(err));
      appStore = data;
      console.log(`  Updated App Store bundle id: ${currentBundleId} -> ${APP_STORE_BUNDLE_ID}`);
    }
  }

  let playStore = apps.items.find((a) => a.type === "play_store");
  if (!playStore) {
    const { data, error: err } = await createApp({
      client,
      path: { project_id: projectId },
      body: {
        name: PLAY_STORE_APP_NAME,
        type: "play_store",
        play_store: { package_name: PLAY_STORE_PACKAGE_NAME },
      },
    });
    if (err) throw new Error("Failed to create Play Store app");
    playStore = data;
    console.log("Created Play Store app:", playStore.id);
  } else {
    console.log("Play Store app:", playStore.id);
    const currentPackage = (playStore as { play_store?: { package_name?: string } }).play_store?.package_name;
    if (currentPackage && currentPackage !== PLAY_STORE_PACKAGE_NAME) {
      const { data, error: err } = await updateApp({
        client,
        path: { project_id: projectId, app_id: playStore.id },
        body: { play_store: { package_name: PLAY_STORE_PACKAGE_NAME } },
      });
      if (err) throw new Error("Failed to update Play Store package name: " + JSON.stringify(err));
      playStore = data;
      console.log(`  Updated Play Store package name: ${currentPackage} -> ${PLAY_STORE_PACKAGE_NAME}`);
    }
  }

  return { testStore, appStore, playStore };
}

async function addTestStorePrices(
  client: Client,
  projectId: string,
  productId: string,
  prices: PriceInput[],
) {
  const { error } = await client.post<TestStorePricesResponse>({
    url: "/projects/{project_id}/products/{product_id}/test_store_prices",
    path: { project_id: projectId, product_id: productId },
    body: { prices },
  });
  if (error) {
    if (typeof error === "object" && error && "type" in error && (error as { type?: string }).type === "resource_already_exists") {
      console.log("  Test store prices already exist");
    } else {
      throw new Error("Failed to add test store prices: " + JSON.stringify(error));
    }
  } else {
    console.log("  Added test store prices");
  }
}

async function main() {
  const client = getUncachableRevenueCatClient();

  const project = await ensureProject(client);
  const { testStore, appStore, playStore } = await ensureApps(client, project.id);

  const { data: existingProducts, error: listProductsErr } = await listProducts({
    client,
    path: { project_id: project.id },
    query: { limit: 200 },
  });
  if (listProductsErr) throw new Error("Failed to list products");

  const findProduct = (storeIdentifier: string, appId: string) =>
    existingProducts.items?.find((p) => p.store_identifier === storeIdentifier && p.app_id === appId);

  const ensureProduct = async (
    targetApp: App,
    storeIdentifier: string,
    type: "subscription" | "consumable",
    displayName: string,
    title: string,
    duration: Duration | undefined,
    isTestStore: boolean,
  ): Promise<Product> => {
    const existing = findProduct(storeIdentifier, targetApp.id);
    if (existing) {
      console.log(`  Product ${storeIdentifier} already exists on ${targetApp.type}:`, existing.id);
      return existing;
    }
    const body: CreateProductData["body"] = {
      store_identifier: storeIdentifier,
      app_id: targetApp.id,
      type,
      display_name: displayName,
    };
    if (isTestStore) {
      body.title = title;
      if (type === "subscription" && duration) {
        body.subscription = { duration };
      }
    }
    const { data, error } = await createProduct({
      client,
      path: { project_id: project.id },
      body,
    });
    if (error) throw new Error(`Failed to create product ${storeIdentifier}: ` + JSON.stringify(error));
    console.log(`  Created product ${storeIdentifier} on ${targetApp.type}:`, data.id);
    return data;
  };

  // ---- Subscriptions ----
  const entitlementProducts: Record<string, string[]> = {};
  const subscriptionPackageProducts: { lookupKey: string; displayName: string; productIds: string[] }[] = [];

  for (const sub of SUBSCRIPTIONS) {
    console.log(`\nSubscription: ${sub.displayName}`);
    const testProduct = await ensureProduct(testStore, sub.baseIdentifier, "subscription", sub.displayName, sub.title, sub.duration, true);
    const appProduct = await ensureProduct(appStore, sub.baseIdentifier, "subscription", sub.displayName, sub.title, sub.duration, false);
    const playProduct = await ensureProduct(playStore, `${sub.baseIdentifier}:${sub.playBasePlanId}`, "subscription", sub.displayName, sub.title, sub.duration, false);

    await addTestStorePrices(client, project.id, testProduct.id, sub.prices);

    entitlementProducts[sub.entitlement] = entitlementProducts[sub.entitlement] || [];
    entitlementProducts[sub.entitlement].push(testProduct.id, appProduct.id, playProduct.id);

    subscriptionPackageProducts.push({
      lookupKey: sub.packageLookupKey,
      displayName: sub.displayName,
      productIds: [testProduct.id, appProduct.id, playProduct.id],
    });
  }

  // ---- Credit packs (consumables) ----
  const creditPackageProducts: { lookupKey: string; displayName: string; productIds: string[] }[] = [];

  for (const pack of CREDIT_PACKS) {
    console.log(`\nCredit pack: ${pack.displayName}`);
    const testProduct = await ensureProduct(testStore, pack.identifier, "consumable", pack.displayName, pack.title, undefined, true);
    const appProduct = await ensureProduct(appStore, pack.identifier, "consumable", pack.displayName, pack.title, undefined, false);
    const playProduct = await ensureProduct(playStore, pack.identifier, "consumable", pack.displayName, pack.title, undefined, false);

    await addTestStorePrices(client, project.id, testProduct.id, pack.prices);

    creditPackageProducts.push({
      lookupKey: pack.packageLookupKey,
      displayName: pack.displayName,
      productIds: [testProduct.id, appProduct.id, playProduct.id],
    });
  }

  // ---- Entitlements ----
  const { data: existingEntitlements, error: listEntErr } = await listEntitlements({
    client,
    path: { project_id: project.id },
    query: { limit: 50 },
  });
  if (listEntErr) throw new Error("Failed to list entitlements");

  for (const ent of ENTITLEMENTS) {
    let entitlement: Entitlement | undefined = existingEntitlements.items?.find((e) => e.lookup_key === ent.lookupKey);
    if (!entitlement) {
      const { data, error } = await createEntitlement({
        client,
        path: { project_id: project.id },
        body: { lookup_key: ent.lookupKey, display_name: ent.displayName },
      });
      if (error) throw new Error(`Failed to create entitlement ${ent.lookupKey}`);
      entitlement = data;
      console.log(`\nCreated entitlement ${ent.lookupKey}:`, data.id);
    } else {
      console.log(`\nEntitlement ${ent.lookupKey} already exists:`, entitlement.id);
    }

    const productIds = entitlementProducts[ent.lookupKey] || [];
    if (productIds.length > 0) {
      const { error } = await attachProductsToEntitlement({
        client,
        path: { project_id: project.id, entitlement_id: entitlement.id },
        body: { product_ids: productIds },
      });
      if (error) {
        if (error.type === "unprocessable_entity_error") {
          console.log("  Products already attached to entitlement");
        } else {
          throw new Error(`Failed to attach products to entitlement ${ent.lookupKey}: ` + JSON.stringify(error));
        }
      } else {
        console.log("  Attached products to entitlement");
      }
    }
  }

  // ---- Offerings + packages ----
  const ensureOffering = async (lookupKey: string, displayName: string, makeCurrent: boolean): Promise<Offering> => {
    const { data, error } = await listOfferings({
      client,
      path: { project_id: project.id },
      query: { limit: 50 },
    });
    if (error) throw new Error("Failed to list offerings");
    let offering = data.items?.find((o) => o.lookup_key === lookupKey);
    if (!offering) {
      const { data: created, error: createErr } = await createOffering({
        client,
        path: { project_id: project.id },
        body: { lookup_key: lookupKey, display_name: displayName },
      });
      if (createErr) throw new Error(`Failed to create offering ${lookupKey}`);
      offering = created;
      console.log(`\nCreated offering ${lookupKey}:`, created.id);
    } else {
      console.log(`\nOffering ${lookupKey} already exists:`, offering.id);
    }
    if (makeCurrent && !offering.is_current) {
      const { error: updErr } = await updateOffering({
        client,
        path: { project_id: project.id, offering_id: offering.id },
        body: { is_current: true },
      });
      if (updErr) throw new Error(`Failed to set offering ${lookupKey} as current`);
      console.log(`  Set offering ${lookupKey} as current`);
    }
    return offering;
  };

  const ensurePackagesForOffering = async (
    offering: Offering,
    packages: { lookupKey: string; displayName: string; productIds: string[] }[],
  ) => {
    const { data: existingPackages, error } = await listPackages({
      client,
      path: { project_id: project.id, offering_id: offering.id },
      query: { limit: 50 },
    });
    if (error) throw new Error("Failed to list packages");

    for (const pkgCfg of packages) {
      let pkg = existingPackages.items?.find((p) => p.lookup_key === pkgCfg.lookupKey);
      if (!pkg) {
        const { data, error: createErr } = await createPackages({
          client,
          path: { project_id: project.id, offering_id: offering.id },
          body: { lookup_key: pkgCfg.lookupKey, display_name: pkgCfg.displayName },
        });
        if (createErr) throw new Error(`Failed to create package ${pkgCfg.lookupKey}`);
        pkg = data;
        console.log(`  Created package ${pkgCfg.lookupKey}:`, data.id);
      } else {
        console.log(`  Package ${pkgCfg.lookupKey} already exists:`, pkg.id);
      }

      const { error: attachErr } = await attachProductsToPackage({
        client,
        path: { project_id: project.id, package_id: pkg.id },
        body: {
          products: pkgCfg.productIds.map((id) => ({ product_id: id, eligibility_criteria: "all" as const })),
        },
      });
      if (attachErr) {
        if (attachErr.type === "unprocessable_entity_error") {
          console.log(`    Products already attached to package ${pkgCfg.lookupKey}`);
        } else {
          throw new Error(`Failed to attach products to package ${pkgCfg.lookupKey}: ` + JSON.stringify(attachErr));
        }
      } else {
        console.log(`    Attached products to package ${pkgCfg.lookupKey}`);
      }
    }
  };

  const subsOffering = await ensureOffering(SUBSCRIPTION_OFFERING.lookupKey, SUBSCRIPTION_OFFERING.displayName, true);
  await ensurePackagesForOffering(subsOffering, subscriptionPackageProducts);

  const creditsOffering = await ensureOffering(CREDITS_OFFERING.lookupKey, CREDITS_OFFERING.displayName, false);
  await ensurePackagesForOffering(creditsOffering, creditPackageProducts);

  // ---- Public API keys ----
  const getKeys = async (appId: string, label: string) => {
    const { data, error } = await listAppPublicApiKeys({
      client,
      path: { project_id: project.id, app_id: appId },
    });
    if (error) throw new Error(`Failed to list public API keys for ${label}`);
    return data?.items.map((i) => i.key).join(", ") ?? "N/A";
  };

  const testKeys = await getKeys(testStore.id, "Test Store");
  const appKeys = await getKeys(appStore.id, "App Store");
  const playKeys = await getKeys(playStore.id, "Play Store");

  console.log("\n====================");
  console.log("RevenueCat setup complete!");
  console.log("REVENUECAT_PROJECT_ID:", project.id);
  console.log("REVENUECAT_TEST_STORE_APP_ID:", testStore.id);
  console.log("REVENUECAT_APPLE_APP_STORE_APP_ID:", appStore.id);
  console.log("REVENUECAT_GOOGLE_PLAY_STORE_APP_ID:", playStore.id);
  console.log("EXPO_PUBLIC_REVENUECAT_TEST_API_KEY:", testKeys);
  console.log("EXPO_PUBLIC_REVENUECAT_IOS_API_KEY:", appKeys);
  console.log("EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY:", playKeys);
  console.log("Entitlements: pro, business");
  console.log("Subscription offering: default | Credits offering: credits");
  console.log("====================\n");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
