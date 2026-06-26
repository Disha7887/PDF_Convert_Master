---
name: S3 storage + Resend on Railway
description: api-server file storage and email no longer depend on the Replit sidecar/connector; both work on any host via env vars.
---

# Storage and email portability (Railway)

The app was moved off Replit-only infrastructure for two services so it runs on Railway.

## Object storage → S3
- **Was:** `lib/objectStorage.ts` used the Replit storage sidecar (`http://127.0.0.1:1106`, GCS `@google-cloud/storage`). This only exists inside Replit, so persistence broke on Railway.
- **Now:** `lib/s3Storage.ts` is a provider-agnostic S3 layer (`@aws-sdk/client-s3`) exposing `putObject/getObject/deleteObject`. Works with AWS S3 or any S3-compatible service (R2, Supabase Storage, MinIO) via `S3_ENDPOINT`/`S3_FORCE_PATH_STYLE`.
- Only real consumers were `conversionStorage.ts` (key `conversions/<jobId>`) and `avatarStorage.ts` (key `avatars/<userId>`) — both simple key→bytes. The old ACL / signed-URL / `PUBLIC_OBJECT_SEARCH_PATHS` / `PRIVATE_OBJECT_DIR` machinery and `objectAcl.ts` were **dead code** and were deleted along with `objectStorage.ts`. `@google-cloud/storage` dependency removed.
- `getObject` maps `NoSuchKey`/`NotFound`/404 → `null`; `deleteObject` is best-effort.
- **Env:** `S3_BUCKET`, `S3_REGION` (default us-east-1), `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`; optional `S3_ENDPOINT`, `S3_FORCE_PATH_STYLE=true`, `S3_KEY_PREFIX`.
- **Why key layout matters:** keys are now fixed logical paths + optional `S3_KEY_PREFIX` (no longer derived from `PRIVATE_OBJECT_DIR`). Old Replit-stored files won't carry over — fine for a fresh Railway bucket; if ever migrating real data, set `S3_KEY_PREFIX` to the old base path.

## Resend email → direct API key
- `lib/email.ts` `getResendCredentials()` now prefers `RESEND_API_KEY` env var (optional `RESEND_FROM`), and only falls back to the Replit connector proxy when no env key is set. Lets emails work on Railway where the connector proxy is absent.
- Sender still forced to a verified `@pdfgenius.app` address via `resolveFromAddress` (Resend rejects unverified domains with 403). Default `noreply@pdfgenius.app`.
