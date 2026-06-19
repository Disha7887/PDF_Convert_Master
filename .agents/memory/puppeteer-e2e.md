---
name: Puppeteer e2e in this Repl
description: How to run headless browser e2e tests here (no bundled Chromium) and a selector caveat for PdfEditor.
---

# Running Puppeteer / headless-browser e2e in this Replit environment

The `puppeteer` npm package here does NOT ship/download its own Chromium. You must
launch with an explicit `executablePath` pointing at the system ungoogled-chromium
from the nix store, plus the sandbox-off flags:

```js
puppeteer.launch({
  executablePath: "<nix-store chromium>/bin/chromium",
  headless: "new",
  args: ["--no-sandbox", "--disable-setuid-sandbox"],
});
```

**Find the path at runtime** (do NOT hardcode the hash — the nix-store path changes
across rebuilds/version bumps): `which chromium` or
`ls /nix/store/*chromium*/bin/chromium`.

**Why:** without `executablePath` Puppeteer errors with "Could not find Chromium";
without `--no-sandbox` it fails to start in this container.

**How to apply:** any time you write a throwaway `.mjs` e2e against the running app
(`http://localhost:5000`). Drive uploads via the hidden file input (`uploadFile`),
poll for completion by waiting on a stable `data-testid`, and clean up the temp
script after.

## Selector caveat: prefer data-testid over alt/role for the PDF editor canvas

`PdfEditor.tsx` (`/upload/edit-pdf`) renders the page image TWICE with the same
`alt="Page N"`: once as a small **sidebar thumbnail**, once as the **main editing
canvas**. `page.$("img[alt^='Page']")` grabs the thumbnail (first in DOM), so
clicks land on the wrong element and shape/polygon tools silently add nothing.
Target the main canvas container by its test id instead (`[data-testid="page-0"]`)
and compute click coords from its bounding box.

**Why:** a "feature is broken" e2e failure here was actually the test clicking the
thumbnail, not a product bug — cost an extra debug cycle to discover.
**How to apply:** for any multi-render component, anchor interactions on a unique
`data-testid`, never on a shared `alt`/`role` that may appear in a nav/thumbnail too.
