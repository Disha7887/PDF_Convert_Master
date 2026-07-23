---
name: Puppeteer Chrome in prod (Railway)
description: How Word-to-PDF's headless Chrome is made available in production, and the async executablePath gotcha.
---

Rule: production (Railway) has no system Chromium and Puppeteer's default install cache (~/.cache/puppeteer) doesn't survive into the runtime image. Chrome is kept in a repo-local cache via root `.puppeteerrc.cjs` (`cacheDirectory: <repo>/.puppeteer-cache`, gitignored), and api-server's build step installs it (`pnpm exec puppeteer browsers install chrome`) only when `which chromium` fails — so dev (Nix chromium) never downloads.

**Why:** prod Word-to-PDF failed with "Could not find Chrome"; pnpm's side-effects cache can also skip puppeteer's postinstall download, so an explicit build-time check is needed.

**How to apply:** runtime resolution order is PUPPETEER_EXECUTABLE_PATH → `which chromium` → `await puppeteer.executablePath()` + existsSync. NOTE: `puppeteer.executablePath()` is **async** in the pinned version — forgetting `await` silently yields a Promise (truthy, breaks launch). Don't remove `.puppeteerrc.cjs` or the build.mjs ensure step.

Related: user-influenced download filenames must go through the shared `contentDisposition()` helper in api-server routes (ASCII fallback + RFC 5987 `filename*`), never raw-interpolated — non-ASCII names crash setHeader with ERR_INVALID_CHAR.
