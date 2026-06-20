---
name: Nested PanResponder steal (RN/Expo web)
description: Why a child resize/handle gesture only "moves" instead of resizing when nested inside a draggable parent, and the fix.
---

# Nested PanResponder gesture steal

When a small handle (e.g. a corner resize grip) has its own `PanResponder` and lives
INSIDE a parent View that also has a move `PanResponder`, the parent can steal the
gesture mid-drag. Symptom: the handle "only moves the box, never resizes" — the user
can drag but the resize never fires (seen on Expo web especially).

**Why:** the parent's `onMoveShouldSetPanResponder` is consulted on each move; if it
returns true the system asks the current responder (the child) to terminate, and the
default `onPanResponderTerminationRequest` is `true`, so the child yields and the
parent's move handler runs instead.

**How to apply:** on the CHILD (handle) responder set:
- `onStartShouldSetPanResponderCapture: () => true`
- `onMoveShouldSetPanResponderCapture: () => true`
- `onPanResponderTerminationRequest: () => false`
Also give the handle a generous `hitSlop` since corner grips are tiny. This keeps the
resize gesture pinned to the handle. Pattern lives in the pdf-convert-mobile editor's
`DraggableBox`/`CropBox`.

## Parent ScrollView also scrolls during drag (page "moves", box flies "very fast")

The SAME class of bug, one level up: when ANY draggable overlay (crop box, watermark,
signature, add-image, text, signature-pad strokes) lives inside `ScreenScroll` (a
ScrollView), dragging it also scrolls the page. The scroll + drag compound, so the box
appears to move much faster than the finger. The `move`/draw responders had no capture
handlers (only `resize` did), so the ScrollView stole vertical drags.

**Fix is two-pronged — do BOTH:**
1. Apply the capture + `onPanResponderTerminationRequest:()=>false` guards to the
   `move`/`DragMove`/draw responders too (not just `resize`).
2. Freeze the parent ScrollView for the duration of the drag: each box takes an
   `onInteract(active)` callback fired on grant(`true`) and on BOTH release AND
   terminate(`false`); the screen holds an `interacting` state and passes
   `scrollEnabled={!interacting}` to `ScreenScroll`. `ScreenScroll` already forwards
   `...rest` to the underlying `ScrollView`, so `scrollEnabled` just works.
   **Why both:** capture handlers stop RN responder-steal (native); `scrollEnabled`
   off also kills browser/`touch-action` scroll on Expo web. Capture alone isn't
   enough on web.
**Always reset `interacting` on release AND terminate** or the page scroll stays
permanently frozen. Use refs (`iRef.current = onInteract`) to avoid stale closures.
