---
name: Signup OTP email verification
description: Two-step signup (register emails a code, verify-signup creates the account) — why register must NOT auto-login.
---

# Signup OTP email verification

Signup is two steps, mirroring the password-reset-code pattern (sha256 hash, TTL, attempt burn):

1. `POST /api/auth/register` (alias `/api/signup`) validates input, rejects existing users (409), stashes a **pending** row (hashed password + hashed 6-digit OTP + expiry) in `signupVerifications`, emails the code, and returns `{success, data:{email, pendingVerification:true}}` with **NO token and NO user** (502 if the email send fails).
2. `POST /api/auth/verify-signup` (alias `/api/verify-signup`) checks the code (10-min TTL, max 5 attempts then burn, `timingSafeEqual`), then creates the real user, deletes the pending row, and returns `{user, token}` (201).

**Why:** Earlier signup created the account + auto-logged-in immediately on `register`. A reviewer/validation step may be tempted to "fix" `register` to return a token again — do NOT. The whole point is the account does not exist until the emailed code is verified. The token/user only ever come back from `verify-signup`.

**How to apply:**
- Both web (`AuthCard.tsx`) and mobile (`AuthSheet.tsx`) have an `otp` step between credentials and the welcome screen. AuthContext splits `signup()` (request code only, no session) from `verifySignupOtp(email, code)` (finalize + persist session). Keep them split.
- Resend = re-call `signup()` (the component still holds name/password in state), which regenerates + re-emails the code.
- Mobile mock path (`mockApi.ts`, USE_MOCK_DATA): `signup` returns `{success}` only; `verifySignupOtp` accepts any 6-digit code and returns a session — keep this coherent with the two-step model.
- OTP `code` schema is exactly `^\d{6}$`. `verify-signup` wraps `createUser` in try/catch → clean 409 (not 500) on the rare concurrent-verify unique-email race.
- Resend relies on Resend deliverability: only the account-owner address receives mail unless a domain is verified (same constraint as password reset).
