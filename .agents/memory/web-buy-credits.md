---
name: Web Buy Credits (Dodo credits)
description: How the web pay-as-you-go credits purchase flow is gated and what must be configured to enable it.
---

# Web "Buy Credits" (Dodo pay-as-you-go credits)

Web credit purchases live at `/dashboard/buy-credits` (Dashboard sidebar "Buy
Credits", Wallet icon, after "View Plans"). Conversion rate is `CREDITS_PER_USD`
(100), clamped to `MIN_CREDITS_USD`..`MAX_CREDITS_USD` ($1..$500).

**To actually enable buying you need BOTH of:**
1. Env `DODO_PRODUCT_CREDITS` set to a pay-what-you-want Dodo product id. While
   unset, `/api/billing/config` returns `credits.enabled:false` and the page
   shows the balance + a disabled note (this is the correct default state, not a
   bug).
2. The Dodo webhook subscribed to `payment.succeeded` — credits are granted in
   that webhook branch, not at checkout.

**Why credits are recomputed server-side, not trusted from metadata:** the
`payment.succeeded` handler gates the grant on the configured credits product
actually appearing in `product_cart`, and recomputes credits from the settled
(pre-tax) amount × CREDITS_PER_USD. Metadata mismatch is logged as a warning
only. Grants are idempotent via `storage.grantCreditsForPurchase(userId,
paymentId, ...)` so webhook replays don't double-credit.

**How to apply:** don't "fix" the disabled buy button by touching client code —
set `DODO_PRODUCT_CREDITS`. Mobile credits are a separate IAP path
(see credit-packs-iap.md); this is web-only.
