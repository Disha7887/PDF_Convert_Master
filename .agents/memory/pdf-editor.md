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

- **Inline on-page text editing = contentEditable mounted over the run; entered by
  detecting a 2nd pointerdown (manual double-tap), NOT onDoubleClick.** The
  element's `onElementPointerDown` calls `setPointerCapture(page)`, which retargets
  the subsequent native `click`/`dblclick` to the page container — so React
  `onDoubleClick` on the element never fires. Track `{id,t}` of the last tap and,
  on a 2nd pointerdown on the same id within ~400ms, enter edit mode.
  **Why:** verified via e2e that dblclick lands on `page-0`, not the text run.

- **CRITICAL focus-theft race when opening a contentEditable during pointerdown:**
  after the React pointerdown handler returns, the browser's default mousedown
  focus action fires and immediately blurs (focusout) the editor you just
  mounted+focused → `onBlur`→commit tears it down before the user can type. **Fix:
  call `e.preventDefault()` on that pointerdown** (both the double-tap-to-edit
  branch AND the click-to-create-new-text branch) to cancel the focus default.
  `useLayoutEffect` for focus alone does NOT fix it — the theft happens after the
  handler regardless. **How to apply:** any "click/tap opens an auto-focused
  inline input" interaction in this editor needs preventDefault on the originating
  pointerdown.
