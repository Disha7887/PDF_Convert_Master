---
name: iOS Safari web file download
description: Why pdfgenius.app web downloads use Web Share on iOS, not <a download>
---

On the **deployed web app** in mobile Safari (iPhone/iPad), the blob + `<a download>`
trick (lib/download.ts `downloadFromUrl`) does NOT save the file — iOS Safari
**ignores the `download` attribute for `blob:` URLs** and opens the file inline in
the tab, so the user perceives "download doesn't work" (desktop/Android are fine).

**Rule:** in `downloadFromUrl`, when `isIOS()` and `navigator.canShare?.({files})`,
build a `File` from the blob and call `navigator.share({files})` (offers
"Save to Files"/Photos). Treat `AbortError` (user dismissed the sheet) as success;
fall through to the anchor download otherwise. Keep anchor path for desktop/Android.

**Why:** distinct from the Replit-iframe issue already noted in
`web-download-iframe-blob.md` (that's about popups/navigation being sandboxed). This
is the real public site on iOS hardware.

**Caveats:** `navigator.share` needs HTTPS + transient activation, so it must run
after the user's tap; a slow fetch can expire activation → falls back to anchor.
Fix is code-side only; takes effect on next Railway deploy of the web build.
