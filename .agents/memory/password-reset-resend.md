---
name: Password reset depends on Resend connector
description: forgot/reset-password emails only deliver when the Resend integration is connected; otherwise they soft-fail silently.
---

The password-reset flow (`/api/auth/forgot-password`) generates and stores a code, then emails it via the Resend connector (`lib/email.ts` → `sendPasswordResetEmail`, fetched from the Replit connectors proxy at runtime).

**If Resend is NOT connected, the email send throws and is swallowed** — `forgotPassword` always returns the generic success message (by design, to avoid leaking account existence). The code lives in the DB but the user never receives it. Symptom in logs: `Failed to fetch Resend connection (401)` / `Failed to send password reset email`.

**Why:** the endpoint must never reveal whether an email is registered, so it cannot surface email-delivery failure to the client.

**How to apply:** if a user reports "I never got my reset code," first check that the Resend connector is connected (search/propose the `resend` integration), not the code path. A successful send shows a ~1–2s response time (real outbound API call) with no error logged; a soft-fail returns instantly with the 401 error logged.

## Verified-domain sender (required)
Resend rejects any send whose `from` is not on a VERIFIED domain (HTTP 403
"<domain> is not verified"). The account's verified domain is `pdfgenius.app`.
The Resend connector's configured `from_email` was a free address
(`verify@gmail.com`) which fails every send. `lib/email.ts#resolveFromAddress`
now only honours a connector `from_email` when it ends in `@pdfgenius.app`,
otherwise falls back to `PDF Genius <noreply@pdfgenius.app>`. Don't revert to
trusting the raw connector from_email or to `onboarding@resend.dev` (that shared
sender only delivers to the account owner in test mode).
