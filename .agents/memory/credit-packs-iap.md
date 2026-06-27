---
name: Credit packs (mobile IAP)
description: How credit-pack sizes are defined, granted, and what's needed to add a new one.
---

# Credit packs (mobile IAP)

Credit packs are one-time consumables sold via Apple/Google IAP through RevenueCat.
Store identifiers follow the convention `credits_<N>` (e.g. `credits_250`).

**Where credits are granted:** `artifacts/api-server/src/revenuecat.ts`
`creditsForStoreIdentifier()` resolves the amount: explicit `CREDITS_BY_STORE_ID`
map first, then a `/^credits_(\d+)$/` fallback on the product's `store_identifier`.
So any future `credits_<N>` pack grants the right amount with NO backend code change.

**Why the regex fallback is safe:** it runs on RevenueCat-provided product metadata,
never on client input; only positive-integer ids are accepted.

**Seed source of truth:** `scripts/src/seedRevenueCat.ts` `CREDIT_PACKS` (creates RC
product records + Test Store prices + the "credits" offering/packages). Keep its pack
ids loosely in sync with the explicit map, but the regex fallback covers drift.

## To add a NEW pack size (end-to-end)
1. Add it to `CREDIT_PACKS` in the seed (and optionally to `CREDITS_BY_STORE_ID`).
2. Create the matching consumable IAP product in App Store Connect AND Google Play
   with the SAME id (`credits_<N>`) — ONLY the app owner can do this; prices/titles
   come from the stores.
3. Run the seed/reconcile script so the RC "credits" offering includes the new pack.
4. A custom free-typed amount is IMPOSSIBLE — IAP requires fixed SKUs; don't fake it.

**Mobile UI:** `app/dashboard/credits.tsx` renders `creditsOffering.availablePackages`
(real data only) sorted ascending by `packCreditAmount()` in a 2-col grid (packGrid/
packBox); balance hero uses the credit Lottie. On Expo Go/web RC is "browser mode" so
packs show the "unavailable" card — real packs only appear in an EAS build.
