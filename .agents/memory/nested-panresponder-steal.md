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
