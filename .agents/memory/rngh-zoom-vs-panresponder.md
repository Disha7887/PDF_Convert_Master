---
name: RNGH pinch/pan zoom coexisting with JS PanResponders
description: How to add react-native-gesture-handler pinch/pan zoom over a view that is full of JS PanResponders (drag/draw/resize) without the two systems stealing each other's gestures.
---

# RNGH zoom over JS PanResponders

When a view uses RNGH `Gesture.Pinch`/`Gesture.Pan` (2-finger zoom/pan) AND is
also covered by classic JS `PanResponder`s for drawing/placing/dragging/resizing
elements, the two gesture systems fight: a pinch starts as one finger, so a JS
PanResponder can claim it first and either block the native pinch or commit a
stray edit.

**Rule:** make every JS PanResponder single-finger-only and yield to RNGH.

- Gate responder negotiation on a single finger. Add a helper
  `oneFinger(e) = e.nativeEvent.touches.length < 2` and use it for
  `onStartShouldSetPanResponder`, `onStartShouldSetPanResponderCapture`,
  `onMoveShouldSetPanResponder`, AND `onMoveShouldSetPanResponderCapture`. The
  move-capture variants matter: gating only start is NOT enough — a 2-finger
  gesture that begins on/near a handle can still be claimed on the first *move*.
- In `onPanResponderMove`, bail when a 2nd finger joins
  (`isPinching(g) = g.numberActiveTouches > 1`). For commit-style responders
  (draw stroke / shape placement) set a `multi` ref, discard the in-progress
  edit, and clear any live preview.
- In `onPanResponderRelease`, skip the commit / tap-select when the `multi` flag
  is set; reset the flag in release + terminate.
- `onPanResponderTerminationRequest`: return `true` for capture layers and
  element *move* responders so RNGH can take over. KEEP it `false` only for
  nested *resize-handle* responders (the documented "nested-panresponder-steal"
  fix is a JS-vs-JS guard). That termination=false is safe ONLY because the
  resize move-capture is now also gated on `oneFinger`, so resize never claims a
  gesture that began as 2-finger. Tradeoff: a resize that *starts* one-finger on
  the handle won't hand off to zoom until release — acceptable rare edge.

**Scale-aware deltas:** while zoomed, every JS PanResponder drag/resize must
divide screen-space deltas by `containerDim * scale` (mirror the live RNGH scale
into a plain `scaleRef`/`zoomScaleRef`, default 1). `scrollEnabled` must be off
while `interacting || zoomed`.

**Gesture lifecycle:** use RNGH `.onFinalize` (not just `.onEnd`) on pinch/pan so
`interacting` always clears and the scale ref re-syncs even when a gesture is
cancelled/interrupted.

**Why:** verified via two architect review rounds — first FAIL was JS responders
stealing the pinch; second FAIL was unconditional resize move-capture; PASS only
after all four shouldSet variants (incl. both capture) were gated on oneFinger.
