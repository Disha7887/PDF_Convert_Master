---
name: PDF editor overprint dedup
description: Why "Edit Whole Page" in the PDF editor must dedupe overprinted text runs, or text looks doubled and needs deleting twice.
---

# PDF editor: overprint / fake-bold duplicate text runs

Many generated PDFs (bank statements, invoices, anything with "bold" produced by
a writer that lacks a bold font) **fake bold by drawing the same string twice a
fraction of a point apart** (overprint). `pdf.js` `getTextContent()` returns BOTH
copies as separate text runs (e.g. x=40 and x=40.4, same baseline).

**The trap:** the Edit-PDF "Edit Whole Page" feature turns every extracted run
into an editable text box + a whiteout cover. If you don't dedupe, each overprint
pair becomes TWO stacked editable elements at the same spot. Symptoms the user
sees: text looks doubled/ghosted, and deleting it requires two deletes ("first I
delete the copy, then the original").

**Rule:** when converting extracted runs into editable elements, dedupe within the
batch — skip a run if an already-accepted run has the same trimmed string AND is
within `max(2, fontSize*0.5)` points in both x and y. Requiring an exact string
match (not just proximity) prevents merging genuinely distinct adjacent words.

**Why keep the whiteout when the editable text is deleted:** the page renders as a
flat raster image with the original text baked in; the whiteout is what hides it.
Deleting the text but keeping the cover = clean "delete". Removing the cover too
would re-expose the baked original.

**How to apply:** any future code that maps `extractPageTexts` runs onto on-page
overlays (edit, search-highlight, redaction) should account for these duplicates.
