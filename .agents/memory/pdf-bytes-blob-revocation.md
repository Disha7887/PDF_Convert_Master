---
name: PDF bytes cache vs blob: URL revocation (mobile web)
description: Why readPdfBytes caches bytes — web blob URLs can die after first use, breaking later re-fetchers like Edit Text while cached renderers still work.
---

On Expo **web**, a picked/exported PDF's `uri` is a `blob:`/`data:` object-URL.
These can stop being fetchable after they've been used once — e.g. an export
output URL that the share/download path revokes (`URL.revokeObjectURL`, often on
a delay). The filename `merged (1).pdf` is a tell: it's an export output the user
re-opened in the editor.

**Symptom:** the page renders fine but "Edit Text" fails with "Could not read
this document's text." The renderer caches its *parsed* pdf.js document (one
fetch at open), so it keeps working; but `readPdfBytes` did a fresh `fetch(uri)`
on every call, and text extraction runs *later* (on tap) — by then the blob is
dead, the fetch throws, and the generic catch shows the misleading message.

**Fix / rule:** `readPdfBytes` caches the most-recently read PDF's bytes
(single-entry, keyed by uri). Count/size/render run at open and warm the cache,
so later extraction reuses bytes instead of re-fetching a possibly-revoked blob.

**Why single-entry is safe:** the editor works on one document at a time.

**Detach caveat:** pdf.js `getDocument` *detaches* the buffer it's given. The
cache returns the shared master, so every getDocument caller must pass a copy
(`.slice()`) — they already do (extractPageRuns, renderPdfPage). pdf-lib
`PDFDocument.load` does not detach. Never hand the cached master straight to
getDocument or you'll detach it and poison every later read.

Core extraction (pdf.js getTextContent) is sound — verified it parses a sample
PDF fine in Node; failures here are blob-lifecycle/browser issues, not the logic.

**NOTE:** This bytes cache is a real hardening but was NOT the cause of the
"Could not read this document's text." error. That turned out to be a pdf.js v6
cleanup bug — see `pdfjs-v6-doc-destroy.md`. Don't conflate the two.
