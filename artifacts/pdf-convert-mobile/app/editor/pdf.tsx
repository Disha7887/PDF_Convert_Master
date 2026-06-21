import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Sharing from "expo-sharing";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Image,
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type ViewStyle,
} from "react-native";
import Svg, { Ellipse, Line, Path, Polygon, Rect } from "react-native-svg";

import ConverterStatusIcon from "@/components/ConverterStatusIcon";
import { Loader } from "@/components/Loader";
import SignaturePad, { type SignatureData } from "@/components/SignaturePad";
import { Button, Card, Chip, ScreenScroll } from "@/components/ui";
import colors from "@/constants/colors";
import { addHistory } from "@/constants/history";
import { ROUTES } from "@/constants/routes";
import { fonts } from "@/constants/theme";
import { getToolById } from "@/constants/tools";
import { buildEditedPdf } from "@/services/pdfBuilder";
import { getPdfPageCount, getPdfPageSize } from "@/services/pdfDoc";
import {
  uid,
  type EditElement,
  type ElementKind,
  type FontKey,
  type PageSlot,
  type Placement,
  type Rect as FRect,
  type RotateDeg,
  type ToolId,
} from "@/services/pdfEditTypes";
import { renderPdfPage } from "@/services/pdfRender";

const C = colors.light;
type FeatherName = keyof typeof Feather.glyphMap;

/** Pages to synthesise only when the editor is opened without a source file. */
const PAGE_COUNT = 4;

// On web the browser locks in `touch-action` at touchstart, so toggling
// `scrollEnabled` mid-gesture can't stop a scroll that already began. Setting
// `touch-action: none` statically on the draggable elements stops the browser
// from ever starting a page scroll from a touch that begins on them.
const WEB_NO_TOUCH_SCROLL =
  Platform.OS === "web" ? ({ touchAction: "none" } as unknown as ViewStyle) : null;

/** Render + cache a real page image. Returns null while loading or on native. */
function useRenderedPage(
  uri: string | undefined,
  pageIndex: number,
  width: number,
): string | null {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    setUrl(null);
    if (!uri || pageIndex < 0) return;
    renderPdfPage(uri, pageIndex, width)
      .then((u) => alive && setUrl(u))
      .catch(() => alive && setUrl(null));
    return () => {
      alive = false;
    };
  }, [uri, pageIndex, width]);
  return url;
}

// ── Palettes & presets ──────────────────────────────────────────────────────
const INK_COLORS = ["#1c2434", "#f7433d", "#ef4444", "#22c55e", "#f59e0b", "#2563eb"];
const HIGHLIGHT_COLORS = ["#fde047", "#86efac", "#f9a8d4", "#93c5fd"];
const STAMP_COLORS = ["#ef4444", "#22c55e", "#2563eb", "#6b7280"];
const STAMP_PRESETS = ["APPROVED", "CONFIDENTIAL", "DRAFT", "REVIEWED", "URGENT", "PAID"];
const FONT_SIZES = [12, 16, 20, 28, 40];
const STROKE_WIDTHS = [1, 2, 4, 6];
const WM_OPACITY: { label: string; value: number }[] = [
  { label: "Light", value: 0.12 },
  { label: "Medium", value: 0.22 },
  { label: "Strong", value: 0.38 },
];
const FONT_FAMILIES: { key: FontKey; label: string }[] = [
  { key: "helvetica", label: "Sans" },
  { key: "times", label: "Serif" },
  { key: "courier", label: "Mono" },
];
const SIGN_FONTS: { label: string; family: string }[] = [
  { label: "Classic", family: fonts.heading },
  { label: "Modern", family: fonts.headingSemibold },
  { label: "Bold", family: fonts.headingBold },
];
/** On-screen approximation of each export font family (export uses real fonts). */
const PREVIEW_FONT: Record<FontKey, string> = {
  helvetica: fonts.body,
  times: Platform.select({ ios: "Georgia", android: "serif", default: "serif" }) as string,
  courier: Platform.select({ ios: "Courier New", android: "monospace", default: "monospace" }) as string,
};

/** Toolbar entries — a unified superset of the web editor's tools. */
const TOOLBAR: { id: ToolId; icon: FeatherName; label: string }[] = [
  { id: "select", icon: "navigation", label: "Select" },
  { id: "text", icon: "type", label: "Text" },
  { id: "draw", icon: "edit-2", label: "Draw" },
  { id: "highlight", icon: "pen-tool", label: "Highlight" },
  { id: "whiteout", icon: "delete", label: "Whiteout" },
  { id: "rect", icon: "square", label: "Rectangle" },
  { id: "ellipse", icon: "circle", label: "Ellipse" },
  { id: "line", icon: "minus", label: "Line" },
  { id: "arrow", icon: "arrow-up-right", label: "Arrow" },
  { id: "image", icon: "image", label: "Image" },
  { id: "sign", icon: "edit-3", label: "Sign" },
  { id: "stamp", icon: "award", label: "Stamp" },
  { id: "watermark", icon: "droplet", label: "Watermark" },
  { id: "crop", icon: "crop", label: "Crop" },
  { id: "pages", icon: "layers", label: "Pages" },
];

/** Tools that capture taps/drags directly on the page to create elements. */
const CAPTURE_TOOLS: ReadonlySet<ToolId> = new Set<ToolId>([
  "rect",
  "ellipse",
  "line",
  "arrow",
  "highlight",
  "whiteout",
  "draw",
]);

/** Maps the launching tool's editorMode to the initial active editor tool. */
function initialToolFor(mode: string): ToolId {
  switch (mode) {
    case "crop":
      return "crop";
    case "sign":
      return "sign";
    case "watermark":
      return "watermark";
    case "add-image":
      return "image";
    case "delete-pages":
      return "pages";
    default:
      return "text";
  }
}

function clampFrac(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function stripExt(name: string): string {
  return name.replace(/\.[^./]+$/, "") || "document";
}

/**
 * Saves/shares the output. On web there is no native share sheet, so we trigger
 * a real file download via an anchor element; on native we open the share sheet.
 */
async function shareFile(uri: string, name: string): Promise<boolean> {
  if (Platform.OS === "web") {
    const a = document.createElement("a");
    a.href = uri;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    return true;
  }
  if (!(await Sharing.isAvailableAsync())) return false;
  await Sharing.shareAsync(uri);
  return true;
}

export default function PdfEditorScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ toolId?: string; uri?: string; name?: string }>();
  const tool = getToolById(params.toolId);
  const launchMode = tool?.editorMode ?? "edit";
  const fileName = params.name ?? "document.pdf";

  // ── Document / pages ──────────────────────────────────────────────────────
  const [srcCount, setSrcCount] = useState<number | null>(params.uri ? null : PAGE_COUNT);
  const [docError, setDocError] = useState<string | null>(null);
  const [order, setOrder] = useState<PageSlot[] | null>(null);
  const [cur, setCur] = useState(0);
  const [pageAspect, setPageAspect] = useState(1.414);
  const [pageBox, setPageBox] = useState({ width: 0, height: 0 });

  // ── Editor state ──────────────────────────────────────────────────────────
  const [activeTool, setActiveTool] = useState<ToolId>(initialToolFor(launchMode));
  const [elements, setElements] = useState<EditElement[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [past, setPast] = useState<EditElement[][]>([]);
  const [future, setFuture] = useState<EditElement[][]>([]);
  const [interacting, setInteracting] = useState(false);

  const elementsRef = useRef(elements);
  elementsRef.current = elements;
  const orderRef = useRef(order);
  orderRef.current = order;

  // ── Draft tool properties ─────────────────────────────────────────────────
  const [textValue, setTextValue] = useState("");
  const [draftSize, setDraftSize] = useState(16);
  const [draftColor, setDraftColor] = useState(INK_COLORS[0]);
  const [draftFont, setDraftFont] = useState<FontKey>("helvetica");
  const [draftBold, setDraftBold] = useState(false);
  const [draftItalic, setDraftItalic] = useState(false);
  const [draftStroke, setDraftStroke] = useState(2);
  const [draftFill, setDraftFill] = useState(false);
  const [draftHighlight, setDraftHighlight] = useState(HIGHLIGHT_COLORS[0]);
  const [draftStampLabel, setDraftStampLabel] = useState(STAMP_PRESETS[0]);
  const [draftStampColor, setDraftStampColor] = useState(STAMP_COLORS[0]);

  // sign
  const [signMode, setSignMode] = useState<"type" | "draw">("type");
  const [signName, setSignName] = useState("");
  const [signFontFam, setSignFontFam] = useState(SIGN_FONTS[0].family);
  const [signDraw, setSignDraw] = useState<SignatureData | null>(null);

  // document-level: watermark + crop
  const [wmEnabled, setWmEnabled] = useState(launchMode === "watermark");
  const [wmText, setWmText] = useState("CONFIDENTIAL");
  const [wmOpacity, setWmOpacity] = useState(0.22);
  const [wmPos, setWmPos] = useState<Placement>({ x: 0.15, y: 0.42, w: 0.7 });
  const [cropEnabled, setCropEnabled] = useState(launchMode === "crop");
  const [cropRect, setCropRect] = useState<FRect>({ x: 0.08, y: 0.08, w: 0.84, h: 0.84 });

  // freehand draw live stroke
  const [liveStroke, setLiveStroke] = useState("");

  const [saved, setSaved] = useState<{ uri: string; name: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Refs for gesture callbacks (avoid stale closures in PanResponders).
  const pageBoxRef = useRef(pageBox);
  pageBoxRef.current = pageBox;

  // ── Load real page count ──────────────────────────────────────────────────
  useEffect(() => {
    let alive = true;
    if (!params.uri) {
      setSrcCount(PAGE_COUNT);
      return;
    }
    setSrcCount(null);
    setDocError(null);
    getPdfPageCount(params.uri)
      .then((n) => alive && setSrcCount(Math.max(1, n)))
      .catch(() => {
        if (!alive) return;
        setSrcCount(null);
        setDocError("Could not read this PDF — it may be corrupted or password-protected.");
      });
    return () => {
      alive = false;
    };
  }, [params.uri]);

  // Build the initial page order once the real count is known.
  useEffect(() => {
    if (srcCount != null && order == null) {
      setOrder(
        Array.from({ length: srcCount }, (_, i) => ({
          key: `s_${i}`,
          src: i,
          rotate: 0 as RotateDeg,
        })),
      );
    }
  }, [srcCount, order]);

  // Keep the active page index in range as the order changes.
  useEffect(() => {
    if (order && cur > order.length - 1) setCur(Math.max(0, order.length - 1));
  }, [order, cur]);

  const slot = order?.[cur] ?? null;
  const currentSrc = slot?.src ?? -1;
  const slotKey = slot?.key ?? "";

  // Match the preview box to the real page aspect ratio for accurate placement.
  useEffect(() => {
    let alive = true;
    if (!params.uri || currentSrc < 0) {
      setPageAspect(1.414);
      return;
    }
    getPdfPageSize(params.uri, currentSrc)
      .then((s) => {
        if (alive && s.width > 0 && s.height > 0) setPageAspect(s.height / s.width);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [params.uri, currentSrc]);

  const pageImage = useRenderedPage(params.uri, currentSrc, 620);

  // ── History helpers ───────────────────────────────────────────────────────
  const pushHistory = useCallback(() => {
    setPast((p) => [...p, elementsRef.current].slice(-80));
    setFuture([]);
  }, []);

  const commit = useCallback(
    (next: EditElement[]) => {
      pushHistory();
      setElements(next);
    },
    [pushHistory],
  );

  const undo = useCallback(() => {
    setPast((p) => {
      if (!p.length) return p;
      const prev = p[p.length - 1];
      setFuture((f) => [elementsRef.current, ...f].slice(0, 80));
      setElements(prev);
      setSelectedId(null);
      return p.slice(0, -1);
    });
  }, []);

  const redo = useCallback(() => {
    setFuture((f) => {
      if (!f.length) return f;
      const next = f[0];
      setPast((p) => [...p, elementsRef.current].slice(-80));
      setElements(next);
      setSelectedId(null);
      return f.slice(1);
    });
  }, []);

  // Drag lifecycle: snapshot history only when an actual move begins.
  const dragSnapped = useRef(false);
  const beginDrag = useCallback(() => {
    dragSnapped.current = false;
    setInteracting(true);
  }, []);
  const endDrag = useCallback(() => setInteracting(false), []);
  const dragGeom = useCallback(
    (id: string, partial: Partial<EditElement>) => {
      if (!dragSnapped.current) {
        pushHistory();
        dragSnapped.current = true;
      }
      setElements((prev) =>
        prev.map((e) => (e.id === id ? ({ ...e, ...partial } as EditElement) : e)),
      );
    },
    [pushHistory],
  );

  const updateProp = useCallback(
    (id: string, partial: Partial<EditElement>) => {
      commit(
        elementsRef.current.map((e) =>
          e.id === id ? ({ ...e, ...partial } as EditElement) : e,
        ),
      );
    },
    [commit],
  );

  const addElement = useCallback(
    (el: EditElement) => {
      commit([...elementsRef.current, el]);
      setSelectedId(el.id);
    },
    [commit],
  );

  const removeSelected = useCallback(() => {
    if (!selectedId) return;
    commit(elementsRef.current.filter((e) => e.id !== selectedId));
    setSelectedId(null);
  }, [commit, selectedId]);

  const duplicateSelected = useCallback(() => {
    const el = elementsRef.current.find((e) => e.id === selectedId);
    if (!el) return;
    const copy = {
      ...el,
      id: uid(),
      x: clampFrac(el.x + 0.03, 0, 0.95),
      y: clampFrac(el.y + 0.03, 0, 0.95),
    } as EditElement;
    addElement(copy);
  }, [selectedId, addElement]);

  // ── Element creation ──────────────────────────────────────────────────────
  const addText = useCallback(() => {
    const t = textValue.trim();
    if (!t || !slotKey) return;
    const onPage = elementsRef.current.filter(
      (e) => e.slot === slotKey && e.kind === "text",
    ).length;
    addElement({
      id: uid(),
      slot: slotKey,
      kind: "text",
      text: t,
      size: draftSize,
      color: draftColor,
      font: draftFont,
      bold: draftBold,
      italic: draftItalic,
      x: 0.08,
      y: clampFrac(0.08 + onPage * 0.08, 0.02, 0.9),
    });
    setTextValue("");
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [textValue, slotKey, draftSize, draftColor, draftFont, draftBold, draftItalic, addElement]);

  const pickImage = useCallback(async () => {
    setError(null);
    if (!slotKey) return;
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      setError("Photo library access is required to add an image.");
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 1 });
    if (res.canceled) return;
    const picked = res.assets[0]?.uri;
    if (!picked) return;
    let uriOut = picked;
    let aspect = 1;
    try {
      const rendered = await ImageManipulator.manipulate(picked).renderAsync();
      const out = await rendered.saveAsync({ format: SaveFormat.JPEG, compress: 0.92 });
      uriOut = out.uri;
      if (out.width > 0 && out.height > 0) aspect = out.height / out.width;
    } catch {
      /* fall back to the picked uri */
    }
    addElement({
      id: uid(),
      slot: slotKey,
      kind: "image",
      uri: uriOut,
      aspect,
      x: 0.3,
      y: 0.3,
      w: 0.4,
    });
    setActiveTool("select");
  }, [slotKey, addElement]);

  const signAspect = useMemo(() => {
    if (signMode === "draw") {
      return signDraw && signDraw.width > 0 ? signDraw.height / signDraw.width : 0.4;
    }
    return Math.max(0.12, Math.min(0.6, 2 / Math.max(1, signName.trim().length)));
  }, [signMode, signDraw, signName]);

  const addSign = useCallback(() => {
    if (!slotKey) return;
    if (signMode === "type" && !signName.trim()) {
      setError("Type your signature first.");
      return;
    }
    if (signMode === "draw" && (!signDraw || !signDraw.paths.length)) {
      setError("Draw your signature first.");
      return;
    }
    setError(null);
    addElement({
      id: uid(),
      slot: slotKey,
      kind: "sign",
      mode: signMode,
      name: signMode === "type" ? signName.trim() : undefined,
      signFont: signMode === "type" ? signFontFam : undefined,
      paths: signMode === "draw" ? signDraw?.paths : undefined,
      padW: signMode === "draw" ? signDraw?.width : undefined,
      padH: signMode === "draw" ? signDraw?.height : undefined,
      aspect: signAspect,
      x: 0.52,
      y: 0.72,
      w: 0.4,
    });
    setActiveTool("select");
  }, [slotKey, signMode, signName, signFontFam, signDraw, signAspect, addElement]);

  const addStamp = useCallback(() => {
    if (!slotKey) return;
    addElement({
      id: uid(),
      slot: slotKey,
      kind: "stamp",
      label: draftStampLabel,
      color: draftStampColor,
      aspect: 0.42,
      x: 0.34,
      y: 0.4,
      w: 0.32,
    });
    setActiveTool("select");
  }, [slotKey, draftStampLabel, draftStampColor, addElement]);

  /** Tap-to-place for shapes/lines/marks. cx/cy are page fractions. */
  const placeShape = useCallback(
    (kind: ElementKind, cx: number, cy: number) => {
      if (!slotKey) return;
      const dims: Record<string, { w: number; h: number }> = {
        rect: { w: 0.34, h: 0.2 },
        ellipse: { w: 0.3, h: 0.22 },
        highlight: { w: 0.45, h: 0.045 },
        whiteout: { w: 0.3, h: 0.06 },
        line: { w: 0.3, h: 0.16 },
        arrow: { w: 0.3, h: 0.16 },
      };
      const d = dims[kind] ?? { w: 0.3, h: 0.2 };
      const x = clampFrac(cx - d.w / 2, 0, 1 - d.w);
      const y = clampFrac(cy - d.h / 2, 0, 1 - d.h);
      let el: EditElement;
      if (kind === "rect" || kind === "ellipse") {
        el = { id: uid(), slot: slotKey, kind, x, y, w: d.w, h: d.h, color: draftColor, fill: draftFill, strokeWidth: draftStroke };
      } else if (kind === "highlight" || kind === "whiteout") {
        el = { id: uid(), slot: slotKey, kind, x, y, w: d.w, h: d.h, color: kind === "highlight" ? draftHighlight : "#ffffff" };
      } else if (kind === "line" || kind === "arrow") {
        el = { id: uid(), slot: slotKey, kind, x, y, w: d.w, h: d.h, color: draftColor, strokeWidth: draftStroke };
      } else {
        return;
      }
      addElement(el);
      setActiveTool("select");
    },
    [slotKey, draftColor, draftFill, draftStroke, draftHighlight, addElement],
  );

  // ── Freehand draw capture (full-page element per stroke) ───────────────────
  const drawPts = useRef<string>("");
  const drawResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onStartShouldSetPanResponderCapture: () => true,
        onMoveShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponderCapture: () => true,
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: (e) => {
          const { locationX, locationY } = e.nativeEvent;
          drawPts.current = `M ${locationX.toFixed(1)} ${locationY.toFixed(1)}`;
          setLiveStroke(drawPts.current);
          setInteracting(true);
        },
        onPanResponderMove: (e) => {
          const { locationX, locationY } = e.nativeEvent;
          drawPts.current += ` L ${locationX.toFixed(1)} ${locationY.toFixed(1)}`;
          setLiveStroke(drawPts.current);
        },
        onPanResponderRelease: () => {
          const d = drawPts.current;
          const box = pageBoxRef.current;
          drawPts.current = "";
          setLiveStroke("");
          setInteracting(false);
          if (d.includes("L") && box.width > 0 && slotKeyRef.current) {
            addElementRef.current({
              id: uid(),
              slot: slotKeyRef.current,
              kind: "draw",
              x: 0,
              y: 0,
              w: 1,
              h: 1,
              color: draftColorRef.current,
              strokeWidth: draftStrokeRef.current,
              paths: [d],
              padW: box.width,
              padH: box.height,
            });
          }
        },
        onPanResponderTerminate: () => {
          drawPts.current = "";
          setLiveStroke("");
          setInteracting(false);
        },
      }),
    [],
  );
  // Refs feeding the (stable) draw responder.
  const slotKeyRef = useRef(slotKey);
  slotKeyRef.current = slotKey;
  const draftColorRef = useRef(draftColor);
  draftColorRef.current = draftColor;
  const draftStrokeRef = useRef(draftStroke);
  draftStrokeRef.current = draftStroke;
  const addElementRef = useRef(addElement);
  addElementRef.current = addElement;

  // ── Tap-to-place capture for shapes ───────────────────────────────────────
  const placeStart = useRef({ x: 0, y: 0 });
  const placeResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onStartShouldSetPanResponderCapture: () => true,
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: (e) => {
          placeStart.current = { x: e.nativeEvent.locationX, y: e.nativeEvent.locationY };
        },
        onPanResponderRelease: (e, g) => {
          if (Math.abs(g.dx) + Math.abs(g.dy) > 14) return;
          const box = pageBoxRef.current;
          if (box.width <= 0) return;
          placeShapeRef.current(
            activeToolRef.current as ElementKind,
            placeStart.current.x / box.width,
            placeStart.current.y / box.height,
          );
        },
      }),
    [],
  );
  const activeToolRef = useRef(activeTool);
  activeToolRef.current = activeTool;
  const placeShapeRef = useRef(placeShape);
  placeShapeRef.current = placeShape;

  // ── Page operations (Manage Pages) ────────────────────────────────────────
  const rotatePage = useCallback((i: number) => {
    setOrder((o) =>
      o
        ? o.map((s, idx) =>
            idx === i ? { ...s, rotate: (((s.rotate + 90) % 360) as RotateDeg) } : s,
          )
        : o,
    );
  }, []);
  const deletePage = useCallback((i: number) => {
    setOrder((o) => {
      if (!o || o.length <= 1) return o;
      const removed = o[i];
      const next = o.filter((_, idx) => idx !== i);
      setElements((els) => els.filter((e) => e.slot !== removed.key));
      return next;
    });
  }, []);
  const duplicatePage = useCallback((i: number) => {
    const o = orderRef.current;
    if (!o || !o[i]) return;
    const srcSlot = o[i];
    const newKey = uid("s");
    const copy: PageSlot = { ...srcSlot, key: newKey };
    // Carry the source page's annotations onto the duplicate so it matches
    // what the user sees (fresh ids, re-pointed at the new slot key).
    const cloned = elementsRef.current
      .filter((e) => e.slot === srcSlot.key)
      .map((e) => ({ ...e, id: uid(), slot: newKey }) as EditElement);
    setOrder([...o.slice(0, i + 1), copy, ...o.slice(i + 1)]);
    if (cloned.length) setElements((els) => [...els, ...cloned]);
  }, []);
  const movePage = useCallback((i: number, dir: -1 | 1) => {
    setOrder((o) => {
      if (!o) return o;
      const j = i + dir;
      if (j < 0 || j >= o.length) return o;
      const next = [...o];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  }, []);
  const addBlankPage = useCallback(() => {
    setOrder((o) => [...(o ?? []), { key: uid("s"), src: null, rotate: 0 as RotateDeg }]);
  }, []);

  // ── Navigation ────────────────────────────────────────────────────────────
  const goBack = useCallback(() => {
    if (router.canGoBack()) router.back();
    else router.replace(ROUTES.tools as never);
  }, [router]);

  const gotoPage = useCallback((i: number) => {
    setCur(i);
    setSelectedId(null);
  }, []);

  // ── Save ──────────────────────────────────────────────────────────────────
  const save = useCallback(async () => {
    if (!tool || !order) return;
    setError(null);
    try {
      const name = `${stripExt(fileName)}-edited.pdf`;
      const uri = await buildEditedPdf({
        srcUri: params.uri,
        outName: name,
        fallbackPageCount: PAGE_COUNT,
        pageOrder: order,
        elements,
        watermark: wmEnabled && wmText.trim() ? { text: wmText, opacity: wmOpacity, place: wmPos } : null,
        crop: cropEnabled ? cropRect : null,
      });
      setSaved({ uri, name });
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      await addHistory({
        id: `h_${Date.now()}`,
        toolId: tool.id,
        toolTitle: tool.title,
        fileName: name,
        outputFormat: tool.outputFormat,
        timestamp: Date.now(),
        status: "completed",
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save the PDF.");
    }
  }, [tool, order, fileName, params.uri, elements, wmEnabled, wmText, wmOpacity, wmPos, cropEnabled, cropRect]);

  const onShare = useCallback(async () => {
    if (!saved) return;
    try {
      const ok = await shareFile(saved.uri, saved.name);
      if (!ok) setError("Sharing isn't available on this platform.");
    } catch {
      setError("Could not open the share sheet.");
    }
  }, [saved]);

  // ── Early returns ─────────────────────────────────────────────────────────
  if (!tool) {
    return (
      <ScreenScroll insetTop>
        <BackRow onPress={goBack} />
        <View style={styles.emptyState}>
          <Feather name="alert-triangle" size={40} color={C.border} />
          <Text style={styles.emptyTitle}>Editor unavailable</Text>
          <Button label="Browse tools" icon="grid" onPress={() => router.replace(ROUTES.tools as never)} style={{ alignSelf: "center" }} />
        </View>
      </ScreenScroll>
    );
  }

  if (saved) {
    return (
      <ScreenScroll insetTop>
        <BackRow onPress={goBack} title={tool.title} />
        <Card style={{ marginTop: 8 }}>
          <View style={styles.successWrap}>
            <ConverterStatusIcon status="success" size={88} />
            <Text style={styles.successTitle} testID="text-success">
              Saved successfully
            </Text>
            <View style={styles.outputRow}>
              <Feather name="file-text" size={18} color={C.primary} />
              <Text style={styles.outputName} numberOfLines={1} testID="text-output-name">
                {saved.name}
              </Text>
            </View>
            <View style={{ gap: 10, width: "100%", marginTop: 16 }}>
              <Button label="Download / Share" icon="download" fullWidth onPress={onShare} testID="button-share" />
              <Button label="Done" icon="check" variant="outline" fullWidth onPress={goBack} testID="button-done" />
            </View>
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
          </View>
        </Card>
      </ScreenScroll>
    );
  }

  const selected = elements.find((e) => e.id === selectedId) ?? null;
  const captureActive = CAPTURE_TOOLS.has(activeTool);
  const pageElements = elements.filter((e) => e.slot === slotKey);

  return (
    <ScreenScroll insetTop scrollEnabled={!interacting}>
      <BackRow onPress={goBack} title={tool.title} />

      <View style={styles.headerRow}>
        <View style={styles.iconTile}>
          <Feather name={tool.feather} size={20} color={C.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.fileLabel} numberOfLines={1} testID="text-filename">
            {fileName}
          </Text>
          <Text style={styles.fileSub} numberOfLines={1}>
            {tool.description}
          </Text>
        </View>
      </View>

      {/* Tool palette */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.toolbar}
      >
        {TOOLBAR.map((t) => {
          const active = activeTool === t.id;
          return (
            <Pressable
              key={t.id}
              onPress={() => {
                setActiveTool(t.id);
                if (t.id !== "select") setSelectedId(null);
              }}
              style={[styles.toolBtn, active && styles.toolBtnActive]}
              testID={`tool-${t.id}`}
            >
              <Feather name={t.icon} size={18} color={active ? "#fff" : C.foreground} />
              <Text style={[styles.toolLabel, active && styles.toolLabelActive]} numberOfLines={1}>
                {t.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {order == null ? (
        <View style={styles.loadingSurface}>
          {docError ? (
            <Text style={styles.errorText}>{docError}</Text>
          ) : (
            <>
              <Loader size={56} />
              <Text style={styles.loadingText}>Loading your PDF…</Text>
            </>
          )}
        </View>
      ) : activeTool === "pages" ? (
        <ManagePages
          order={order}
          uri={params.uri}
          current={cur}
          onSelect={gotoPage}
          onRotate={rotatePage}
          onDuplicate={duplicatePage}
          onDelete={deletePage}
          onMove={movePage}
          onAddBlank={addBlankPage}
        />
      ) : (
        <>
          {/* Edit toolbar: undo/redo + page nav */}
          <View style={styles.editBar}>
            <View style={styles.editBarGroup}>
              <Pressable
                onPress={undo}
                disabled={!past.length}
                style={[styles.miniBtn, !past.length && styles.miniBtnDisabled]}
                testID="button-undo"
              >
                <Feather name="corner-up-left" size={18} color={past.length ? C.foreground : C.border} />
              </Pressable>
              <Pressable
                onPress={redo}
                disabled={!future.length}
                style={[styles.miniBtn, !future.length && styles.miniBtnDisabled]}
                testID="button-redo"
              >
                <Feather name="corner-up-right" size={18} color={future.length ? C.foreground : C.border} />
              </Pressable>
            </View>
            <View style={styles.editBarGroup}>
              <Pressable
                onPress={() => gotoPage(Math.max(0, cur - 1))}
                disabled={cur === 0}
                style={[styles.miniBtn, cur === 0 && styles.miniBtnDisabled]}
                testID="button-prev-page"
              >
                <Feather name="chevron-left" size={18} color={cur === 0 ? C.border : C.foreground} />
              </Pressable>
              <Text style={styles.pageNavText}>
                Page {cur + 1} of {order.length}
              </Text>
              <Pressable
                onPress={() => gotoPage(Math.min(order.length - 1, cur + 1))}
                disabled={cur >= order.length - 1}
                style={[styles.miniBtn, cur >= order.length - 1 && styles.miniBtnDisabled]}
                testID="button-next-page"
              >
                <Feather name="chevron-right" size={18} color={cur >= order.length - 1 ? C.border : C.foreground} />
              </Pressable>
            </View>
          </View>

          {/* Page preview surface */}
          <View style={styles.pageSurface}>
            <View
              style={[styles.page, { aspectRatio: 1 / pageAspect }]}
              onLayout={(e) =>
                setPageBox({
                  width: e.nativeEvent.layout.width,
                  height: e.nativeEvent.layout.height,
                })
              }
            >
              {slot?.src == null ? (
                <View style={styles.blankPage} pointerEvents="none">
                  <Feather name="file" size={34} color={C.border} />
                  <Text style={styles.pageFallbackText}>Blank page</Text>
                </View>
              ) : pageImage ? (
                <Image source={{ uri: pageImage }} style={StyleSheet.absoluteFill} resizeMode="contain" />
              ) : (
                <View style={styles.pageFallback} pointerEvents="none">
                  <Feather name="file-text" size={38} color={C.mutedForeground} />
                  <Text style={styles.pageFallbackText}>Page {cur + 1}</Text>
                </View>
              )}

              {/* Element overlays */}
              {pageBox.width > 0 &&
                pageElements.map((el) => (
                  <ElementOverlay
                    key={el.id}
                    el={el}
                    container={pageBox}
                    selected={selectedId === el.id}
                    interactive={!captureActive}
                    onSelect={() => {
                      setSelectedId(el.id);
                      if (activeTool !== "select") setActiveTool("select");
                    }}
                    onBeginDrag={beginDrag}
                    onEndDrag={endDrag}
                    onGeom={(partial) => dragGeom(el.id, partial)}
                  />
                ))}

              {/* Document-level: watermark overlay */}
              {activeTool === "watermark" && wmEnabled && pageBox.width > 0 && (
                <WatermarkOverlay
                  container={pageBox}
                  value={wmPos}
                  text={wmText || "WATERMARK"}
                  opacity={wmOpacity}
                  onChange={setWmPos}
                  onInteract={setInteracting}
                />
              )}

              {/* Document-level: crop overlay */}
              {activeTool === "crop" && cropEnabled && pageBox.width > 0 && (
                <CropBox
                  container={pageBox}
                  value={cropRect}
                  onChange={setCropRect}
                  onInteract={setInteracting}
                />
              )}

              {/* Capture layer for shapes / freehand draw */}
              {captureActive && pageBox.width > 0 && (
                <View
                  style={[StyleSheet.absoluteFill, WEB_NO_TOUCH_SCROLL]}
                  {...(activeTool === "draw" ? drawResponder.panHandlers : placeResponder.panHandlers)}
                >
                  {activeTool === "draw" && liveStroke ? (
                    <Svg width="100%" height="100%" style={{ pointerEvents: "none" }}>
                      <Path
                        d={liveStroke}
                        stroke={draftColor}
                        strokeWidth={draftStroke}
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </Svg>
                  ) : null}
                </View>
              )}
            </View>

            {/* Thumbnail rail */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.railRow}>
              {order.map((s, i) => (
                <RailThumb
                  key={s.key}
                  uri={params.uri}
                  src={s.src}
                  rotate={s.rotate}
                  index={i}
                  active={i === cur}
                  onPress={() => gotoPage(i)}
                />
              ))}
            </ScrollView>
          </View>

          {/* Contextual properties panel */}
          <Card style={{ marginTop: 4 }}>
            {renderPanel({
              activeTool,
              selected,
              // text
              textValue,
              setTextValue,
              addText,
              draftSize,
              setDraftSize,
              draftColor,
              setDraftColor,
              draftFont,
              setDraftFont,
              draftBold,
              setDraftBold,
              draftItalic,
              setDraftItalic,
              // shapes
              draftStroke,
              setDraftStroke,
              draftFill,
              setDraftFill,
              draftHighlight,
              setDraftHighlight,
              // stamp
              draftStampLabel,
              setDraftStampLabel,
              draftStampColor,
              setDraftStampColor,
              addStamp,
              // image
              pickImage,
              // sign
              signMode,
              setSignMode,
              signName,
              setSignName,
              signFontFam,
              setSignFontFam,
              setSignDraw,
              addSign,
              setInteracting,
              // watermark
              wmEnabled,
              setWmEnabled,
              wmText,
              setWmText,
              wmOpacity,
              setWmOpacity,
              // crop
              cropEnabled,
              setCropEnabled,
              setCropRect,
              // selection ops
              updateProp,
              removeSelected,
              duplicateSelected,
            })}
          </Card>
        </>
      )}

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <View style={{ marginTop: 18 }}>
        <Button label="Save PDF" icon="save" fullWidth onPress={save} testID="button-save" />
      </View>
    </ScreenScroll>
  );
}

// ── Properties panel ─────────────────────────────────────────────────────────
interface PanelProps {
  activeTool: ToolId;
  selected: EditElement | null;
  textValue: string;
  setTextValue: (v: string) => void;
  addText: () => void;
  draftSize: number;
  setDraftSize: (v: number) => void;
  draftColor: string;
  setDraftColor: (v: string) => void;
  draftFont: FontKey;
  setDraftFont: (v: FontKey) => void;
  draftBold: boolean;
  setDraftBold: (v: boolean) => void;
  draftItalic: boolean;
  setDraftItalic: (v: boolean) => void;
  draftStroke: number;
  setDraftStroke: (v: number) => void;
  draftFill: boolean;
  setDraftFill: (v: boolean) => void;
  draftHighlight: string;
  setDraftHighlight: (v: string) => void;
  draftStampLabel: string;
  setDraftStampLabel: (v: string) => void;
  draftStampColor: string;
  setDraftStampColor: (v: string) => void;
  addStamp: () => void;
  pickImage: () => void;
  signMode: "type" | "draw";
  setSignMode: (v: "type" | "draw") => void;
  signName: string;
  setSignName: (v: string) => void;
  signFontFam: string;
  setSignFontFam: (v: string) => void;
  setSignDraw: (d: SignatureData | null) => void;
  addSign: () => void;
  setInteracting: (v: boolean) => void;
  wmEnabled: boolean;
  setWmEnabled: (v: boolean) => void;
  wmText: string;
  setWmText: (v: string) => void;
  wmOpacity: number;
  setWmOpacity: (v: number) => void;
  cropEnabled: boolean;
  setCropEnabled: (v: boolean) => void;
  setCropRect: (r: FRect) => void;
  updateProp: (id: string, partial: Partial<EditElement>) => void;
  removeSelected: () => void;
  duplicateSelected: () => void;
}

function renderPanel(p: PanelProps): React.ReactNode {
  // Selection editor takes priority when an element is selected.
  if (p.activeTool === "select") {
    if (!p.selected) {
      return (
        <View style={{ gap: 8 }}>
          <Text style={styles.controlTitle}>Select &amp; arrange</Text>
          <Text style={styles.controlHelp}>
            Tap any item on the page to move, resize or edit it. Pick a tool above to add new content.
          </Text>
        </View>
      );
    }
    return <SelectionEditor {...p} el={p.selected} />;
  }

  switch (p.activeTool) {
    case "text":
      return (
        <View style={{ gap: 14 }}>
          <Text style={styles.controlTitle}>Add text</Text>
          <TextInput
            value={p.textValue}
            onChangeText={p.setTextValue}
            placeholder="Type text to place…"
            placeholderTextColor={C.mutedForeground}
            style={styles.input}
            testID="input-text"
          />
          <FontRow value={p.draftFont} onChange={p.setDraftFont} />
          <StyleToggles bold={p.draftBold} italic={p.draftItalic} onBold={p.setDraftBold} onItalic={p.setDraftItalic} />
          <SizeRow value={p.draftSize} onChange={p.setDraftSize} />
          <SwatchRow label="Color" colors={INK_COLORS} value={p.draftColor} onChange={p.setDraftColor} />
          <Button label="Add to page" icon="plus" fullWidth onPress={p.addText} testID="button-add-text" />
        </View>
      );
    case "image":
      return (
        <View style={{ gap: 12 }}>
          <Text style={styles.controlTitle}>Add image</Text>
          <Text style={styles.controlHelp}>Pick a photo or logo. Drag to move and use the corner handle to resize.</Text>
          <Button label="Choose image" icon="image" variant="outline" fullWidth onPress={p.pickImage} testID="button-pick-image" />
        </View>
      );
    case "sign":
      return (
        <View style={{ gap: 14 }}>
          <Text style={styles.controlTitle}>Signature</Text>
          <View style={styles.segmented}>
            <Pressable onPress={() => p.setSignMode("draw")} style={[styles.segment, p.signMode === "draw" && styles.segmentActive]} testID="button-sign-draw">
              <Feather name="edit-2" size={15} color={p.signMode === "draw" ? C.primary : C.mutedForeground} />
              <Text style={[styles.segmentText, p.signMode === "draw" && styles.segmentTextActive]}>Draw</Text>
            </Pressable>
            <Pressable onPress={() => p.setSignMode("type")} style={[styles.segment, p.signMode === "type" && styles.segmentActive]} testID="button-sign-type">
              <Feather name="type" size={15} color={p.signMode === "type" ? C.primary : C.mutedForeground} />
              <Text style={[styles.segmentText, p.signMode === "type" && styles.segmentTextActive]}>Type</Text>
            </Pressable>
          </View>
          {p.signMode === "draw" ? (
            <View style={{ gap: 6 }}>
              <Text style={styles.controlLabel}>Draw your signature</Text>
              <SignaturePad onChange={p.setSignDraw} onInteract={p.setInteracting} />
            </View>
          ) : (
            <>
              <TextInput
                value={p.signName}
                onChangeText={p.setSignName}
                placeholder="Your name"
                placeholderTextColor={C.mutedForeground}
                style={[styles.input, { fontFamily: p.signFontFam, fontSize: 18 }]}
                testID="input-signature"
              />
              <View>
                <Text style={styles.controlLabel}>Style</Text>
                <View style={styles.chipRow}>
                  {SIGN_FONTS.map((f) => (
                    <Chip key={f.label} label={f.label} active={p.signFontFam === f.family} onPress={() => p.setSignFontFam(f.family)} />
                  ))}
                </View>
              </View>
            </>
          )}
          <Button label="Add signature" icon="plus" fullWidth onPress={p.addSign} testID="button-add-sign" />
        </View>
      );
    case "stamp":
      return (
        <View style={{ gap: 14 }}>
          <Text style={styles.controlTitle}>Stamp</Text>
          <View style={styles.chipRow}>
            {STAMP_PRESETS.map((s) => (
              <Chip key={s} label={s} active={p.draftStampLabel === s} onPress={() => p.setDraftStampLabel(s)} />
            ))}
          </View>
          <TextInput
            value={p.draftStampLabel}
            onChangeText={(t) => p.setDraftStampLabel(t.toUpperCase())}
            placeholder="Custom label"
            placeholderTextColor={C.mutedForeground}
            autoCapitalize="characters"
            style={styles.input}
            testID="input-stamp"
          />
          <SwatchRow label="Color" colors={STAMP_COLORS} value={p.draftStampColor} onChange={p.setDraftStampColor} />
          <Button label="Add stamp" icon="plus" fullWidth onPress={p.addStamp} testID="button-add-stamp" />
        </View>
      );
    case "highlight":
      return (
        <View style={{ gap: 12 }}>
          <Text style={styles.controlTitle}>Highlight</Text>
          <Text style={styles.controlHelp}>Tap the page to drop a highlight, then drag to position it over text.</Text>
          <SwatchRow label="Color" colors={HIGHLIGHT_COLORS} value={p.draftHighlight} onChange={p.setDraftHighlight} />
        </View>
      );
    case "whiteout":
      return (
        <View style={{ gap: 8 }}>
          <Text style={styles.controlTitle}>Whiteout</Text>
          <Text style={styles.controlHelp}>Tap the page to cover an area with a solid white box. Drag and resize to fit.</Text>
        </View>
      );
    case "rect":
    case "ellipse":
      return (
        <View style={{ gap: 12 }}>
          <Text style={styles.controlTitle}>{p.activeTool === "rect" ? "Rectangle" : "Ellipse"}</Text>
          <Text style={styles.controlHelp}>Tap the page to add the shape, then drag and resize it.</Text>
          <SwatchRow label="Color" colors={INK_COLORS} value={p.draftColor} onChange={p.setDraftColor} />
          <StrokeRow value={p.draftStroke} onChange={p.setDraftStroke} />
          <ToggleRow label="Fill" active={p.draftFill} onChange={p.setDraftFill} />
        </View>
      );
    case "line":
    case "arrow":
      return (
        <View style={{ gap: 12 }}>
          <Text style={styles.controlTitle}>{p.activeTool === "line" ? "Line" : "Arrow"}</Text>
          <Text style={styles.controlHelp}>Tap the page to add it, then drag and resize.</Text>
          <SwatchRow label="Color" colors={INK_COLORS} value={p.draftColor} onChange={p.setDraftColor} />
          <StrokeRow value={p.draftStroke} onChange={p.setDraftStroke} />
        </View>
      );
    case "watermark":
      return (
        <View style={{ gap: 14 }}>
          <ToggleRow label="Apply watermark to every page" active={p.wmEnabled} onChange={p.setWmEnabled} />
          {p.wmEnabled && (
            <>
              <TextInput
                value={p.wmText}
                onChangeText={p.setWmText}
                placeholder="WATERMARK"
                placeholderTextColor={C.mutedForeground}
                autoCapitalize="characters"
                style={styles.input}
                testID="input-watermark"
              />
              <View>
                <Text style={styles.controlLabel}>Opacity</Text>
                <View style={styles.chipRow}>
                  {WM_OPACITY.map((o) => (
                    <Chip key={o.label} label={o.label} active={p.wmOpacity === o.value} onPress={() => p.setWmOpacity(o.value)} />
                  ))}
                </View>
              </View>
              <Text style={styles.controlHelp}>Drag the watermark on the page to move it; drag the corner to resize.</Text>
            </>
          )}
        </View>
      );
    case "crop":
      return (
        <View style={{ gap: 14 }}>
          <ToggleRow label="Crop every page" active={p.cropEnabled} onChange={p.setCropEnabled} />
          {p.cropEnabled && (
            <>
              <Text style={styles.controlLabel}>Presets</Text>
              <View style={styles.chipRow}>
                {[
                  { label: "Full", v: { x: 0, y: 0, w: 1, h: 1 } },
                  { label: "Trim 5%", v: { x: 0.05, y: 0.05, w: 0.9, h: 0.9 } },
                  { label: "Trim 10%", v: { x: 0.1, y: 0.1, w: 0.8, h: 0.8 } },
                  { label: "Trim 15%", v: { x: 0.15, y: 0.15, w: 0.7, h: 0.7 } },
                ].map((c) => (
                  <Chip key={c.label} label={c.label} active={false} onPress={() => p.setCropRect(c.v)} />
                ))}
              </View>
              <Text style={styles.controlHelp}>Drag the crop box to move it; drag the corner to resize. Applies to all pages.</Text>
            </>
          )}
        </View>
      );
    default:
      return null;
  }
}

function SelectionEditor(p: PanelProps & { el: EditElement }): React.ReactNode {
  const { el, updateProp, removeSelected, duplicateSelected } = p;
  const head = (
    <View style={styles.selHead}>
      <Text style={styles.controlTitle}>Edit {kindLabel(el.kind)}</Text>
      <View style={{ flexDirection: "row", gap: 8 }}>
        <Pressable onPress={duplicateSelected} style={styles.miniBtn} testID="button-duplicate-el">
          <Feather name="copy" size={16} color={C.foreground} />
        </Pressable>
        <Pressable onPress={removeSelected} style={[styles.miniBtn, styles.miniBtnDanger]} testID="button-delete-el">
          <Feather name="trash-2" size={16} color={C.destructive} />
        </Pressable>
      </View>
    </View>
  );

  let body: React.ReactNode = null;
  if (el.kind === "text") {
    body = (
      <>
        <TextInput
          value={el.text}
          onChangeText={(t) => updateProp(el.id, { text: t })}
          style={styles.input}
          testID="input-edit-text"
        />
        <FontRow value={el.font} onChange={(f) => updateProp(el.id, { font: f })} />
        <StyleToggles
          bold={el.bold}
          italic={el.italic}
          onBold={(b) => updateProp(el.id, { bold: b })}
          onItalic={(i) => updateProp(el.id, { italic: i })}
        />
        <SizeRow value={el.size} onChange={(s) => updateProp(el.id, { size: s })} />
        <SwatchRow label="Color" colors={INK_COLORS} value={el.color} onChange={(c) => updateProp(el.id, { color: c })} />
      </>
    );
  } else if (el.kind === "rect" || el.kind === "ellipse") {
    body = (
      <>
        <SwatchRow label="Color" colors={INK_COLORS} value={el.color} onChange={(c) => updateProp(el.id, { color: c })} />
        <StrokeRow value={el.strokeWidth} onChange={(s) => updateProp(el.id, { strokeWidth: s })} />
        <ToggleRow label="Fill" active={el.fill} onChange={(f) => updateProp(el.id, { fill: f })} />
      </>
    );
  } else if (el.kind === "line" || el.kind === "arrow") {
    body = (
      <>
        <SwatchRow label="Color" colors={INK_COLORS} value={el.color} onChange={(c) => updateProp(el.id, { color: c })} />
        <StrokeRow value={el.strokeWidth} onChange={(s) => updateProp(el.id, { strokeWidth: s })} />
      </>
    );
  } else if (el.kind === "highlight") {
    body = <SwatchRow label="Color" colors={HIGHLIGHT_COLORS} value={el.color} onChange={(c) => updateProp(el.id, { color: c })} />;
  } else if (el.kind === "stamp") {
    body = (
      <>
        <TextInput
          value={el.label}
          onChangeText={(t) => updateProp(el.id, { label: t.toUpperCase() })}
          autoCapitalize="characters"
          style={styles.input}
        />
        <SwatchRow label="Color" colors={STAMP_COLORS} value={el.color} onChange={(c) => updateProp(el.id, { color: c })} />
      </>
    );
  } else if (el.kind === "draw") {
    body = <SwatchRow label="Color" colors={INK_COLORS} value={el.color} onChange={(c) => updateProp(el.id, { color: c })} />;
  } else {
    body = <Text style={styles.controlHelp}>Drag to move, use the corner handle to resize.</Text>;
  }

  return (
    <View style={{ gap: 14 }}>
      {head}
      {body}
    </View>
  );
}

function kindLabel(k: ElementKind): string {
  const m: Record<ElementKind, string> = {
    text: "text",
    image: "image",
    sign: "signature",
    stamp: "stamp",
    rect: "rectangle",
    ellipse: "ellipse",
    highlight: "highlight",
    whiteout: "whiteout",
    line: "line",
    arrow: "arrow",
    draw: "drawing",
  };
  return m[k];
}

// ── Reusable control rows ────────────────────────────────────────────────────
function SwatchRow({ label, colors: cs, value, onChange }: { label: string; colors: string[]; value: string; onChange: (c: string) => void }) {
  return (
    <View>
      <Text style={styles.controlLabel}>{label}</Text>
      <View style={styles.chipRow}>
        {cs.map((c) => (
          <Pressable
            key={c}
            onPress={() => onChange(c)}
            style={[styles.swatch, { backgroundColor: c }, value === c && styles.swatchActive]}
            testID={`swatch-${c}`}
          />
        ))}
      </View>
    </View>
  );
}

function SizeRow({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <View>
      <Text style={styles.controlLabel}>Size</Text>
      <View style={styles.chipRow}>
        {FONT_SIZES.map((s) => (
          <Chip key={s} label={`${s}`} active={value === s} onPress={() => onChange(s)} />
        ))}
      </View>
    </View>
  );
}

function StrokeRow({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <View>
      <Text style={styles.controlLabel}>Thickness</Text>
      <View style={styles.chipRow}>
        {STROKE_WIDTHS.map((s) => (
          <Chip key={s} label={`${s}px`} active={value === s} onPress={() => onChange(s)} />
        ))}
      </View>
    </View>
  );
}

function FontRow({ value, onChange }: { value: FontKey; onChange: (f: FontKey) => void }) {
  return (
    <View>
      <Text style={styles.controlLabel}>Font</Text>
      <View style={styles.chipRow}>
        {FONT_FAMILIES.map((f) => (
          <Chip key={f.key} label={f.label} active={value === f.key} onPress={() => onChange(f.key)} />
        ))}
      </View>
    </View>
  );
}

function StyleToggles({ bold, italic, onBold, onItalic }: { bold: boolean; italic: boolean; onBold: (b: boolean) => void; onItalic: (i: boolean) => void }) {
  return (
    <View style={{ flexDirection: "row", gap: 8 }}>
      <Pressable onPress={() => onBold(!bold)} style={[styles.styleBtn, bold && styles.styleBtnActive]} testID="toggle-bold">
        <Feather name="bold" size={16} color={bold ? "#fff" : C.foreground} />
      </Pressable>
      <Pressable onPress={() => onItalic(!italic)} style={[styles.styleBtn, italic && styles.styleBtnActive]} testID="toggle-italic">
        <Feather name="italic" size={16} color={italic ? "#fff" : C.foreground} />
      </Pressable>
    </View>
  );
}

function ToggleRow({ label, active, onChange }: { label: string; active: boolean; onChange: (v: boolean) => void }) {
  return (
    <Pressable onPress={() => onChange(!active)} style={styles.toggleRow} testID={`toggle-${label}`}>
      <Text style={styles.toggleLabel}>{label}</Text>
      <View style={[styles.toggleTrack, active && styles.toggleTrackOn]}>
        <View style={[styles.toggleKnob, active && styles.toggleKnobOn]} />
      </View>
    </Pressable>
  );
}

// ── Element overlay (preview) ────────────────────────────────────────────────
function ElementOverlay({
  el,
  container,
  selected,
  interactive,
  onSelect,
  onBeginDrag,
  onEndDrag,
  onGeom,
}: {
  el: EditElement;
  container: { width: number; height: number };
  selected: boolean;
  interactive: boolean;
  onSelect: () => void;
  onBeginDrag: () => void;
  onEndDrag: () => void;
  onGeom: (partial: Partial<EditElement>) => void;
}) {
  const onInteract = (a: boolean) => (a ? onBeginDrag() : onEndDrag());

  if (el.kind === "text") {
    return (
      <DragMove
        container={container}
        value={{ x: el.x, y: el.y }}
        selected={selected}
        interactive={interactive}
        onSelect={onSelect}
        onInteract={onInteract}
        onChange={(pos) => onGeom(pos)}
      >
        <Text
          style={{
            color: el.color,
            fontSize: el.size,
            fontFamily: PREVIEW_FONT[el.font],
            fontWeight: el.bold ? "700" : "400",
            fontStyle: el.italic ? "italic" : "normal",
          }}
          numberOfLines={1}
        >
          {el.text}
        </Text>
      </DragMove>
    );
  }

  if (el.kind === "draw") {
    // Full-page, non-interactive vector strokes.
    return (
      <Svg
        width={container.width}
        height={container.height}
        style={[StyleSheet.absoluteFill, { pointerEvents: "none" }]}
      >
        {el.paths.map((d, i) => (
          <Path key={i} d={d} stroke={el.color} strokeWidth={el.strokeWidth} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        ))}
      </Svg>
    );
  }

  if (el.kind === "image" || el.kind === "sign" || el.kind === "stamp") {
    return (
      <DraggableBox
        container={container}
        value={{ x: el.x, y: el.y, w: el.w }}
        aspect={el.aspect}
        selected={selected}
        interactive={interactive}
        onSelect={onSelect}
        onInteract={onInteract}
        onChange={(pl) => onGeom(pl)}
      >
        <AspectContent el={el} container={container} />
      </DraggableBox>
    );
  }

  // Free box: rect / ellipse / highlight / whiteout / line / arrow
  const wpx = el.w * container.width;
  const hpx = el.h * container.height;
  return (
    <FreeBox
      container={container}
      value={{ x: el.x, y: el.y, w: el.w, h: el.h }}
      selected={selected}
      interactive={interactive}
      onSelect={onSelect}
      onInteract={onInteract}
      onChange={(r) => onGeom(r)}
    >
      <ShapeSvg el={el} wpx={wpx} hpx={hpx} />
    </FreeBox>
  );
}

function AspectContent({ el, container }: { el: EditElement; container: { width: number; height: number } }) {
  if (el.kind === "image") {
    return <Image source={{ uri: el.uri }} style={StyleSheet.absoluteFill} resizeMode="contain" />;
  }
  if (el.kind === "sign") {
    if (el.mode === "draw" && el.paths?.length && el.padW && el.padH) {
      return (
        <Svg width="100%" height="100%" viewBox={`0 0 ${el.padW} ${el.padH}`} preserveAspectRatio="none" style={{ pointerEvents: "none" }}>
          {el.paths.map((d, i) => (
            <Path key={i} d={d} stroke={C.foreground} strokeWidth={2.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
          ))}
        </Svg>
      );
    }
    const fontSize = Math.max(8, el.w * container.width * el.aspect);
    return (
      <Text style={{ width: "100%", textAlign: "center", color: C.foreground, fontFamily: el.signFont ?? fonts.heading, fontSize }} numberOfLines={1}>
        {el.name}
      </Text>
    );
  }
  if (el.kind === "stamp") {
    const boxH = el.w * container.width * el.aspect;
    return (
      <View style={[styles.stampInner, { borderColor: el.color, borderWidth: Math.max(1.5, boxH * 0.06) }]}>
        <Text style={{ color: el.color, fontFamily: fonts.headingBold, fontSize: Math.max(8, boxH * 0.46) }} numberOfLines={1}>
          {el.label}
        </Text>
      </View>
    );
  }
  return null;
}

function ShapeSvg({ el, wpx, hpx }: { el: EditElement; wpx: number; hpx: number }) {
  if (wpx <= 0 || hpx <= 0) return null;
  if (el.kind === "rect") {
    const sw = el.strokeWidth;
    return (
      <Svg width={wpx} height={hpx} style={{ pointerEvents: "none" }}>
        <Rect x={sw / 2} y={sw / 2} width={Math.max(0, wpx - sw)} height={Math.max(0, hpx - sw)} stroke={el.color} strokeWidth={sw} fill={el.fill ? el.color : "none"} fillOpacity={el.fill ? 0.25 : 0} />
      </Svg>
    );
  }
  if (el.kind === "ellipse") {
    const sw = el.strokeWidth;
    return (
      <Svg width={wpx} height={hpx} style={{ pointerEvents: "none" }}>
        <Ellipse cx={wpx / 2} cy={hpx / 2} rx={Math.max(0, (wpx - sw) / 2)} ry={Math.max(0, (hpx - sw) / 2)} stroke={el.color} strokeWidth={sw} fill={el.fill ? el.color : "none"} fillOpacity={el.fill ? 0.25 : 0} />
      </Svg>
    );
  }
  if (el.kind === "highlight") {
    return (
      <Svg width={wpx} height={hpx} style={{ pointerEvents: "none" }}>
        <Rect x={0} y={0} width={wpx} height={hpx} fill={el.color} fillOpacity={0.35} />
      </Svg>
    );
  }
  if (el.kind === "whiteout") {
    return (
      <Svg width={wpx} height={hpx} style={{ pointerEvents: "none" }}>
        <Rect x={0} y={0} width={wpx} height={hpx} fill="#ffffff" />
      </Svg>
    );
  }
  if (el.kind === "line" || el.kind === "arrow") {
    const sw = el.strokeWidth;
    const x1 = sw / 2;
    const y1 = sw / 2;
    const x2 = wpx - sw / 2;
    const y2 = hpx - sw / 2;
    const ang = Math.atan2(y2 - y1, x2 - x1);
    const len = Math.max(8, sw * 4);
    const a1 = ang + Math.PI * 0.82;
    const a2 = ang - Math.PI * 0.82;
    return (
      <Svg width={wpx} height={hpx} style={{ pointerEvents: "none" }}>
        <Line x1={x1} y1={y1} x2={x2} y2={y2} stroke={el.color} strokeWidth={sw} strokeLinecap="round" />
        {el.kind === "arrow" ? (
          <Polygon
            points={`${x2},${y2} ${x2 + len * Math.cos(a1)},${y2 + len * Math.sin(a1)} ${x2 + len * Math.cos(a2)},${y2 + len * Math.sin(a2)}`}
            fill={el.color}
          />
        ) : null}
      </Svg>
    );
  }
  return null;
}

// ── Manage pages ─────────────────────────────────────────────────────────────
function ManagePages({
  order,
  uri,
  current,
  onSelect,
  onRotate,
  onDuplicate,
  onDelete,
  onMove,
  onAddBlank,
}: {
  order: PageSlot[];
  uri?: string;
  current: number;
  onSelect: (i: number) => void;
  onRotate: (i: number) => void;
  onDuplicate: (i: number) => void;
  onDelete: (i: number) => void;
  onMove: (i: number, dir: -1 | 1) => void;
  onAddBlank: () => void;
}) {
  return (
    <View style={{ gap: 14 }}>
      <Text style={styles.controlHelp}>
        Reorder, rotate, duplicate, delete or add blank pages. Tap a page to edit it.
      </Text>
      <View style={styles.pageGrid}>
        {order.map((s, i) => (
          <View key={s.key} style={styles.manageCard}>
            <Pressable onPress={() => onSelect(i)} style={[styles.thumb, current === i && styles.thumbActive]} testID={`manage-page-${i}`}>
              <PageThumbImage uri={uri} src={s.src} rotate={s.rotate} index={i} />
            </Pressable>
            <View style={styles.manageRow}>
              <Pressable onPress={() => onMove(i, -1)} disabled={i === 0} style={[styles.mp, i === 0 && styles.mpDisabled]} testID={`page-left-${i}`}>
                <Feather name="arrow-left" size={15} color={i === 0 ? C.border : C.foreground} />
              </Pressable>
              <Pressable onPress={() => onRotate(i)} style={styles.mp} testID={`page-rotate-${i}`}>
                <Feather name="rotate-cw" size={15} color={C.foreground} />
              </Pressable>
              <Pressable onPress={() => onDuplicate(i)} style={styles.mp} testID={`page-dup-${i}`}>
                <Feather name="copy" size={15} color={C.foreground} />
              </Pressable>
              <Pressable onPress={() => onDelete(i)} disabled={order.length <= 1} style={[styles.mp, order.length <= 1 && styles.mpDisabled]} testID={`page-del-${i}`}>
                <Feather name="trash-2" size={15} color={order.length <= 1 ? C.border : C.destructive} />
              </Pressable>
              <Pressable onPress={() => onMove(i, 1)} disabled={i === order.length - 1} style={[styles.mp, i === order.length - 1 && styles.mpDisabled]} testID={`page-right-${i}`}>
                <Feather name="arrow-right" size={15} color={i === order.length - 1 ? C.border : C.foreground} />
              </Pressable>
            </View>
          </View>
        ))}
      </View>
      <Button label="Add blank page" icon="plus" variant="outline" fullWidth onPress={onAddBlank} testID="button-add-blank" />
    </View>
  );
}

function PageThumbImage({ uri, src, rotate, index }: { uri?: string; src: number | null; rotate: RotateDeg; index: number }) {
  const img = useRenderedPage(uri, src ?? -1, 240);
  if (src == null) {
    return (
      <View style={styles.thumbBlank}>
        <Feather name="file" size={20} color={C.border} />
      </View>
    );
  }
  return img ? (
    <Image source={{ uri: img }} style={[StyleSheet.absoluteFill, { transform: [{ rotate: `${rotate}deg` }] }]} resizeMode="contain" />
  ) : (
    <Text style={styles.thumbNum}>{index + 1}</Text>
  );
}

function RailThumb({ uri, src, rotate, index, active, onPress }: { uri?: string; src: number | null; rotate: RotateDeg; index: number; active: boolean; onPress: () => void }) {
  const img = useRenderedPage(uri, src ?? -1, 120);
  return (
    <Pressable onPress={onPress} style={[styles.rail, active && styles.railActive]} testID={`rail-${index}`}>
      {src == null ? (
        <View style={styles.thumbBlank}>
          <Feather name="file" size={14} color={C.border} />
        </View>
      ) : img ? (
        <Image source={{ uri: img }} style={[StyleSheet.absoluteFill, { transform: [{ rotate: `${rotate}deg` }] }]} resizeMode="contain" />
      ) : (
        <Text style={styles.railNum}>{index + 1}</Text>
      )}
      <View style={[styles.railBadge, active && styles.railBadgeActive]}>
        <Text style={[styles.railBadgeText, active && styles.railBadgeTextActive]}>{index + 1}</Text>
      </View>
    </Pressable>
  );
}

// ── Draggable primitives ─────────────────────────────────────────────────────
function BackRow({ onPress, title }: { onPress: () => void; title?: string }) {
  return (
    <View style={styles.backRow}>
      <Pressable onPress={onPress} hitSlop={10} style={({ pressed }) => [styles.backBtn, { opacity: pressed ? 0.6 : 1 }]} testID="button-back">
        <Feather name="chevron-left" size={24} color={C.foreground} />
      </Pressable>
      {title ? (
        <Text style={styles.backTitle} numberOfLines={1}>
          {title}
        </Text>
      ) : null}
    </View>
  );
}

/**
 * Finger-draggable, corner-resizable, aspect-locked overlay (image/sign/stamp).
 * Geometry is kept as page fractions so it maps onto the generated PDF. Refs
 * hold the latest value/container so PanResponder callbacks never read stale
 * closures. A near-zero drag is treated as a tap → select.
 */
function DraggableBox({
  container,
  value,
  aspect,
  onChange,
  onInteract,
  onSelect,
  selected,
  interactive = true,
  children,
  minW = 0.08,
}: {
  container: { width: number; height: number };
  value: Placement;
  aspect: number;
  onChange: (p: Placement) => void;
  onInteract?: (active: boolean) => void;
  onSelect?: () => void;
  selected?: boolean;
  interactive?: boolean;
  children: React.ReactNode;
  minW?: number;
}) {
  const vRef = useRef(value);
  vRef.current = value;
  const cRef = useRef(container);
  cRef.current = container;
  const aRef = useRef(aspect);
  aRef.current = aspect;
  const start = useRef<Placement>(value);
  const iRef = useRef(onInteract);
  iRef.current = onInteract;
  const sRef = useRef(onSelect);
  sRef.current = onSelect;

  const move = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onStartShouldSetPanResponderCapture: () => false,
        onMoveShouldSetPanResponder: () => false,
        onMoveShouldSetPanResponderCapture: () => false,
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: () => {
          start.current = { ...vRef.current };
          iRef.current?.(true);
        },
        onPanResponderMove: (_e, g) => {
          const c = cRef.current;
          if (!c.width || !c.height) return;
          const hFrac = (start.current.w * c.width * aRef.current) / c.height;
          const x = clampFrac(start.current.x + g.dx / c.width, 0, Math.max(0, 1 - start.current.w));
          const y = clampFrac(start.current.y + g.dy / c.height, 0, Math.max(0, 1 - hFrac));
          onChange({ x, y, w: start.current.w });
        },
        onPanResponderRelease: (_e, g) => {
          if (Math.abs(g.dx) + Math.abs(g.dy) < 6) sRef.current?.();
          iRef.current?.(false);
        },
        onPanResponderTerminate: () => iRef.current?.(false),
      }),
    [onChange],
  );

  const resize = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onStartShouldSetPanResponderCapture: () => true,
        onMoveShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponderCapture: () => true,
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: () => {
          start.current = { ...vRef.current };
          iRef.current?.(true);
        },
        onPanResponderMove: (_e, g) => {
          const c = cRef.current;
          if (!c.width || !c.height) return;
          const maxW = Math.max(minW, 1 - start.current.x);
          let w = clampFrac(start.current.w + g.dx / c.width, minW, maxW);
          const hFrac = (w * c.width * aRef.current) / c.height;
          if (start.current.y + hFrac > 1 && aRef.current > 0) {
            w = ((1 - start.current.y) * c.height) / (c.width * aRef.current);
          }
          onChange({ x: start.current.x, y: start.current.y, w });
        },
        onPanResponderRelease: () => iRef.current?.(false),
        onPanResponderTerminate: () => iRef.current?.(false),
      }),
    [onChange, minW],
  );

  const boxW = value.w * container.width;
  const boxH = boxW * aspect;
  const moveHandlers = interactive ? move.panHandlers : {};
  return (
    <View
      style={[
        styles.dragBox,
        selected ? styles.dragBoxSelected : null,
        { left: value.x * container.width, top: value.y * container.height, width: boxW, height: boxH },
        WEB_NO_TOUCH_SCROLL,
      ]}
      pointerEvents={interactive ? "auto" : "none"}
      {...moveHandlers}
    >
      {children}
      {interactive && selected ? (
        <View style={[styles.resizeHandle, WEB_NO_TOUCH_SCROLL]} hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }} {...resize.panHandlers}>
          <Feather name="maximize-2" size={12} color="#ffffff" />
        </View>
      ) : null}
    </View>
  );
}

/** Move-only draggable wrapper that auto-sizes to its content (used for text). */
function DragMove({
  container,
  value,
  onChange,
  onInteract,
  onSelect,
  selected,
  interactive = true,
  children,
}: {
  container: { width: number; height: number };
  value: { x: number; y: number };
  onChange: (p: { x: number; y: number }) => void;
  onInteract?: (active: boolean) => void;
  onSelect?: () => void;
  selected?: boolean;
  interactive?: boolean;
  children: React.ReactNode;
}) {
  const vRef = useRef(value);
  vRef.current = value;
  const cRef = useRef(container);
  cRef.current = container;
  const start = useRef(value);
  const iRef = useRef(onInteract);
  iRef.current = onInteract;
  const sRef = useRef(onSelect);
  sRef.current = onSelect;

  const move = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onStartShouldSetPanResponderCapture: () => true,
        onMoveShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponderCapture: () => true,
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: () => {
          start.current = { ...vRef.current };
          iRef.current?.(true);
        },
        onPanResponderMove: (_e, g) => {
          const c = cRef.current;
          if (!c.width || !c.height) return;
          onChange({
            x: clampFrac(start.current.x + g.dx / c.width, 0, 0.95),
            y: clampFrac(start.current.y + g.dy / c.height, 0.02, 0.97),
          });
        },
        onPanResponderRelease: (_e, g) => {
          if (Math.abs(g.dx) + Math.abs(g.dy) < 6) sRef.current?.();
          iRef.current?.(false);
        },
        onPanResponderTerminate: () => iRef.current?.(false),
      }),
    [onChange],
  );

  return (
    <View
      style={[
        styles.dragMove,
        selected ? styles.dragMoveSelected : null,
        { left: value.x * container.width, top: value.y * container.height },
        WEB_NO_TOUCH_SCROLL,
      ]}
      pointerEvents={interactive ? "auto" : "none"}
      {...(interactive ? move.panHandlers : {})}
    >
      {children}
    </View>
  );
}

/** A free move + resize box (rect/ellipse/line/arrow/highlight/whiteout). */
function FreeBox({
  container,
  value,
  onChange,
  onInteract,
  onSelect,
  selected,
  interactive = true,
  children,
  minW = 0.04,
  minH = 0.02,
}: {
  container: { width: number; height: number };
  value: FRect;
  onChange: (p: FRect) => void;
  onInteract?: (active: boolean) => void;
  onSelect?: () => void;
  selected?: boolean;
  interactive?: boolean;
  children: React.ReactNode;
  minW?: number;
  minH?: number;
}) {
  const vRef = useRef(value);
  vRef.current = value;
  const cRef = useRef(container);
  cRef.current = container;
  const start = useRef(value);
  const iRef = useRef(onInteract);
  iRef.current = onInteract;
  const sRef = useRef(onSelect);
  sRef.current = onSelect;

  const move = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onStartShouldSetPanResponderCapture: () => false,
        onMoveShouldSetPanResponder: () => false,
        onMoveShouldSetPanResponderCapture: () => false,
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: () => {
          start.current = { ...vRef.current };
          iRef.current?.(true);
        },
        onPanResponderMove: (_e, g) => {
          const c = cRef.current;
          if (!c.width || !c.height) return;
          const x = clampFrac(start.current.x + g.dx / c.width, 0, Math.max(0, 1 - start.current.w));
          const y = clampFrac(start.current.y + g.dy / c.height, 0, Math.max(0, 1 - start.current.h));
          onChange({ x, y, w: start.current.w, h: start.current.h });
        },
        onPanResponderRelease: (_e, g) => {
          if (Math.abs(g.dx) + Math.abs(g.dy) < 6) sRef.current?.();
          iRef.current?.(false);
        },
        onPanResponderTerminate: () => iRef.current?.(false),
      }),
    [onChange],
  );

  const resize = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onStartShouldSetPanResponderCapture: () => true,
        onMoveShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponderCapture: () => true,
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: () => {
          start.current = { ...vRef.current };
          iRef.current?.(true);
        },
        onPanResponderMove: (_e, g) => {
          const c = cRef.current;
          if (!c.width || !c.height) return;
          const w = clampFrac(start.current.w + g.dx / c.width, minW, 1 - start.current.x);
          const h = clampFrac(start.current.h + g.dy / c.height, minH, 1 - start.current.y);
          onChange({ x: start.current.x, y: start.current.y, w, h });
        },
        onPanResponderRelease: () => iRef.current?.(false),
        onPanResponderTerminate: () => iRef.current?.(false),
      }),
    [onChange, minW, minH],
  );

  return (
    <View
      style={[
        styles.freeBox,
        selected ? styles.freeBoxSelected : null,
        {
          left: value.x * container.width,
          top: value.y * container.height,
          width: value.w * container.width,
          height: value.h * container.height,
        },
        WEB_NO_TOUCH_SCROLL,
      ]}
      pointerEvents={interactive ? "auto" : "none"}
      {...(interactive ? move.panHandlers : {})}
    >
      {children}
      {interactive && selected ? (
        <View style={[styles.resizeHandle, WEB_NO_TOUCH_SCROLL]} hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }} {...resize.panHandlers}>
          <Feather name="maximize-2" size={12} color="#ffffff" />
        </View>
      ) : null}
    </View>
  );
}

/** Crop rectangle: drag the body to move, drag the corner to resize. */
function CropBox({
  container,
  value,
  onChange,
  onInteract,
}: {
  container: { width: number; height: number };
  value: FRect;
  onChange: (p: FRect) => void;
  onInteract?: (active: boolean) => void;
}) {
  const vRef = useRef(value);
  vRef.current = value;
  const cRef = useRef(container);
  cRef.current = container;
  const start = useRef(value);
  const iRef = useRef(onInteract);
  iRef.current = onInteract;
  const MIN = 0.05;

  const move = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onStartShouldSetPanResponderCapture: () => false,
        onMoveShouldSetPanResponder: () => false,
        onMoveShouldSetPanResponderCapture: () => false,
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: () => {
          start.current = { ...vRef.current };
          iRef.current?.(true);
        },
        onPanResponderMove: (_e, g) => {
          const c = cRef.current;
          if (!c.width || !c.height) return;
          const x = clampFrac(start.current.x + g.dx / c.width, 0, Math.max(0, 1 - start.current.w));
          const y = clampFrac(start.current.y + g.dy / c.height, 0, Math.max(0, 1 - start.current.h));
          onChange({ x, y, w: start.current.w, h: start.current.h });
        },
        onPanResponderRelease: () => iRef.current?.(false),
        onPanResponderTerminate: () => iRef.current?.(false),
      }),
    [onChange],
  );

  const resize = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onStartShouldSetPanResponderCapture: () => true,
        onMoveShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponderCapture: () => true,
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: () => {
          start.current = { ...vRef.current };
          iRef.current?.(true);
        },
        onPanResponderMove: (_e, g) => {
          const c = cRef.current;
          if (!c.width || !c.height) return;
          const w = clampFrac(start.current.w + g.dx / c.width, MIN, 1 - start.current.x);
          const h = clampFrac(start.current.h + g.dy / c.height, MIN, 1 - start.current.y);
          onChange({ x: start.current.x, y: start.current.y, w, h });
        },
        onPanResponderRelease: () => iRef.current?.(false),
        onPanResponderTerminate: () => iRef.current?.(false),
      }),
    [onChange],
  );

  return (
    <View
      style={[
        styles.cropFrame,
        {
          left: value.x * container.width,
          top: value.y * container.height,
          width: value.w * container.width,
          height: value.h * container.height,
        },
        WEB_NO_TOUCH_SCROLL,
      ]}
      {...move.panHandlers}
    >
      <View style={[styles.resizeHandle, WEB_NO_TOUCH_SCROLL]} hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }} {...resize.panHandlers}>
        <Feather name="maximize-2" size={12} color="#ffffff" />
      </View>
    </View>
  );
}

/** Watermark overlay — drag to move, corner to resize, text auto-fits the box. */
function WatermarkOverlay({
  container,
  value,
  text,
  opacity,
  onChange,
  onInteract,
}: {
  container: { width: number; height: number };
  value: Placement;
  text: string;
  opacity: number;
  onChange: (p: Placement) => void;
  onInteract?: (active: boolean) => void;
}) {
  const len = Math.max(1, text.length);
  const aspect = Math.max(0.06, Math.min(0.6, 1.45 / len));
  const boxWpx = value.w * container.width;
  const fontSize = Math.max(6, Math.min((boxWpx * 0.9) / (len * 0.78), (boxWpx * aspect) / 1.3));
  return (
    <DraggableBox container={container} value={value} aspect={aspect} onChange={onChange} onInteract={onInteract} selected interactive>
      <Text style={[styles.wmText, { opacity, width: "100%", textAlign: "center", fontSize }]} numberOfLines={1}>
        {text}
      </Text>
    </DraggableBox>
  );
}

const styles = StyleSheet.create({
  backRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
  backBtn: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center", backgroundColor: C.muted },
  backTitle: { flex: 1, fontSize: 16, color: C.foreground, fontFamily: fonts.headingSemibold },

  headerRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 14 },
  iconTile: { width: 44, height: 44, borderRadius: 12, backgroundColor: C.accent, alignItems: "center", justifyContent: "center" },
  fileLabel: { fontSize: 15, color: C.foreground, fontFamily: fonts.headingSemibold },
  fileSub: { fontSize: 12.5, color: C.mutedForeground, fontFamily: fonts.body, marginTop: 2 },

  toolbar: { gap: 8, paddingVertical: 4, paddingRight: 8 },
  toolBtn: { width: 66, paddingVertical: 9, borderRadius: 12, alignItems: "center", gap: 5, backgroundColor: C.muted },
  toolBtnActive: { backgroundColor: C.primary },
  toolLabel: { fontSize: 10.5, color: C.foreground, fontFamily: fonts.bodyMedium },
  toolLabelActive: { color: "#ffffff", fontFamily: fonts.bodySemibold },

  editBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 10, marginBottom: 6 },
  editBarGroup: { flexDirection: "row", alignItems: "center", gap: 8 },
  miniBtn: { width: 38, height: 38, borderRadius: 10, backgroundColor: C.muted, alignItems: "center", justifyContent: "center" },
  miniBtnDisabled: { opacity: 0.5 },
  miniBtnDanger: { backgroundColor: "#fef2f2" },
  pageNavText: { fontSize: 13, color: C.mutedForeground, fontFamily: fonts.bodyMedium, minWidth: 96, textAlign: "center" },

  pageSurface: { gap: 12 },
  page: {
    width: "100%",
    aspectRatio: 1 / 1.414,
    backgroundColor: "#ffffff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    overflow: "hidden",
    shadowColor: "#0f172a",
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  pageFallback: { ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center", gap: 8 },
  blankPage: { ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: "#ffffff" },
  pageFallbackText: { fontSize: 14, color: C.mutedForeground, fontFamily: fonts.bodyMedium },
  loadingSurface: {
    width: "100%",
    aspectRatio: 1 / 1.414,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.card,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingHorizontal: 24,
    marginTop: 12,
  },
  loadingText: { fontSize: 14, color: C.mutedForeground, fontFamily: fonts.bodyMedium },

  dragBox: {
    position: "absolute",
    borderWidth: 1.5,
    borderColor: "transparent",
    borderRadius: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  dragBoxSelected: { borderColor: C.primary, borderStyle: "dashed", backgroundColor: "rgba(247,67,61,0.04)" },
  dragMove: { position: "absolute", paddingHorizontal: 4, paddingVertical: 2, borderWidth: 1.5, borderColor: "transparent", borderRadius: 4 },
  dragMoveSelected: { borderColor: C.primary, borderStyle: "dashed", backgroundColor: "rgba(247,67,61,0.05)" },
  freeBox: { position: "absolute", borderWidth: 1.5, borderColor: "transparent", borderRadius: 2 },
  freeBoxSelected: { borderColor: C.primary, borderStyle: "dashed" },

  stampInner: { ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center", borderRadius: 4 },

  resizeHandle: {
    position: "absolute",
    right: -11,
    bottom: -11,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: C.primary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#ffffff",
  },

  wmText: { fontFamily: fonts.headingBold, color: C.foreground },

  cropFrame: {
    position: "absolute",
    borderWidth: 2,
    borderColor: C.primary,
    borderStyle: "dashed",
    borderRadius: 4,
    backgroundColor: "rgba(247,67,61,0.05)",
  },

  railRow: { gap: 10, paddingVertical: 2 },
  rail: {
    width: 54,
    aspectRatio: 1 / 1.3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  railActive: { borderColor: C.primary, borderWidth: 2 },
  railNum: { fontSize: 14, color: C.mutedForeground, fontFamily: fonts.headingBold },
  railBadge: { position: "absolute", bottom: 2, right: 2, paddingHorizontal: 5, paddingVertical: 1, borderRadius: 6, backgroundColor: "rgba(28,36,52,0.6)" },
  railBadgeActive: { backgroundColor: C.primary },
  railBadgeText: { fontSize: 10, color: "#fff", fontFamily: fonts.bodySemibold },
  railBadgeTextActive: { color: "#fff" },

  pageGrid: { flexDirection: "row", flexWrap: "wrap", gap: 14, justifyContent: "space-between" },
  manageCard: { width: "47%", gap: 8 },
  thumb: {
    width: "100%",
    aspectRatio: 1 / 1.3,
    backgroundColor: "#ffffff",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  thumbActive: { borderColor: C.primary, borderWidth: 2 },
  thumbBlank: { ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center", backgroundColor: "#ffffff" },
  thumbNum: { fontSize: 22, color: C.mutedForeground, fontFamily: fonts.headingBold },
  manageRow: { flexDirection: "row", justifyContent: "space-between", gap: 4 },
  mp: { flex: 1, height: 34, borderRadius: 8, backgroundColor: C.muted, alignItems: "center", justifyContent: "center" },
  mpDisabled: { opacity: 0.5 },

  controlTitle: { fontSize: 15, color: C.foreground, fontFamily: fonts.headingSemibold },
  controlLabel: { fontSize: 13, color: C.mutedForeground, fontFamily: fonts.bodyMedium, marginBottom: 8 },
  controlHelp: { fontSize: 13, color: C.mutedForeground, fontFamily: fonts.body },
  input: {
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: C.foreground,
    fontFamily: fonts.body,
    backgroundColor: C.background,
  },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  swatch: { width: 36, height: 36, borderRadius: 999, borderWidth: 2, borderColor: "transparent" },
  swatchActive: { borderColor: C.foreground },

  selHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  styleBtn: { width: 44, height: 40, borderRadius: 10, backgroundColor: C.muted, alignItems: "center", justifyContent: "center" },
  styleBtnActive: { backgroundColor: C.primary },

  segmented: { flexDirection: "row", gap: 6, backgroundColor: C.muted, borderRadius: 12, padding: 4 },
  segment: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 9, borderRadius: 9 },
  segmentActive: { backgroundColor: C.background },
  segmentText: { fontSize: 13.5, color: C.mutedForeground, fontFamily: fonts.bodyMedium },
  segmentTextActive: { color: C.primary, fontFamily: fonts.bodySemibold },

  toggleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  toggleLabel: { flex: 1, fontSize: 14, color: C.foreground, fontFamily: fonts.bodyMedium },
  toggleTrack: { width: 46, height: 28, borderRadius: 999, backgroundColor: C.border, padding: 3, justifyContent: "center" },
  toggleTrackOn: { backgroundColor: C.primary },
  toggleKnob: { width: 22, height: 22, borderRadius: 999, backgroundColor: "#ffffff" },
  toggleKnobOn: { alignSelf: "flex-end" },

  successWrap: { alignItems: "center", gap: 6 },
  successTitle: { fontSize: 18, color: C.foreground, fontFamily: fonts.headingSemibold },
  outputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: C.muted,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginTop: 12,
    width: "100%",
  },
  outputName: { flex: 1, fontSize: 14, color: C.foreground, fontFamily: fonts.bodyMedium },

  errorText: { fontSize: 13, color: C.destructive, fontFamily: fonts.body, textAlign: "center", marginTop: 12 },

  emptyState: { alignItems: "center", gap: 12, paddingVertical: 60 },
  emptyTitle: { fontSize: 18, color: C.foreground, fontFamily: fonts.headingSemibold },
});
