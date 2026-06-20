---
name: Canvas live-frame gallery for the Expo app
description: How to embed every page of the pdf-convert-mobile Expo app as live canvas iframes
---

# Showing every Expo page as live canvas iframes

To put all app screens on the canvas as live, interactive frames, embed the Expo
web dev domain per-route as `state: "live"` iframe shapes:
`https://$REPLIT_EXPO_DEV_DOMAIN/<route>` (e.g. `/tools`, `/dashboard/usage`).

**Why this works:** the Expo web domain returns 200 for every expo-router deep
route (SPA) and sends no `X-Frame-Options`/CSP frame block, so iframes render.
Routes mirror the `app/` file tree; canonical paths live in `constants/routes.ts`.

**How to apply / gotchas:**
- Dashboard pages (`app/dashboard/*`, `(tabs)/dashboard`) do NOT redirect when
  logged out — they render an inline "Sign In" empty state. A fresh iframe starts
  signed out (empty AsyncStorage/localStorage). Use live frames so the user can
  click Sign In to reach authed views; you cannot pre-auth an iframe.
- Editors (`app/editor/pdf`, `app/editor/image`) and `convert/[toolId]` only
  `router.replace('/tools')` inside their `goBack` handler, not on mount — without
  a `uri`/valid `toolId` they show a standalone "no document"/empty state.
- ~23 simultaneous live Expo iframes is heavy but works; the JS bundle is browser-
  cached after the first frame loads.
- The Expo domain is `<id>.expo.sisko.replit.dev` (note the `expo.` subdomain),
  distinct from the main proxy `<id>.sisko.replit.dev` used for `/__mockup/`.
