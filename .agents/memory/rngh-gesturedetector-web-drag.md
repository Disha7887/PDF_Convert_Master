---
name: RNGH GestureDetector blocks PanResponder drag on Expo web
description: Why overlay drag/select silently breaks on the Expo web build when page content is wrapped in an RNGH GestureDetector, and the web-conditional fix.
---

# RNGH GestureDetector swallows single-pointer events on react-native-web

In the mobile PDF editor, page content (page image + capture layer + element
overlays) is wrapped in an RNGH `<GestureDetector gesture={zoomGesture}>` for
2-finger pinch + 2-finger pan zoom. On **react-native-web** this GestureDetector
intercepts single-pointer (mouse) events before react-native-web's responder
system can hand them to the child JS `PanResponder`s. Result: overlays cannot be
moved, resized, OR even tap-selected on the web build — and the page doesn't pan
either (RNGH pan is `minPointers(2)`), so a single mouse drag is swallowed by
nothing useful. Native is unaffected (RNGH + PanResponder genuinely coexist).

**Rule:** do NOT wrap PanResponder-driven editor content in an RNGH
GestureDetector on web. Use a `ZoomViewport` wrapper that renders the inner
`View`/`Animated.View` directly when `Platform.OS === "web"` and only wraps in
`GestureDetector` on native. Pinch/2-finger zoom is unreachable with a mouse on
web, so dropping it there costs nothing real and restores drag/select.

**Why:** verified by e2e on the real Expo domain — before: signature stuck at the
same pixel (no move, no select); after: tap shows selection ring + resize handle
and drag follows the cursor. Architect PASS.

**How to apply:**
- Test the EXPO app at `$REPLIT_EXPO_DEV_DOMAIN` (full URL). `runTest` with
  path `/` hits the **web** app (pdf-convert-master, previewPath `/`), NOT the
  Expo mobile app — the Expo app bypasses the proxy. `placement-box` testID =
  web app's PdfPlacementCanvas; the mobile editor uses DraggableBox/DragMove.
- Tap-to-select is a good proxy: it uses the SAME element PanResponder as drag,
  so if events are blocked, selection fails too.
- Keep `zoomAnimStyle` applied in both paths (identity on web); `scrollEnabled`
  logic still works because `zoomed` just stays false on web.
- Tradeoff: web loses RNGH pinch zoom entirely (incl. touch-web). Acceptable for
  a mobile app previewed on web; revisit only if touch-web zoom becomes a
  product requirement.
