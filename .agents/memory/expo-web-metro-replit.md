---
name: Expo web + Metro on Replit
description: Non-obvious quirks when running an Expo artifact's web bundle in the Replit workspace (Metro cache, lazy bundling, log staleness, lottie web peer, asset exts).
---

# Expo web + Metro on Replit

## Metro cache is not busted by a plain workflow restart
`restart_workflow "<expo workflow>"` restarts the process but does NOT clear Metro's
persistent caches at `/tmp/metro-cache` and `/tmp/metro-file-map-*`. After changes that
affect module resolution (metro.config.js, added/removed deps, asset requires), the old
resolution/error can persist. Fix: `rm -rf /tmp/metro-cache /tmp/metro-file-map-*` then restart.

**Why:** a stale `.txt` asset-resolution failure survived several config edits + restarts until
the cache dirs were deleted; only then did the corrected source bundle.

## Metro bundles lazily — workflow logs can show STALE errors
The web bundle is built on first request, not on start. The workflow log file may keep showing
a pre-edit bundling error (old line numbers/source) until a fresh request triggers a rebundle.
Trust a freshly-triggered bundle, not the last log line.

## Verify the bundle on the Expo dev domain, not localhost:80
`localhost:80` (the shared proxy) returns an HTML/Vite wrapper for the expo artifact, so curling
`entry.bundle` there is misleading (200 + HTML). Hit `https://$REPLIT_EXPO_DEV_DOMAIN/...entry.bundle?...`
directly to see Metro's real status (e.g. 500 + JSON `UnableToResolveError`).
**How to apply:** when a screenshot shows blank white + a 500 on `entry.bundle`, fetch the exact
browser bundle URL on `$REPLIT_EXPO_DEV_DOMAIN` to read the real error body.

## lottie-react-native@7 web build needs an optional peer
Its `index.web.js` imports `@lottiefiles/dotlottie-react` (optional peerDep). Without it the web
bundle fails to resolve. Install `@lottiefiles/dotlottie-react` into the Expo artifact for web.

## Do not require() non-default asset extensions in Metro
`require("...x.txt")` breaks the bundle — `.txt` isn't in Metro's default `assetExts`. Generate such
content at runtime (expo-file-system) instead of bundling it. PDF/PNG resolve fine by default.
Bundled samples that ARE wanted can be loaded via `expo-asset` (`Asset.fromModule(require(...))`,
`downloadAsync()`, then `localUri ?? uri`).
