---
name: Google OAuth (web sign-in)
description: How "Continue with Google" works on pdf-convert-master and the external Google Cloud config it depends on.
---

# Google OAuth — popup code flow

The web Google button runs the Google Identity Services (GIS) popup **code** flow, not the redirect or ID-token-button flow. The browser gets a short-lived auth code and posts it to our own backend, which exchanges + verifies it and issues the SAME JWT email/password login returns (full session parity).

- **Why postmessage:** the backend exchanges the code with `OAuth2Client(clientId, clientSecret, "postmessage")`. `"postmessage"` is the required redirect_uri value for the GIS popup code flow — there is no real redirect URI to register.
- **Client ID is served at runtime**, not baked into the bundle: the web fetches it from a public backend config endpoint. **Why:** avoids a build-time `VITE_` env var / rebuild and keeps one source of truth (`GOOGLE_CLIENT_ID`). The client secret never leaves the server.
- New Google users are created with a random bcrypt password hash (the users table `password_hash` is NOT NULL). They can't email/password login until they reset their password.
- Verify `email_verified === true` strictly before trusting the Google email.

# External dependency (NOT in code)

For the popup to work, the app's web origin must be listed under **Authorized JavaScript origins** for that OAuth client in Google Cloud Console (e.g. the Replit dev domain AND `https://pdfgenius.app`). No "Authorized redirect URI" is needed for the postmessage popup flow. If origins are missing, the popup fails with an origin/redirect_uri_mismatch-style error even though the server code is correct.
