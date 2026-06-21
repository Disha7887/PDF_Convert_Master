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
