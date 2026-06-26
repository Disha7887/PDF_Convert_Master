---
name: Scanner image→PDF build (mobile)
description: How the camera/scanner builds a PDF from images, and why Print HTML must not be used.
---

# Scanner image→PDF must use pdf-lib, not Print HTML

The camera scanner's "Save as PDF" builds the PDF in `app/(tabs)/scanner.tsx` `buildPdf()`.

**Rule:** build it with `pdf-lib` — transcode each page to JPEG via `expo-image-manipulator`
(`ImageManipulator.manipulate(uri).renderAsync()` → `saveAsync({format: SaveFormat.JPEG, base64:true})`),
then `pdf.embedJpg(\`data:image/jpeg;base64,...\`)`, one page per image sized to the image, and write
bytes with `LegacyFS.writeAsStringAsync(uri, base64, {encoding: Base64})`. On web return a
`data:application/pdf;base64,...` URI instead of writing a file.

**Why:** the old implementation rendered `<img>` HTML through `expo-print`
`Print.printToFileAsync({html})` with large inline base64 images. On many Android devices this produced
**corrupt / unopenable PDFs** ("file cannot open") even though the save reported success. Transcoding to
JPEG also fixes gallery imports that are actually PNG/HEIC but inlined as `image/jpeg`.

**How to apply:** never reintroduce `expo-print` for scanner PDFs. pdf-lib works on Hermes here thanks to
the existing tslib→CJS metro resolver fix (see expo-web-metro-replit.md); the repeated tslib export WARN
is expected and harmless. Changes are JS/route-level but still need a fresh EAS build (or OTA) to reach a
device — they won't appear in an already-installed APK.
