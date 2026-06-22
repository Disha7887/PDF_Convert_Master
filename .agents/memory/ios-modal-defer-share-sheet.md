---
name: iOS modal-defer for system share/save sheet
description: On iOS, present the native Save/Share sheet only after a preceding RN modal has fully dismissed, or it silently drops.
---

When a screen shows a custom RN `<Modal>` (e.g. DownloadFormatModal) and then needs to
present the OS Save/Share sheet on confirm, do NOT call the share API while the modal is
still closing on iOS — iOS serializes modal presentation and the share sheet gets dropped.

**Rule:** On iOS, stash the action in a `pendingActionRef` and run it from the modal's
`onDismiss`. On Android, run it immediately (no such serialization constraint).

**Why:** iOS only presents one modal at a time; firing the share sheet during the dismiss
animation of the format modal makes it never appear (no error, just nothing happens).

**How to apply:** Used in pdf-convert-mobile `app/editor/image.tsx`, `app/editor/pdf.tsx`,
and `app/convert/[toolId].tsx` (reference impl). `onConfirmDownload` sets
`pendingActionRef.current = runSave` when `Platform.OS === "ios"`, closes the modal, and the
modal's `onDismiss` fires the deferred action; Android just `await runSave()` inline.
Format/produce logic + download UX live in shared `services/downloadFormats.ts`
(getDownloadFormats, prepareDownloadUri, reencodeImage) so all screens stay consistent.
