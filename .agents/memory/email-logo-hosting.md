---
name: Email logo / brand asset hosting
description: How to make images render in transactional emails (Resend) for the PDF Genius app.
---

# Email logo hosting

Transactional emails (signup OTP, password reset) are built in
`artifacts/api-server/src/lib/email.ts` via the shared `otpEmailHtml()` builder.

**Rule:** email clients cannot load relative URLs or (reliably) data URIs, so any
image in an email MUST be an absolute, publicly-reachable https URL.

**How it's done here:** the brand logo lives in the WEB app's Vite public dir
(`artifacts/pdf-convert-master/public/genius-logo.png`). The web app owns `/`, so
the file is served at `/genius-logo.png` — by Vite dev server in development and
by static `dist/public` in production (Vite copies `public/` → `dist/public` on
build). Real files take precedence over the SPA `/* → /index.html` rewrite.

The api-server builds the absolute URL at runtime with `getLogoUrl()`:
`PUBLIC_APP_URL` override, else `https://<first REPLIT_DOMAINS entry>/genius-logo.png`.
This auto-points at the dev domain in dev and the deployed domain in prod.

**Why:** a previously hardcoded `https://pdfgenius.app/logo.png` was a placeholder
domain that 404'd, so clients rendered the `alt` text next to a broken-image icon.

**Gotcha:** don't reintroduce a hardcoded external domain for the logo, and don't
expect `attached_assets/` to be web-served — copy brand assets into the web app's
`public/` dir instead.
