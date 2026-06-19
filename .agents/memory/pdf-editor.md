---
name: PDF editor (annotate/Edit-PDF) constraints
description: Coordinate-space and undo/redo design rules for the in-browser PDF editor; read before touching PdfEditor or pdfClient rendering.
---

# Render in UNROTATED space so editor geometry matches pdf-lib export
pdf.js (`renderPdfPages`) applies the page `/Rotate` by default, so the on-screen preview is in *rotated* space. But pdf-lib draws/exports in the page's *unrotated user space* (it ignores `/Rotate` for `drawText`/`drawImage` coordinates). If the editor places overlays against the rotated preview, saved annotations land in the wrong spot on rotated PDFs.

**Rule:** the editor must render pages with rotation forced to 0 (`renderPdfPages(..., {forceUnrotated:true})`) so click/overlay geometry is in the same space pdf-lib exports into. Keep the page's native `/Rotate` on the saved doc — that way the annotation layer rotates *together with* the page content and stays aligned. Warn the user (toast) when any page has `rotation !== 0` since it's shown in native orientation.

**Why:** undiscoverable from code at a glance — the bug only shows on rotated input. Confirmed: a 90°-rotated 595×842 page must render portrait (aspect ≈0.707); if it renders landscape (≈1.414) you forgot `forceUnrotated`.

**How to apply:** any new pdf-lib-export feature that positions content from a pdf.js preview must render its preview unrotated. Other read-only tools (rotate/crop/merge) can keep the default (rotation applied).

# Undo/redo must route ALL property edits through history AND clear the redo stack
Selected-element property/content edits (text, font size, colors, stroke width, stamp/note text, etc.) must NOT call the raw element-updater directly — that bypasses history, so undo jumps past the edit (deleting the element that was created before it) and redo branches to a stale state.

**Rule:** route rapid/continuous edits through a coalescing path (`propEdit(sessionKey, id, patch)`) that pushes ONE history snapshot per `${id}:${field}` "session" (so holding a slider / typing a word = one undo step), and discrete toggles (bold/italic/font-family) through a one-step path (`discreteEdit`). BOTH must (a) push history and (b) clear the redo/`future` stack. Reset the edit-session token on `pushHistory`/`undo`/`redo` so each new action starts a fresh step. Note undo/redo clear selection, so option inputs unmount — re-select the element to read its value in tests.

**Why:** took multiple attempts; the failure (undo deletes the element, redo branches) is subtle and only appears when you edit *after* creating.

**How to apply:** every new selected-element editing control must go through `propEdit`/`discreteEdit`, never the raw updater. Also reset transient pointer refs (creating/drag/snapshot/session) + tool on file load so a mid-interaction swap can't leave stale state.
