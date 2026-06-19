# Memory Index

- [Puppeteer e2e in this Repl](puppeteer-e2e.md) — launch with explicit nix-store chromium executablePath + --no-sandbox; for PdfEditor target `data-testid="page-N"` not the shared `alt="Page N"` (a thumbnail dupes it).
- [PdfEditor element model & text editing](pdf-editor.md) — render order == array order (covers before texts); "Edit text" = one-shot whole-page convert deduped by position; inline edit = contentEditable via 2nd-pointerdown double-tap + MUST preventDefault to beat focus-theft; loadImageElement no cache → batch sampling.
