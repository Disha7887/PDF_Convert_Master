---
name: iOS modal-close-then-share race
description: On iOS, presenting a native share sheet right after closing an RN Modal silently fails; defer to the modal's onDismiss.
---

# iOS modal-close-then-share race (Expo mobile)

When a flow closes a React Native `Modal` (e.g. `DownloadFormatModal`) and then
calls `Sharing.shareAsync` (or any other native modal presentation) in the same
tick, iOS silently drops the share sheet.

**Why:** iOS serializes modal presentation (UIKit). Presenting a
`UIActivityViewController` while the previous modal is still animating out is a
no-op — no error, nothing appears. Android/web are unaffected, so the bug looks
"iOS-only download not working."

**How to apply:**
- Don't `setModalVisible(false)` then immediately `Sharing.shareAsync(uri)`.
- Add an `onDismiss` prop to the RN `Modal` (iOS-only callback that fires after
  full dismissal) and defer the share into it. Pattern used in
  `app/convert/[toolId].tsx`: stash the share thunk in a `pendingShareRef` on
  iOS, run it from the modal's `onDismiss`; run inline on non-iOS.
- Only the convert screen had this race. Scanner `saveAs` writes to Files + toast
  (no share); the pdf/image editors share from a button (no preceding modal), so
  they're fine.
- Note: the file download itself works — api-server `/api/download/:id` returns
  200 to the device; `File.downloadFileAsync` succeeds. The failure was purely
  the share-sheet presentation timing.
