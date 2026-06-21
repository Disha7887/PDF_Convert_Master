---
name: Shared format chooser (mobile)
description: One DownloadFormatModal drives both tool Download and scanner Save format selection.
---

`components/DownloadFormatModal.tsx` is the single output-format chooser used by BOTH
`app/convert/[toolId].tsx` (tools Download) and `app/(tabs)/scanner.tsx` (camera Save).

**Why:** user wanted the scanner Save flow to look/behave identically to the tools'
Download flow. Previously the scanner had its own bottom-sheet that saved immediately
on row tap — visually inconsistent.

**How to apply:**
- It's a presentational celebrate-card modal (CELEBRATE_XML header + format grid with
  formatIconXml glyphs + tick selection + optional filename Field + Cancel/Confirm).
- Pattern is select-then-confirm (not tap-to-act). Caller owns selectedId/onSelect,
  fileName/onChangeFileName, and onConfirm.
- Context wording differs via props: `sectionLabel` ("Download as:" vs "Save as:"),
  `confirmLabel`/`confirmIcon`. Keep these per-context; don't hardcode in the component.
- Scanner still does real saves (buildPdf / reencodeImage / addFile); chooser only
  picks format + name.
