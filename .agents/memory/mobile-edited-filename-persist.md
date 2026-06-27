---
name: Mobile edited-filename persistence
description: Why the rename in the download modal is patched post-conversion
---

Mobile convert flow writes the History + Files entries at **conversion completion** (in `convert()`),
using the original server output name — this happens BEFORE the user opens the download modal and
renames. So the edited name must be applied as a **patch after the fact**, not at write time.

Mechanism: `convert()` stores the created entry ids in `savedEntryRef`
(`{historyId: h_<createdAt>, fileId: f_<createdAt>}`); `onConfirmDownload` then calls
`updateHistory`/`updateFile` (added to constants/history.ts + constants/files.ts) to patch
`fileName`/`name` (and outputFormat) to the user-confirmed `fullName`.

**Why:** persisting at conversion time is intentional (entry exists even if user never downloads).
Don't "fix" by moving the persist into onConfirmDownload — patch instead.

**Gotcha:** Files-tab re-download only appends the extension if missing
(`!name.endsWith('.'+ext)`), so storing `fullName` (already has ext) does NOT double-extension.
