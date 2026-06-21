/**
 * Shared element model for the unified mobile PDF editor.
 *
 * Every placed item is stored as fractions of the page (top-left origin) so the
 * on-screen overlay maps 1:1 onto the generated PDF. The same union is consumed
 * by the editor UI (preview overlays) and by `pdfBuilder` (real pdf-lib output),
 * so there is a single source of truth for what an edit means.
 */

/** Position + width as page fractions (0..1), top-left origin. */
export interface Placement {
  x: number;
  y: number;
  w: number;
}

/** A rectangle as page fractions (0..1), top-left origin. */
export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** PDF standard font families available on every platform (no fontkit). */
export type FontKey = "helvetica" | "times" | "courier";

export type RotateDeg = 0 | 90 | 180 | 270;

/**
 * One page in the (possibly re-arranged) document. `src` is the source page
 * index, or null for an inserted blank page. `key` is a stable identity so
 * reordering/duplicating pages never desyncs the elements placed on them.
 */
export interface PageSlot {
  key: string;
  src: number | null;
  rotate: RotateDeg;
}

interface ElBase {
  id: string;
  /** Stable key of the page slot this element belongs to. */
  slot: string;
}

export interface TextEl extends ElBase {
  kind: "text";
  x: number;
  y: number;
  text: string;
  size: number;
  color: string;
  font: FontKey;
  bold: boolean;
  italic: boolean;
}

export interface ImageEl extends ElBase {
  kind: "image";
  x: number;
  y: number;
  w: number;
  /** height / width of the source image. */
  aspect: number;
  uri: string;
}

export interface SignEl extends ElBase {
  kind: "sign";
  x: number;
  y: number;
  w: number;
  aspect: number;
  mode: "type" | "draw";
  name?: string;
  /** Font family used only for the on-screen preview of a typed signature. */
  signFont?: string;
  /** Drawn signature: SVG path strings in pad-pixel space. */
  paths?: string[];
  padW?: number;
  padH?: number;
}

export interface StampEl extends ElBase {
  kind: "stamp";
  x: number;
  y: number;
  w: number;
  aspect: number;
  label: string;
  color: string;
}

export interface ShapeEl extends ElBase {
  kind: "rect" | "ellipse";
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
  fill: boolean;
  strokeWidth: number;
}

export interface MarkEl extends ElBase {
  kind: "highlight" | "whiteout";
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
}

export interface LineEl extends ElBase {
  kind: "line" | "arrow";
  /** Start point (top-left of bounding box). */
  x: number;
  y: number;
  /** Box width/height — the line runs from (x,y) to (x+w, y+h). */
  w: number;
  h: number;
  color: string;
  strokeWidth: number;
}

export interface DrawEl extends ElBase {
  kind: "draw";
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
  strokeWidth: number;
  /** SVG path strings captured in pad-pixel space. */
  paths: string[];
  padW: number;
  padH: number;
}

export type EditElement =
  | TextEl
  | ImageEl
  | SignEl
  | StampEl
  | ShapeEl
  | MarkEl
  | LineEl
  | DrawEl;

export type ElementKind = EditElement["kind"];

/** Tools shown in the editor toolbar (a superset of element kinds). */
export type ToolId =
  | "select"
  | "text"
  | "image"
  | "sign"
  | "stamp"
  | "highlight"
  | "whiteout"
  | "rect"
  | "ellipse"
  | "line"
  | "arrow"
  | "draw"
  | "watermark"
  | "crop"
  | "pages";

/** Kinds whose overlay keeps a locked aspect ratio (resize drives width only). */
export const ASPECT_LOCKED: ReadonlySet<ElementKind> = new Set<ElementKind>([
  "image",
  "sign",
  "stamp",
]);

let seq = 0;
/** Monotonic, collision-free id for a new element/slot. */
export function uid(prefix = "el"): string {
  seq += 1;
  return `${prefix}_${Date.now().toString(36)}_${seq}`;
}
