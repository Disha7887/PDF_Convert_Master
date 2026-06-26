---
name: RevenueCat seed app-identifier reconciliation
description: How the RC seed handles a changed app package name / bundle id, and why a plain re-seed is not enough.
---

# RevenueCat seed: store-app identifier reconciliation

The seed (`scripts/src/seedRevenueCat.ts`) is keyed on a single RC project named "PDF Genius".
Its `ensureApps` finds existing store apps **by `type`** (`test_store` / `app_store` / `play_store`),
NOT by package name. So if the app's package name / bundle id changes, simply re-running the old
seed would log "Play Store app already exists" and leave the stale identifier in place — purchases
would then verify against the wrong store app and silently fail.

**Rule:** the RC store-app identifier (`play_store.package_name`, `app_store.bundle_id`) IS mutable
in place via `updateApp` (PATCH) — you do NOT need to delete + recreate (which would drop products).
`ensureApps` now compares the existing identifier to the configured constant and calls `updateApp`
to reconcile drift.

**Why:** when the app package was renamed (e.g. `com.pdfconvertmaster.app` → `com.pdfgenius.app`),
the RC apps kept the old identifier; the fix was an in-place `updateApp`, confirmed via `listApps`.

**How to apply:** whenever `APP_STORE_BUNDLE_ID` / `PLAY_STORE_PACKAGE_NAME` change in the seed,
just re-run the seed — it self-heals. Verify with a one-off `listApps` read. The RC project id and
store-app ids are stable across the rename (same `app_id`s), so stored env vars need not change.
