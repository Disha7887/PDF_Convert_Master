---
name: Dodo Payments web billing
description: How real subscription billing works in the pdf-convert web app (checkout/portal/webhook), and the non-obvious constraints.
---

# Dodo Payments (web app billing)

Replaces the old no-payment plan switch. Plans: free $0 / pro $9 / business $29.

## Source of truth
Dodo subscription state is the source of truth for `users.plan`; the webhook
mirrors it. The DB tracks `dodoCustomerId` + `dodoSubscriptionId` on users
(nullable text cols, pushed to Supabase via `pnpm --filter @workspace/db run push`).

## Flow
- Upgrade (free→paid): `POST /api/billing/checkout` → hosted Dodo checkout redirect.
- Switch/cancel (existing subscriber): Dodo **customer portal** only (`/api/billing/portal`).
- `/api/account/plan` is restricted to free-only and rejects a free switch while
  `dodoSubscriptionId` is set — this is what closes the monetization hole.
- `/api/billing/checkout` refuses a second checkout when a sub already exists.

## Webhook (`/api/billing/dodo/webhook`)
- No auth; authenticity = Standard-Webhooks HMAC verified against
  `DODO_PAYMENTS_WEBHOOK_KEY` over the RAW body (captured in app.ts express.json `verify`).
- Only `subscription.*` events are acted on (one-time/credit packs are mobile/RevenueCat).
- **Plan tier = product id, not metadata.** `getPlanForProductId(product_id)` is
  authoritative; `metadata.planId` is only a fallback (it goes stale after a
  portal plan switch).
- **Gate downgrades by subscription_id match.** On cancelled/expired/failed, only
  downgrade to free if the event's `subscription_id` equals the user's tracked
  `dodoSubscriptionId` — otherwise a delayed/out-of-order cancel for a replaced
  sub would wrongly revoke paid access.
**Why:** both bugs were caught in architect review; without them stale events
corrupt plan state.

## Config (env vars, not secret except keys)
- Secrets: `DODO_PAYMENTS_API_KEY`, `DODO_PAYMENTS_WEBHOOK_KEY`.
- Env: `DODO_PRODUCT_PRO`, `DODO_PRODUCT_BUSINESS`, `DODO_PAYMENTS_ENVIRONMENT`
  (`test_mode`|`live_mode`). `isBillingConfigured()` = api key + ≥1 product id;
  `/api/billing/config` exposes `enabled` to the web UI.
- User must create the webhook in the Dodo dashboard → subscription events →
  endpoint `https://pdfgenius.app/api/billing/dodo/webhook`.

## SDK product creation shape (recurring)
`client.products.create({ name, tax_category:"saas", price:{ type:"recurring_price",
price: dollars*100, currency:"USD", payment_frequency_interval:"Month",
subscription_period_interval:"Month", ... } })`. Going live = recreate products in
live_mode and swap the product-id env vars + `DODO_PAYMENTS_ENVIRONMENT=live_mode`.
