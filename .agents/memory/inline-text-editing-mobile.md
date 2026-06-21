---
name: Inline on-page text editing (mobile editor)
description: How the pdf-convert-mobile editor lets users tap a text block and type directly on the PDF page with a blinking caret, instead of editing in the bottom panel.
---

When a text element is selected in the Expo PDF editor it renders an auto-focused
`TextInput` *in place on the page* (a blinking caret at the tapped text), not just
the bottom-panel field. Several non-obvious constraints make this work cross-platform
(the editor is web-first but must also run native):

- **Drag wrapper steals child focus.** A text element lives inside a draggable
  `DragMove` whose PanResponder claims the gesture on touch *start*, so a child
  `TextInput` never receives the tap and can't focus. Fix: give `DragMove` an
  `editing` mode where `onStart*ShouldSetPanResponder` return `false` (tap falls
  through to the input → caret) and `onMove*ShouldSetPanResponder` claim only after
  the finger drags past a small threshold (~8px) so drag-to-move still works. Read
  `editing` via a ref so the memoised PanResponder stays current without recreation.
  **Why:** see also `nested-panresponder-steal.md` — same class of capture problem.

- **`user-select: none` inherits into the web `<input>`.** The draggable wrapper
  sets `user-select: none` (needed so mouse-drag doesn't start a text selection that
  hijacks the pan). On web that inherits into the inline input and blocks caret /
  letter selection. Fix: re-apply `user-select: text` on the inline `TextInput`
  (cast to `TextStyle`, not `ViewStyle`, or tsc rejects it).

- **Single-line TextInput won't auto-grow on web.** RN-web maps a single-line
  `TextInput` to a fixed-width `<input>`. To make it grow as the user types, drive
  its width from a hidden, absolutely-positioned, `opacity:0` measuring `<Text>`
  (same typography) via `onLayout`; `width = max(min, measuredW + caretPad)`.
  Don't estimate from glyph metrics — drifts badly for fallback fonts.

- **Undo per edit-session, not per keystroke.** Snapshot history once per session
  (a `textEditSnapped` ref guard, reset on focus/blur), then update live via
  `elementsRef.current = next; setElements(next)` with **no** `commit`. Setting the
  ref synchronously matters: a later panel commit (font/size/color) reads
  `elementsRef.current` and would otherwise clobber the freshly typed text.

- **Preview-only width; never persist it.** Export/rasterization rely on
  `el.x/el.y` (page fractions) + `el.size` (points). The inline width is layout-only;
  do NOT add a width field to `TextEl` or export geometry breaks.
