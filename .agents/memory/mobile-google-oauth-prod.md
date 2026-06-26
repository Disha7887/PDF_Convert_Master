---
name: Mobile Google OAuth redirect base URL
description: Why mobile Google sign-in 503'd in production and how the redirect_uri base is resolved.
---
Mobile Google sign-in is backend-mediated: app opens `/api/auth/google/mobile/start`,
server redirects to Google with `redirect_uri = <base>/api/auth/google/mobile/callback`.

**Why it broke in prod:** `getPublicBaseUrl()` resolved base from `PUBLIC_APP_URL` then
`REPLIT_DOMAINS`. Production runs on Railway where NEITHER exists, so base was null →
`/start` returned 503 "Google sign-in isn't configured yet" → login dead on phone.

**Fix:** added a final fallback that derives base from the request's forwarded host
(`x-forwarded-proto`/`x-forwarded-host`, like `appOrigin()` in routes.ts). Safe against
Host spoofing because Google only honours redirect_uris registered in its console and the
final app redirect is gated to the `pdfgenius://` scheme (isAllowedAppRedirect).

**Still required as MANUAL config (not code):** the exact redirect_uri
`https://pdfgenius.app/api/auth/google/mobile/callback` MUST be added to Authorized
redirect URIs in Google Cloud Console, or Google returns redirect_uri_mismatch. Uses the
SAME web GOOGLE_CLIENT_ID/SECRET as the web popup flow. Code change only takes effect after
the Railway backend is redeployed.
