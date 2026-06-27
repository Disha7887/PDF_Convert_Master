---
name: Download format honesty (mobile convert modal)
description: Rules for which download formats the post-conversion modal may offer per tool.
---

The post-conversion "Awesome job!" download modal (pdf-convert-mobile convert screen)
must only offer formats it can genuinely produce from the actual result.

**Rule:** classify by `tool.serverToolType`, not by fuzzy `outputFormat` string matching.
- Single raster-image tools (resize/crop/rotate/convert-image-format/compress/upscale)
  → PNG/JPG via on-device re-encode (PNG-only when the output needs transparency).
- OCR → searchable PDF always; Word/TXT/HTML/MD only when recognized OCR text is
  actually present (gate on it), else those would silently emit PDF bytes with a wrong
  extension.
- Everything else (documents, PDFs, and multi-image outputs) → passthrough the produced
  file unchanged with its real extension.

**Why:** `pdf_to_images` returns a **ZIP archive** from the server, not a single image.
Heuristic "looks like an image" matching offered PNG/JPG and then tried to re-encode the
ZIP URI as a bitmap, which fails. Fuzzy outputFormat matching also misclassified tools.

**How to apply:** when adding a tool or changing its output, decide its produce-kind
(passthrough / reencode / ocrText) explicitly. Never route a non-single-image payload
into the image re-encoder.

**Web mirror (pdf-convert-master):** `src/lib/downloadFormats.ts` +
`src/components/DownloadFormatModal.tsx` port this same chooser to the web hero flow
(HeroToolConverter only — multi-file ConversionWorkflow batch download is unchanged).
Same produce-kinds: passthrough (fetchFileBlob+downloadBlob so the EDITED filename wins
over the server Content-Disposition), reencode (canvas), ocrText (fetch /api/ocr-text/:jobId).
**Web is stricter than mobile on the OCR fallback:** if recognized text is gone at confirm
time, THROW ("recognized text isn't available… download the PDF instead") — never
downloadFromUrl under the selected .doc/.txt name (that saves PDF bytes with a lying
extension). Output extension/default name comes from `job.outputFilename`; fall back to a
`fileNameRef` (NOT the closure-stale `fileName` state) since pollJob captures an old render.
