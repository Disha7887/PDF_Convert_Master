---
name: Edit Text tool (pdf-convert-mobile)
description: How the mobile PDF editor's "Edit Text" tool makes existing PDF text editable in place, at parity with the web editor.
---

"Edit Text" makes every real text run on the current page editable in place, at
parity with the web editor's whole-page "Edit text" (`handleEditWholePage`).

- **Web-only extraction.** Text extraction (pdf.js `getTextContent`) and ink
  color sampling (canvas pixels) live in `services/pdfText.web.ts`; the native
  twin `services/pdfText.ts` returns `[]` / a dark fallback. Metro picks `.web.ts`
  on web and keeps pdf.js out of the native bundle (same split as `pdfRender`).
  On native this reports the page as image-only rather than editing.
- **Per run:** drop a white `whiteout` cover over the run, then an editable
  `text` element on top matching detected color / size (points) / family. The
  existing select + properties panel then handles char-level + color/size/font.
- **Order matters:** push ALL covers first, then ALL texts, so a later line's
  cover can't paint over an earlier line's editable text.
- **Skip duplicates:** skip runs that already have an editable text box at that
  spot (Δfraction < ~0.004, preserves earlier edits) and overprinted dupes (same
  trimmed string within `tol = max(2, fontSize*0.5)` points — fake-bold double
  prints). Empty/scanned pages show a friendly "no selectable text" notice.
- Coordinate/scale correctness depends on the rules in
  `mobile-pdf-editor-coord-scale.md` (points→fraction, `ptScale`, rotation:0).

UX: "Edit Text" is a real selectable tool — tapping it sets `activeTool="edittext"`
so the button highlights like Text/Draw, and it STAYS active (does not auto-switch
to "select") so the press gives visible feedback. It must NOT be in `CAPTURE_TOOLS`,
so blocks stay interactive: tapping a block selects it (→ select mode) to edit,
dragging moves it. A toolbar action that never calls `setActiveTool` can never show
an active state and reads as "unclickable" — set the tool, don't silently jump to
select.

## Add Text tool = tap-to-place free text (distinct from Edit Text)

The "Add text" (`activeTool="text"`) tool is for placing brand-new free text
ANYWHERE the user taps — not for editing existing PDF text (that's Edit Text).
- `"text"` IS in `CAPTURE_TOOLS` so the full-page placement layer is active.
- The placement PanResponder skips drag-to-draw for text (no preview rect); on
  release it calls `placeTextAt(cx,cy)` which creates an EMPTY `text` element at
  the tapped page-fraction coords, `addElement` auto-selects it, then it switches
  to `"select"` so the `InlineTextEditor` (autoFocus) opens for immediate typing.
- **Prune empties scoped to the blurred element, never globally.** `endTextEdit`
  now takes the element `id` (threaded `onEnd={() => onEndTextEdit?.(el.id)}`) and
  removes only THAT box if its text is empty/whitespace, clearing `selectedId` if
  it pointed at it. A global "remove all empty text" prune on blur is wrong — it
  can delete another intentional box. Use direct `setElements` (not `commit`) so
  pruning an abandoned tap doesn't create an undo step.
- The Text properties panel sets style defaults (font/size/color) only — there is
  NO panel text input / "Add to page" button; placement is tap-driven.

## Auto-select on draw (fixes "can't move/resize" perception)

After drawing/placing a shape (`placeShape` / `commitDrawnShape`), call
`setSelectedId(el.id)` BEFORE `setActiveTool("select")`. Without an explicit
selection nothing shows a resize handle/selection ring after drawing, so users
report highlights/whiteouts "won't move and can't resize" even though the
FreeBox/DraggableBox move+resize responders are correct. Auto-select makes the
handle appear immediately.
