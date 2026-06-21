---
name: Resize-handle touch bounds (mobile editor)
description: Why corner resize handles on PDF-editor overlays must live inside a touchable ancestor, and how draw-mode scroll is gated.
---

# Resize handle must sit inside parent bounds (native)

On React Native, a touch that lands **outside a parent view's bounds never reaches that parent's children** — there is no overflow-touch capture like web. A corner resize handle positioned with negative offsets (e.g. `right:-11, bottom:-11`, straddling the box edge) is therefore largely untouchable on native, worst on thin boxes (e.g. a highlight ~4.5% page height). Symptom: overlay can be *moved* (body responder works) but *not resized*.

**Fix pattern (FreeBox / DraggableBox):** wrap the overlay in an outer `pointerEvents="box-none"` container sized `box + HANDLE_OVERFLOW` (22px) on right/bottom. Keep the move PanResponder on the inner box; make the resize handle a **sibling** of the inner box (not a child) positioned at `{left: boxW-12, top: boxH-12}` so it lands fully inside the touchable wrapper. Override the shared `styles.resizeHandle` `right/bottom` to `undefined` when setting `left/top`.

**Why sibling + render-after:** the handle overlaps the box corner; rendered after the inner box it sits on top and, with capture handlers (`onStartShouldSetPanResponderCapture` + `onPanResponderTerminationRequest:()=>false`), wins the corner over the parent move responder. `box-none` padding passes taps through to the page / lower overlays, so adjacent elements aren't blocked.

**How to apply:** any resizable overlay using `styles.resizeHandle` with negative offsets has this latent bug (CropBox/Watermark still do — fix if they regress). Keep zoom correctness: move/resize deltas divide by `container.dim * scaleRef.current`.

# Draw mode must hard-disable page scroll

Gating page `scrollEnabled` only on `!interacting` is racy — the parent ScrollView can start scrolling before the draw/place responder's `onPanResponderGrant` flips `interacting`. Gate on the active tool instead: `scrollEnabled={editingText || (!captureActive && !interacting && !zoomed)}` where `captureActive = CAPTURE_TOOLS.has(activeTool)` (draw/text/shapes/highlight/whiteout). `editingText` still overrides to re-enable scroll for keyboard avoidance during inline text edit. Signature pad drawing relies on its `onInteract={setInteracting}`.
