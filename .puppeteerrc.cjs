// Puppeteer configuration (picked up at install time AND at runtime).
//
// Why: on Railway the default cache (~/.cache/puppeteer) written during
// `pnpm install` does not survive into the runtime image, so Word-to-PDF
// (and every Puppeteer-backed tool) failed with "Could not find Chrome".
// Pointing the cache inside the repo (/app on Railway) keeps the browser
// downloaded at build time available at runtime. api-server's build.mjs
// additionally ensures Chrome is installed when no system Chromium exists.
const { join } = require("path");

module.exports = {
  cacheDirectory: join(__dirname, ".puppeteer-cache"),
};
