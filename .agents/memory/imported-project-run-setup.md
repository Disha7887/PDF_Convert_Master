---
name: Imported project run setup (PDF Genius)
description: How to get this imported monorepo running on a fresh Replit env — secrets, workflows, ports, and registry quirks.
---

# Getting the imported repo running on a fresh Replit env

When this project is freshly imported (cloned from GitHub), the artifact registry callbacks
(`listArtifacts`, `presentArtifact`, `screenshot` app_preview) return EMPTY / "Artifact not found"
even though `.replit-artifact/artifact.toml` files exist for every artifact. The app still runs and
is visible in the preview pane via the webview workflow + dev-domain proxy — don't burn time trying to
make `presentArtifact`/`screenshot` resolve it.

**Why:** the platform's artifact registry isn't synced to the on-disk `artifact.toml` after a raw import.

**How to run it:** there are NO workflows on import. Configure them manually, and inject `PORT` inline
(the artifact system normally injects it from `localPort`, but manual `configureWorkflow` does not — the
api-server and vite both hard-fail / mis-bind without it):
- API Server: `PORT=8080 pnpm --filter @workspace/api-server run dev` (console, waitForPort 8080) — localPort 8080, serves `/api`.
- Web: `PORT=21027 BASE_PATH=/ pnpm --filter @workspace/pdf-convert-master run dev` (webview, waitForPort 21027) — localPort 21027, serves `/`.
Verify via `https://$REPLIT_DEV_DOMAIN/` (200) and `/api/health` (JSON), not the screenshot tool.

# Secrets the app needs (full inventory)
- Required (user-provided): `SUPABASE_DB_URL`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `JWT_SECRET`.
  Google login here uses RAW OAuth creds read from env (not a Replit connector) — see google-oauth-web.
- Object storage (Replit-provisioned via `setupObjectStorage()`): `PRIVATE_OBJECT_DIR`, `PUBLIC_OBJECT_SEARCH_PATHS`, `DEFAULT_OBJECT_STORAGE_BUCKET_ID`.
- Optional connectors (Replit credential proxy, no raw key stored): Resend (password-reset / verification emails — soft-fails silently if not connected), Replicate (some AI conversions; falls back to `REPLICATE_API_TOKEN`).
- Optional external: `REMOVE_BG_API_KEY` (remove.bg) — only the background-removal tool needs it.
- Auto/runtime-managed: PORT, BASE_PATH, REPL_ID, REPLIT_DOMAINS, REPLIT_CONNECTORS_HOSTNAME, etc.
- Mobile (EAS build-time only, baked into eas.json → Railway): `EXPO_PUBLIC_DOMAIN`, `EXPO_PUBLIC_REPL_ID`.

# Health-check path mismatch
The real route is `GET /api/health`; `pdf-convert-master`/api-server `artifact.toml` production health
startup points at `/api/healthz` (404). Railway prod uses its dashboard health config, so this only
bites a Replit-native deploy. Fix the toml path or add a `/api/healthz` alias if deploying on Replit.
