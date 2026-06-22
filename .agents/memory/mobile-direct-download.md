---
name: Mobile direct download (no share sheet)
description: How pdf-convert-mobile saves files directly to the device instead of opening the expo-sharing share sheet, and the per-platform constraints.
---

# Direct download instead of share sheet

`services/files.ts#saveFile(uri, name)` is the single download entry point for the Expo app, returning `{status:"saved",location} | {status:"cancelled"} | {status:"failed"}`. All download buttons call it; there are no longer any per-screen `shareFile` copies and `expo-sharing` is no longer used.

**Why:** user (non-technical, Android+iOS) wants tapping "Download" to put the file on the device directly, not open a share sheet.

## Per-platform reality (the honest constraints)
- **Android**: uses Storage Access Framework (`expo-file-system/legacy` `StorageAccessFramework`). The folder is picked ONCE via `requestDirectoryPermissionsAsync()` and persisted in AsyncStorage (`downloads.safDirectoryUri`); later saves are silent. There is no truly zero-prompt API for arbitrary documents under scoped storage — the one-time picker is expected.
- **iOS**: copies into `documentDirectory`. The file is only visible to the user (Files app → On My iPhone → app) because `app.json` sets `ios.infoPlist.UIFileSharingEnabled` + `LSSupportsOpeningDocumentsInPlace`. Without those keys the copy is invisible.
- **Web**: anchor `<a download>` + `URL.revokeObjectURL` for blob URLs.

## Gotchas
- **Don't treat every SAF write error as a revoked permission.** On a write failure in the remembered folder, check `readDirectoryAsync(dirUri)` first: if the folder still lists, it was an ordinary write error → return `failed` (don't wipe the saved permission and re-prompt). Only clear + re-request when the folder is genuinely inaccessible.
- **Duplicate filenames**: some SAF providers throw instead of auto-renaming; retry once with a unique `name <timestamp>.ext` so the save still succeeds.
- `app.json` (infoPlist) is a NATIVE change → needs a fresh EAS build to appear in an installed APK/IPA; JS-only changes still need a rebuild here because no OTA is configured.
- iOS deferral in convert screen: the save runs on the format modal's `onDismiss` (iOS serializes modal transitions); Android/web run inline.
