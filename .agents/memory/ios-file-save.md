---
name: iOS file save / "download"
description: Why mobile "Download" on iOS must use the system Save sheet, not a silent Documents copy.
---

# iOS "Download" must use the system Save dialog

In `pdf-convert-mobile`, saving a converted file to the device (`services/files.ts` `saveFile`) is per-platform:
- **Android** — Storage Access Framework: user picks a folder once, it's remembered, file genuinely lands there. Reliable.
- **iOS** — open the system "Save to Files / Save Image" sheet via `expo-sharing` `Sharing.shareAsync`. Returns a neutral `SaveResult` status `"presented"` (we can't read save-vs-cancel), so callers show NO success alert on iOS.
- **Web** — `<a download>` anchor.

**Why:** iOS has no app-writable global Downloads folder. A silent copy into the app's `documentDirectory` is **invisible in Expo Go** (the running app is Expo Go, not your app) and only surfaces under "Files → On My iPhone → <App>" in a *fully installed* build (and only with `UIFileSharingEnabled` + `LSSupportsOpeningDocumentsInPlace` in `app.json` `ios.infoPlist`, which are set). A user testing in Expo Go who is told "saved to On My iPhone → PDF Convert Master" will find no such folder — that exact false promise caused a complaint. The system Save sheet is the only path that's findable in BOTH Expo Go and standalone.

**How to apply:** Keep a SINGLE "Download" button (user rejected a separate Share button). On iOS the Download action presents the system sheet (this is the OS save dialog, not a "share feature"). The sheet must be presented AFTER the format modal fully dismisses (iOS serializes modals — defer via a ref fired on the format modal's `onDismiss`, else iOS silently drops the sheet). `Sharing.shareAsync` needs a real on-disk path with the correct extension, so copy the output into the cache under its final name before handing it off. All save callers (`convert/[toolId].tsx`, `editor/image.tsx`, `editor/pdf.tsx`, `(tabs)/files.tsx`) only act on `"saved"`/`"failed"` and ignore `"presented"`/`"cancelled"`.
