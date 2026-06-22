---
name: Profile settings & password reset flow
description: Cross-platform (web/mobile/backend) account-management + email reset-code design rules that are easy to break.
---

# Profile settings & password-reset flow

Feature spans api-server (Express), pdf-convert-master (web), pdf-convert-mobile (Expo).

## Rules that are easy to break

- **Profile update rotates the JWT.** The server reissues the token on
  `PATCH /api/auth/profile` because the email is a token claim. BOTH web and
  mobile must persist the returned token (`updateUser(user, token)` web /
  `updateUser(partial, token)` mobile). Dropping it leaves a stale token after
  an email change.
  **Why:** architect flagged a web/mobile parity gap where mobile silently
  dropped the rotated token.

- **forgot-password is intentionally always-success.** It returns the same
  "if an account exists…" message regardless of whether the email exists — do
  not "fix" it to reveal account existence (enumeration leak).

- **Reset codes are brute-force throttled.** `password_reset_codes.attempts`
  is incremented on each wrong code; the code is consumed/burned after 5
  failures. A 6-digit code is otherwise guessable within its 15-min TTL.
  **How to apply:** keep the attempts increment + limit in
  `auth.ts resetPassword`; don't remove it when refactoring.

- **Emails go through the Resend connector** (`lib/email.ts`, connector proxy —
  no stored API key). If Resend isn't connected, sending soft-fails and the
  reset flow still returns success; real delivery requires the Resend
  connection to be bound to this Repl.

- **Avatar:** `POST /api/auth/avatar` multipart field name is **`avatar`**;
  served back (public) at `GET /api/auth/avatar/:userId`; user.profilePictureUrl
  is a cache-busted origin-relative URL.
