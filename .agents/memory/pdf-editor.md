---
name: PdfEditor element model & text editing
description: Non-obvious constraints when adding/editing elements in client/src/components/PdfEditor.tsx and its color sampling.
---

# PdfEditor (/upload/edit-pdf) constraints

- **Render order == array order; later elements paint OVER earlier ones.** When
  batch-adding pairs like (whiteout cover + editable text) for many text runs at
  once, append **all covers first, then all texts**. Interleaving `[cover,text,
  cover,text,...]` lets a later run's padded cover box overlap and clip the
  previous run's text. **Why:** "edit whole page" turns each PDF text run into a
  white cover + a TextEl on top; adjacent lines' covers have vertical padding
  that can overlap the neighbour's text.

- **"Edit text" = convert text to editable elements, it is NOT a live mode.** The
  tool button is a one-shot action (`handleEditWholePage`) that converts the most
  visible page, then switches to the Select tool. Dedup is **by position** (skip a
  run if a `type==="text"` element already sits within ~3pt of it) so re-running
  is idempotent and user edits are preserved; dedup by text content would re-cover
  lines the user already edited.

- **`loadImageElement` (pdfClient) does NOT cache.** Any per-run pixel sampling of
  a page image must decode the image ONCE and sample all boxes from it
  (`sampleTextColors` batch helper), or you re-decode the full page image once per
  run. **How to apply:** prefer the batch sampler for whole-page work; the single
  `sampleTextColor` is fine only for one box.
