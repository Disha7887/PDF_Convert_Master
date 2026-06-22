---
name: Mobile file save (single Download button)
description: How pdf-convert-mobile saves files per-platform from one Download button, and the constraints.
---

# Single Download button, per-platform save

`services/files.ts#saveFile(uri, name)` is the single save entry point for the Expo app, returning `{status:"saved",location} | {status:"presented"} | {status:"cancelled"} | {status:"failed"}`. All download buttons call it; there are no per-screen `shareFile` copies. Note: iOS uses `expo-sharing` internally to present the system Save sheet — see `ios-file-save.md`.

**Why:** user (non-technical, Android+iOS) wants ONE "Download" button (rejected a separate Share button). On Android that means a direct folder save; on iOS the system Save sheet is the only reliably-findable path (see `ios-file-save.md`).

## Per-platform reality (the honest constraints)
- **Android**: uses Storage Access Framework (`expo-file-system/legacy` `StorageAccessFramework`). The folder is picked ONCE via `requestDirectoryPermissionsAsync()` and persisted in AsyncStorage (`downloads.safDirectoryUri`); later saves are silent. There is no truly zero-prompt API for arbitrary documents under scoped storage — the one-time picker is expected.
- **iOS**: opens the system "Save to Files / Save Image" sheet via `expo-sharing` (returns status `"presented"`, no success alert). SUPERSEDED the old silent `documentDirectory` copy — that copy is invisible in Expo Go and only surfaced in a fully installed build. See `ios-file-save.md` for the full rationale.
- **Web**: anchor `<a download>` + `URL.revokeObjectURL` for blob URLs.

## Gotchas
- **Don't treat every SAF write error as a revoked permission.** On a write failure in the remembered folder, check `readDirectoryAsync(dirUri)` first: if the folder still lists, it was an ordinary write error → return `failed` (don't wipe the saved permission and re-prompt). Only clear + re-request when the folder is genuinely inaccessible.
- **Duplicate filenames**: some SAF providers throw instead of auto-renaming; retry once with a unique `name <timestamp>.ext` so the save still succeeds.
- `app.json` (infoPlist) is a NATIVE change → needs a fresh EAS build to appear in an installed APK/IPA; JS-only changes still need a rebuild here because no OTA is configured.
- iOS deferral in convert screen: the save runs on the format modal's `onDismiss` (iOS serializes modal transitions); Android/web run inline.
