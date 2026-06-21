---
name: Capture layer blocks editing existing annotations
description: Why highlight/whiteout (capture tools) couldn't be moved/resized in the mobile PDF editor, and the render-order rule that fixes it.
---

# Capture tools vs. always-interactive overlays (mobile PDF editor)

In `app/editor/pdf.tsx`, tools split into two interaction models:

- **Always-interactive document overlays** (Watermark, Crop): rendered conditionally, on
  their own, always interactive → editable while their tool is selected.
- **Capture tools** (highlight, whiteout, rect, ellipse, line, arrow, draw): a full-page
  capture layer catches touches to *draw/place* new shapes via PanResponder.

## The rule

A capture layer that catches page touches must render **BELOW** the element overlays, and
element overlays must stay **interactive even when a capture tool is active**. Otherwise the
on-top capture layer (absoluteFill) eats every touch and existing annotations can't be
selected/moved/resized while their tool stays selected — even though their gesture machinery
is fine.

**Why:** highlight/whiteout drag/resize "didn't work" not because of a gesture bug
(`DraggableBox` and `FreeBox` move/resize PanResponders are byte-identical, and box-none
wrapper + handle work — proven by Watermark using `DraggableBox` successfully). The capture
layer was on top + `interactive={!captureActive}` disabled the elements.

**How to apply:** order = capture layer first (below), element overlays after (on top). With
RN responder negotiation, touches on an element target the element (siblings/capture layer are
not ancestors, so their capture-phase handlers don't fire); empty-area touches fall through the
box-none element wrappers to the capture layer below → still draw new shapes. Tapping an
existing element fires its `onSelect`, which also switches `activeTool` back to "select".

## Image was a red herring

Image shares the exact same `DraggableBox` branch as Stamp (which works) and is auto-selected
via `addElement` → `setSelectedId`. There is no structural code difference; image is not a
capture tool, so the capture-layer fix doesn't touch it. If image still misbehaves on device,
suspect a stale Expo bundle or report imprecision, not the editor code.
