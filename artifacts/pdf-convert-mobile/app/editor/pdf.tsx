import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Sharing from "expo-sharing";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Image,
  PanResponder,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Svg, { Path } from "react-native-svg";

import ConverterStatusIcon from "@/components/ConverterStatusIcon";
import { Loader } from "@/components/Loader";
import SignaturePad, { type SignatureData } from "@/components/SignaturePad";
import { Badge, Button, Card, Chip, ScreenScroll } from "@/components/ui";
import colors from "@/constants/colors";
import { addHistory } from "@/constants/history";
import { ROUTES } from "@/constants/routes";
import { fonts } from "@/constants/theme";
import { getToolById } from "@/constants/tools";
import { buildEditedPdf, type EditorMode, type Placement } from "@/services/pdfBuilder";
import { getPdfPageCount, getPdfPageSize } from "@/services/pdfDoc";
import { renderPdfPage } from "@/services/pdfRender";

const C = colors.light;
/** Pages to synthesise only when the editor is opened without a source file. */
const PAGE_COUNT = 4;

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
    if (!uri) return;
    renderPdfPage(uri, pageIndex, width)
      .then((u) => alive && setUrl(u))
      .catch(() => alive && setUrl(null));
    return () => {
      alive = false;
    };
  }, [uri, pageIndex, width]);
  return url;
}

const TEXT_COLORS = ["#1c2434", "#f7433d", "#ef4444", "#22c55e", "#f59e0b"];
const FONT_SIZES = [12, 16, 20, 28];
const CROP_PRESETS: { label: string; inset: number }[] = [
  { label: "None", inset: 0 },
  { label: "Trim 5%", inset: 0.05 },
  { label: "Trim 10%", inset: 0.1 },
  { label: "Trim 15%", inset: 0.15 },
];
const WM_OPACITY: { label: string; value: number }[] = [
  { label: "Light", value: 0.12 },
  { label: "Medium", value: 0.22 },
  { label: "Strong", value: 0.38 },
];
const SIGN_FONTS: { label: string; family: string }[] = [
  { label: "Classic", family: fonts.heading },
  { label: "Modern", family: fonts.headingSemibold },
  { label: "Bold", family: fonts.headingBold },
];

interface TextItem {
  id: string;
  page: number;
  text: string;
  size: number;
  color: string;
  x: number;
  y: number;
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
  const mode = tool?.editorMode ?? "edit";
  const fileName = params.name ?? "document.pdf";

  const [page, setPage] = useState(0);

  // Real document info (page count is read from the actual PDF, not hardcoded).
  const [pageCount, setPageCount] = useState<number | null>(params.uri ? null : PAGE_COUNT);
  const [docError, setDocError] = useState<string | null>(null);
  // Height/width of the active page (defaults to A4) so the preview box matches
  // the real page — keeps placed elements aligned with the generated PDF.
  const [pageAspect, setPageAspect] = useState(1.414);

  useEffect(() => {
    let alive = true;
    if (!params.uri) {
      setPageCount(PAGE_COUNT);
      return;
    }
    setPageCount(null);
    setDocError(null);
    getPdfPageCount(params.uri)
      .then((n) => alive && setPageCount(Math.max(1, n)))
      .catch(() => {
        if (!alive) return;
        setPageCount(null);
        setDocError("Could not read this PDF — it may be corrupted or password-protected.");
      });
    return () => {
      alive = false;
    };
  }, [params.uri]);

  // Keep the active page in range when the real count arrives.
  useEffect(() => {
    if (pageCount != null && page > pageCount - 1) setPage(pageCount - 1);
  }, [pageCount, page]);

  // Match the preview box to the real page aspect ratio for accurate placement.
  useEffect(() => {
    let alive = true;
    if (!params.uri) {
      setPageAspect(1.414);
      return;
    }
    getPdfPageSize(params.uri, page)
      .then((s) => {
        if (alive && s.width > 0 && s.height > 0) setPageAspect(s.height / s.width);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [params.uri, page]);

  const pageImage = useRenderedPage(params.uri, page, 620);

  // edit
  const [textValue, setTextValue] = useState("");
  const [fontSize, setFontSize] = useState(16);
  const [color, setColor] = useState(TEXT_COLORS[0]);
  const [items, setItems] = useState<TextItem[]>([]);

  // crop — a free rectangle as page fractions (top-left origin)
  const [cropRect, setCropRect] = useState<Placement & { h: number }>({
    x: 0.1,
    y: 0.1,
    w: 0.8,
    h: 0.8,
  });

  // sign
  const [signMode, setSignMode] = useState<"type" | "draw">("type");
  const [signName, setSignName] = useState("");
  const [signFont, setSignFont] = useState(SIGN_FONTS[0].family);
  const [signDraw, setSignDraw] = useState<SignatureData | null>(null);
  const [signPos, setSignPos] = useState<Placement>({ x: 0.55, y: 0.78, w: 0.4 });

  // watermark
  const [wmText, setWmText] = useState("CONFIDENTIAL");
  const [wmOpacity, setWmOpacity] = useState(0.22);
  const [wmPos, setWmPos] = useState<Placement>({ x: 0.15, y: 0.42, w: 0.7 });
  // Measured width-per-point of the watermark text (set by a hidden measuring
  // <Text>), so the box/font sizing fits the real glyphs instead of a guess.
  const [wmUnit, setWmUnit] = useState(8);

  // add-image
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageAspect, setImageAspect] = useState(1);
  const [imgPos, setImgPos] = useState<Placement>({ x: 0.3, y: 0.35, w: 0.4 });

  // On-screen size of the page preview (px), used to map gestures to the page.
  const [pageBox, setPageBox] = useState({ width: 0, height: 0 });

  // delete-pages
  const [deleted, setDeleted] = useState<Set<number>>(new Set());

  const [saved, setSaved] = useState<{ uri: string; name: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const goBack = useCallback(() => {
    if (router.canGoBack()) router.back();
    else router.replace(ROUTES.tools as never);
  }, [router]);

  const meta = useMemo(() => {
    const map: Record<string, { title: string; icon: keyof typeof Feather.glyphMap; action: string }> = {
      edit: { title: "Edit PDF", icon: "edit-2", action: "Save edited PDF" },
      crop: { title: "Crop PDF", icon: "crop", action: "Crop & save" },
      sign: { title: "Sign PDF", icon: "edit-3", action: "Sign & save" },
      watermark: { title: "Add Watermark", icon: "award", action: "Apply watermark" },
      "add-image": { title: "Add Image to PDF", icon: "image", action: "Place & save" },
      "delete-pages": { title: "Delete Pages", icon: "file-minus", action: "Save updated PDF" },
    };
    return map[mode] ?? map.edit;
  }, [mode]);

  // Height/width ratio of the signature box, used to size the draggable overlay.
  const signAspect =
    signMode === "draw"
      ? signDraw && signDraw.width > 0
        ? signDraw.height / signDraw.width
        : 0.4
      : Math.max(0.12, Math.min(0.6, 2 / Math.max(1, signName.trim().length)));

  // Aspect (height/width) of the watermark box. `wmUnit` is the measured text
  // width at font size 1, so font size = boxW * wmAspect makes the rendered text
  // width = wmUnit * fontSize = 0.8 * boxW — i.e. it always fits the box width
  // with a small margin, on both native and web (adjustsFontSizeToFit is
  // web-unsupported, so we cannot rely on it).
  const wmAspect = Math.max(0.04, Math.min(0.6, 0.8 / Math.max(1, wmUnit)));

  // Snap the watermark box to one of nine anchor positions, keeping its size.
  const placeWatermark = useCallback(
    (cx: number, cy: number) => {
      setWmPos((p) => {
        const hFrac =
          pageBox.height > 0
            ? (p.w * pageBox.width * wmAspect) / pageBox.height
            : 0.12;
        const m = 0.03;
        const maxX = Math.max(0, 1 - p.w);
        const maxY = Math.max(0, 1 - hFrac);
        const x = Math.min(maxX, Math.max(0, cx * (1 - p.w - m * 2) + m));
        const y = Math.min(maxY, Math.max(0, cy * (1 - hFrac - m * 2) + m));
        return { ...p, x, y };
      });
    },
    [pageBox, wmAspect],
  );

  const addTextItem = useCallback(() => {
    const t = textValue.trim();
    if (!t) return;
    setItems((prev) => {
      const onPage = prev.filter((it) => it.page === page).length;
      return [
        ...prev,
        {
          id: `t_${Date.now()}`,
          page,
          text: t,
          size: fontSize,
          color,
          x: 0.08,
          y: Math.min(0.85, 0.08 + onPage * 0.08),
        },
      ];
    });
    setTextValue("");
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [textValue, page, fontSize, color]);

  const pickImage = useCallback(async () => {
    setError(null);
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      setError("Photo library access is required to add an image.");
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 1,
    });
    if (res.canceled) return;
    const picked = res.assets[0]?.uri;
    if (!picked) return;
    // Normalize to JPEG so pdf-lib can always embed it (iOS may hand back
    // HEIC/HEIF or other formats pdf-lib cannot parse).
    try {
      const rendered = await ImageManipulator.manipulate(picked).renderAsync();
      const out = await rendered.saveAsync({ format: SaveFormat.JPEG, compress: 0.92 });
      setImageUri(out.uri);
      if (out.width > 0 && out.height > 0) setImageAspect(out.height / out.width);
    } catch {
      setImageUri(picked);
    }
  }, []);

  const toggleDeleted = useCallback((idx: number) => {
    setDeleted((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  }, []);

  const save = useCallback(async () => {
    if (!tool) return;
    setError(null);
    try {
      const name = `${stripExt(fileName)}-${mode}.pdf`;
      const uri = await buildEditedPdf({
        mode: mode as EditorMode,
        srcUri: params.uri,
        outName: name,
        fallbackPageCount: PAGE_COUNT,
        activePage: page,
        textItems: items.map((it) => ({
          page: it.page,
          text: it.text,
          size: it.size,
          color: it.color,
          x: it.x,
          y: it.y,
        })),
        cropRect,
        signName: signMode === "type" ? signName : "",
        signFont,
        signDraw: signMode === "draw" ? signDraw ?? undefined : undefined,
        signPlace: signPos,
        wmText,
        wmOpacity,
        wmPlace: wmPos,
        imageUri: imageUri ?? undefined,
        imagePlace: imgPos,
        deletedPages: Array.from(deleted),
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
  }, [
    tool,
    fileName,
    mode,
    items,
    cropRect,
    signMode,
    signName,
    signFont,
    signDraw,
    signPos,
    wmText,
    wmOpacity,
    wmPos,
    imageUri,
    imgPos,
    deleted,
    page,
    params.uri,
  ]);

  const onShare = useCallback(async () => {
    if (!saved) return;
    try {
      const ok = await shareFile(saved.uri, saved.name);
      if (!ok) setError("Sharing isn't available on this platform.");
    } catch {
      setError("Could not open the share sheet.");
    }
  }, [saved]);

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
        <BackRow onPress={goBack} title={meta.title} />
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

  return (
    <ScreenScroll insetTop>
      <BackRow onPress={goBack} title={meta.title} />

      <View style={styles.headerRow}>
        <View style={styles.iconTile}>
          <Feather name={meta.icon} size={20} color={C.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.fileLabel} numberOfLines={1} testID="text-filename">
            {fileName}
          </Text>
          <Text style={styles.fileSub}>{tool.description}</Text>
        </View>
      </View>

      {/* Page preview surface */}
      {pageCount == null ? (
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
      ) : mode === "delete-pages" ? (
        <View style={styles.pageGrid}>
          {Array.from({ length: pageCount }).map((_, i) => (
            <DeleteThumb
              key={i}
              uri={params.uri}
              index={i}
              deleted={deleted.has(i)}
              onToggle={() => toggleDeleted(i)}
            />
          ))}
        </View>
      ) : (
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
            {/* real rasterised page (web) or a clean frame fallback */}
            {pageImage ? (
              <Image
                source={{ uri: pageImage }}
                style={StyleSheet.absoluteFill}
                resizeMode="contain"
              />
            ) : (
              <View style={styles.pageFallback} pointerEvents="none">
                <Feather name="file-text" size={38} color={C.mutedForeground} />
                <Text style={styles.pageFallbackText}>Page {page + 1}</Text>
              </View>
            )}

            {/* edit overlays — each text box can be dragged to position */}
            {mode === "edit" &&
              pageBox.width > 0 &&
              items
                .filter((it) => it.page === page)
                .map((it) => (
                  <DragMove
                    key={it.id}
                    container={pageBox}
                    value={{ x: it.x, y: it.y }}
                    onChange={(pos) =>
                      setItems((prev) =>
                        prev.map((p) =>
                          p.id === it.id ? { ...p, x: pos.x, y: pos.y } : p,
                        ),
                      )
                    }
                  >
                    <Text
                      style={[
                        styles.overlayText,
                        { color: it.color, fontSize: it.size },
                      ]}
                      numberOfLines={1}
                    >
                      {it.text}
                    </Text>
                  </DragMove>
                ))}

            {/* hidden text used only to measure the real glyph width */}
            {mode === "watermark" && (
              <View
                style={styles.wmMeasure}
                pointerEvents="none"
                aria-hidden
              >
                <Text
                  style={{
                    fontFamily: fonts.headingBold,
                    fontSize: 100,
                    letterSpacing: 0,
                  }}
                  onLayout={(e) => {
                    const w = e.nativeEvent.layout.width;
                    if (w > 0) setWmUnit(w / 100);
                  }}
                >
                  {wmText || "WATERMARK"}
                </Text>
              </View>
            )}

            {/* watermark overlay — drag to move, corner to resize */}
            {mode === "watermark" && pageBox.width > 0 && (
              <DraggableBox
                container={pageBox}
                value={wmPos}
                aspect={wmAspect}
                onChange={setWmPos}
              >
                <Text
                  style={[
                    styles.wmText,
                    {
                      opacity: wmOpacity,
                      transform: [{ rotate: "0deg" }],
                      letterSpacing: 0,
                      width: "100%",
                      textAlign: "center",
                      fontSize: Math.max(8, wmPos.w * pageBox.width * wmAspect),
                    },
                  ]}
                  numberOfLines={1}
                >
                  {wmText || "WATERMARK"}
                </Text>
              </DraggableBox>
            )}

            {/* signature overlay — typed (drag to move, corner to resize) */}
            {mode === "sign" && signMode === "type" && signName.trim() && pageBox.width > 0 ? (
              <DraggableBox
                container={pageBox}
                value={signPos}
                aspect={signAspect}
                onChange={setSignPos}
              >
                <Text
                  style={[
                    styles.signFill,
                    {
                      fontFamily: signFont,
                      // react-native-web ignores adjustsFontSizeToFit, so size the
                      // text from the box height (box H = box W * signAspect).
                      fontSize: Math.max(
                        8,
                        signPos.w * pageBox.width * signAspect,
                      ),
                    },
                  ]}
                  numberOfLines={1}
                >
                  {signName}
                </Text>
              </DraggableBox>
            ) : null}

            {/* signature overlay — drawn (drag to move, corner to resize) */}
            {mode === "sign" &&
            signMode === "draw" &&
            signDraw &&
            signDraw.paths.length &&
            pageBox.width > 0 ? (
              <DraggableBox
                container={pageBox}
                value={signPos}
                aspect={signAspect}
                onChange={setSignPos}
              >
                <Svg
                  width="100%"
                  height="100%"
                  viewBox={`0 0 ${signDraw.width} ${signDraw.height}`}
                  preserveAspectRatio="none"
                  style={{ pointerEvents: "none" }}
                >
                  {signDraw.paths.map((d, i) => (
                    <Path
                      key={i}
                      d={d}
                      stroke={C.foreground}
                      strokeWidth={2.5}
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  ))}
                </Svg>
              </DraggableBox>
            ) : null}

            {/* add-image overlay (drag to move, corner to resize) */}
            {mode === "add-image" && imageUri && pageBox.width > 0 ? (
              <DraggableBox
                container={pageBox}
                value={imgPos}
                aspect={imageAspect}
                onChange={setImgPos}
              >
                <Image
                  source={{ uri: imageUri }}
                  style={StyleSheet.absoluteFill}
                  resizeMode="contain"
                />
              </DraggableBox>
            ) : null}

            {/* crop frame — drag to move, drag the corner to resize */}
            {mode === "crop" && pageBox.width > 0 && (
              <CropBox
                container={pageBox}
                value={cropRect}
                onChange={setCropRect}
              />
            )}
          </View>

          {/* page navigation */}
          <View style={styles.pageNav}>
            <Pressable
              onPress={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              style={({ pressed }) => [styles.navBtn, { opacity: page === 0 ? 0.4 : pressed ? 0.6 : 1 }]}
              testID="button-prev-page"
            >
              <Feather name="chevron-left" size={18} color={C.foreground} />
            </Pressable>
            <Text style={styles.pageNavText}>
              Page {page + 1} of {pageCount}
            </Text>
            <Pressable
              onPress={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
              disabled={page === pageCount - 1}
              style={({ pressed }) => [
                styles.navBtn,
                { opacity: page === pageCount - 1 ? 0.4 : pressed ? 0.6 : 1 },
              ]}
              testID="button-next-page"
            >
              <Feather name="chevron-right" size={18} color={C.foreground} />
            </Pressable>
          </View>
        </View>
      )}

      {/* Mode controls */}
      <Card style={{ marginTop: 18 }}>
        {mode === "edit" && (
          <View style={{ gap: 14 }}>
            <Text style={styles.controlTitle}>Add text</Text>
            <TextInput
              value={textValue}
              onChangeText={setTextValue}
              placeholder="Type text to place on the page…"
              placeholderTextColor={C.mutedForeground}
              style={styles.input}
              testID="input-text"
            />
            <View>
              <Text style={styles.controlLabel}>Size</Text>
              <View style={styles.chipRow}>
                {FONT_SIZES.map((s) => (
                  <Chip key={s} label={`${s}px`} active={fontSize === s} onPress={() => setFontSize(s)} />
                ))}
              </View>
            </View>
            <View>
              <Text style={styles.controlLabel}>Colour</Text>
              <View style={styles.chipRow}>
                {TEXT_COLORS.map((c) => (
                  <Pressable
                    key={c}
                    onPress={() => setColor(c)}
                    style={[
                      styles.swatch,
                      { backgroundColor: c },
                      color === c && styles.swatchActive,
                    ]}
                    testID={`swatch-${c}`}
                  />
                ))}
              </View>
            </View>
            <Button label="Add text box" icon="plus" variant="outline" fullWidth onPress={addTextItem} testID="button-add-text" />
            {items.length > 0 && (
              <Badge label={`${items.length} text box${items.length !== 1 ? "es" : ""} added`} tone="success" />
            )}
          </View>
        )}

        {mode === "crop" && (
          <View style={{ gap: 14 }}>
            <Text style={styles.controlTitle}>Crop area</Text>
            <Text style={styles.controlHelp}>
              Drag the frame to move it and drag the corner handle to resize, or
              pick a quick margin below. The same area is cropped on every page.
            </Text>
            <View style={styles.chipRow}>
              {CROP_PRESETS.map((p) => {
                const rect =
                  p.inset === 0
                    ? { x: 0, y: 0, w: 1, h: 1 }
                    : {
                        x: p.inset,
                        y: p.inset,
                        w: 1 - p.inset * 2,
                        h: 1 - p.inset * 2,
                      };
                const active =
                  Math.abs(cropRect.x - rect.x) < 0.001 &&
                  Math.abs(cropRect.y - rect.y) < 0.001 &&
                  Math.abs(cropRect.w - rect.w) < 0.001 &&
                  Math.abs(cropRect.h - rect.h) < 0.001;
                return (
                  <Chip
                    key={p.label}
                    label={p.label}
                    active={active}
                    onPress={() => setCropRect(rect)}
                  />
                );
              })}
            </View>
          </View>
        )}

        {mode === "sign" && (
          <View style={{ gap: 14 }}>
            <View style={styles.segmented}>
              <Pressable
                onPress={() => setSignMode("draw")}
                style={[styles.segment, signMode === "draw" && styles.segmentActive]}
                testID="button-sign-draw"
              >
                <Feather
                  name="edit-2"
                  size={15}
                  color={signMode === "draw" ? C.primary : C.mutedForeground}
                />
                <Text style={[styles.segmentText, signMode === "draw" && styles.segmentTextActive]}>
                  Draw
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setSignMode("type")}
                style={[styles.segment, signMode === "type" && styles.segmentActive]}
                testID="button-sign-type"
              >
                <Feather
                  name="type"
                  size={15}
                  color={signMode === "type" ? C.primary : C.mutedForeground}
                />
                <Text style={[styles.segmentText, signMode === "type" && styles.segmentTextActive]}>
                  Type
                </Text>
              </Pressable>
            </View>

            {signMode === "draw" ? (
              <View style={{ gap: 6 }}>
                <Text style={styles.controlTitle}>Draw your signature</Text>
                <SignaturePad onChange={setSignDraw} />
              </View>
            ) : (
              <>
                <Text style={styles.controlTitle}>Type your signature</Text>
                <TextInput
                  value={signName}
                  onChangeText={setSignName}
                  placeholder="Your name"
                  placeholderTextColor={C.mutedForeground}
                  style={[styles.input, { fontFamily: signFont, fontSize: 18 }]}
                  testID="input-signature"
                />
                <View>
                  <Text style={styles.controlLabel}>Style</Text>
                  <View style={styles.chipRow}>
                    {SIGN_FONTS.map((f) => (
                      <Chip
                        key={f.label}
                        label={f.label}
                        active={signFont === f.family}
                        onPress={() => setSignFont(f.family)}
                      />
                    ))}
                  </View>
                </View>
              </>
            )}

            <Text style={styles.controlHelp}>
              Drag the signature to move it, and drag the corner handle to
              resize.
            </Text>
          </View>
        )}

        {mode === "watermark" && (
          <View style={{ gap: 14 }}>
            <Text style={styles.controlTitle}>Watermark text</Text>
            <TextInput
              value={wmText}
              onChangeText={setWmText}
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
                  <Chip
                    key={o.label}
                    label={o.label}
                    active={wmOpacity === o.value}
                    onPress={() => setWmOpacity(o.value)}
                  />
                ))}
              </View>
            </View>
            <View>
              <Text style={styles.controlLabel}>Position</Text>
              <View style={styles.wmGrid}>
                {[0, 0.5, 1].map((cy) => (
                  <View key={cy} style={styles.wmGridRow}>
                    {[0, 0.5, 1].map((cx) => (
                      <Pressable
                        key={cx}
                        onPress={() => placeWatermark(cx, cy)}
                        style={styles.wmGridBtn}
                        testID={`wm-pos-${cx}-${cy}`}
                      >
                        <View style={styles.wmGridDot} />
                      </Pressable>
                    ))}
                  </View>
                ))}
              </View>
            </View>
            <Text style={styles.controlHelp}>
              Tap a position, or drag the watermark to move it and drag the
              corner handle to resize.
            </Text>
          </View>
        )}

        {mode === "add-image" && (
          <View style={{ gap: 14 }}>
            <Text style={styles.controlTitle}>Place an image</Text>
            <Button
              label={imageUri ? "Replace image" : "Choose image"}
              icon="image"
              variant="outline"
              fullWidth
              onPress={pickImage}
              testID="button-pick-image"
            />
            {imageUri && (
              <View>
                <Text style={styles.controlLabel}>Size</Text>
                <View style={styles.chipRow}>
                  {[0.25, 0.4, 0.6, 0.8].map((s) => (
                    <Chip
                      key={s}
                      label={`${Math.round(s * 100)}%`}
                      active={Math.abs(imgPos.w - s) < 0.001}
                      onPress={() =>
                        setImgPos((p) => ({ ...p, w: Math.min(s, 1 - p.x) }))
                      }
                    />
                  ))}
                </View>
                <Text style={styles.controlHelp}>
                  Drag the image to move it; drag the corner handle to resize.
                </Text>
              </View>
            )}
          </View>
        )}

        {mode === "delete-pages" && (
          <View style={{ gap: 10 }}>
            <Text style={styles.controlTitle}>Select pages to delete</Text>
            <Text style={styles.controlHelp}>
              Tap a page to mark it for removal. {deleted.size} of {pageCount ?? 0} selected.
            </Text>
          </View>
        )}
      </Card>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <View style={{ marginTop: 18 }}>
        <Button label={meta.action} icon="save" fullWidth onPress={save} testID="button-save" />
      </View>
    </ScreenScroll>
  );
}

function DeleteThumb({
  uri,
  index,
  deleted,
  onToggle,
}: {
  uri?: string;
  index: number;
  deleted: boolean;
  onToggle: () => void;
}) {
  const img = useRenderedPage(uri, index, 260);
  return (
    <Pressable onPress={onToggle} style={styles.thumbWrap} testID={`thumb-page-${index + 1}`}>
      <View style={[styles.thumb, deleted && styles.thumbDeleted]}>
        {img ? (
          <Image source={{ uri: img }} style={StyleSheet.absoluteFill} resizeMode="contain" />
        ) : (
          <Text style={styles.thumbNum}>{index + 1}</Text>
        )}
        {deleted && (
          <View style={styles.thumbBadge}>
            <Feather name="trash-2" size={16} color={C.destructiveForeground} />
          </View>
        )}
      </View>
      <Text style={styles.thumbLabel}>Page {index + 1}</Text>
    </Pressable>
  );
}

function BackRow({ onPress, title }: { onPress: () => void; title?: string }) {
  return (
    <View style={styles.backRow}>
      <Pressable
        onPress={onPress}
        hitSlop={10}
        style={({ pressed }) => [styles.backBtn, { opacity: pressed ? 0.6 : 1 }]}
        testID="button-back"
      >
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

function clampFrac(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

/**
 * A finger-draggable, corner-resizable overlay used to position signatures and
 * images on the page preview. All geometry is kept as fractions of the page
 * (`Placement`) so it maps directly onto the generated PDF. Refs hold the latest
 * value/container so PanResponder callbacks never read stale closures.
 */
function DraggableBox({
  container,
  value,
  aspect,
  onChange,
  children,
  minW = 0.08,
}: {
  container: { width: number; height: number };
  value: Placement;
  aspect: number;
  onChange: (p: Placement) => void;
  children: React.ReactNode;
  minW?: number;
}) {
  const vRef = React.useRef(value);
  vRef.current = value;
  const cRef = React.useRef(container);
  cRef.current = container;
  const aRef = React.useRef(aspect);
  aRef.current = aspect;
  const start = React.useRef<Placement>(value);

  const move = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: () => {
          start.current = { ...vRef.current };
        },
        onPanResponderMove: (_e, g) => {
          const c = cRef.current;
          if (!c.width || !c.height) return;
          const hFrac = (start.current.w * c.width * aRef.current) / c.height;
          const x = clampFrac(
            start.current.x + g.dx / c.width,
            0,
            Math.max(0, 1 - start.current.w),
          );
          const y = clampFrac(
            start.current.y + g.dy / c.height,
            0,
            Math.max(0, 1 - hFrac),
          );
          onChange({ x, y, w: start.current.w });
        },
      }),
    [onChange],
  );

  const resize = useMemo(
    () =>
      PanResponder.create({
        // Claim the gesture on the handle and never let the parent "move"
        // responder steal it (that bug made the corner handle only pan).
        onStartShouldSetPanResponder: () => true,
        onStartShouldSetPanResponderCapture: () => true,
        onMoveShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponderCapture: () => true,
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: () => {
          start.current = { ...vRef.current };
        },
        onPanResponderMove: (_e, g) => {
          const c = cRef.current;
          if (!c.width || !c.height) return;
          const maxW = Math.max(minW, 1 - start.current.x);
          let w = clampFrac(start.current.w + g.dx / c.width, minW, maxW);
          // Keep the box inside the bottom edge as it grows.
          const hFrac = (w * c.width * aRef.current) / c.height;
          if (start.current.y + hFrac > 1 && aRef.current > 0) {
            w = ((1 - start.current.y) * c.height) / (c.width * aRef.current);
          }
          onChange({ x: start.current.x, y: start.current.y, w });
        },
      }),
    [onChange, minW],
  );

  const boxW = value.w * container.width;
  const boxH = boxW * aspect;
  return (
    <View
      style={[
        styles.dragBox,
        {
          left: value.x * container.width,
          top: value.y * container.height,
          width: boxW,
          height: boxH,
        },
      ]}
      {...move.panHandlers}
    >
      {children}
      <View
        style={styles.resizeHandle}
        hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}
        {...resize.panHandlers}
      >
        <Feather name="maximize-2" size={12} color="#ffffff" />
      </View>
    </View>
  );
}

/** A move-only draggable wrapper that auto-sizes to its content (used for text). */
function DragMove({
  container,
  value,
  onChange,
  children,
}: {
  container: { width: number; height: number };
  value: { x: number; y: number };
  onChange: (p: { x: number; y: number }) => void;
  children: React.ReactNode;
}) {
  const vRef = React.useRef(value);
  vRef.current = value;
  const cRef = React.useRef(container);
  cRef.current = container;
  const start = React.useRef(value);

  const move = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: () => {
          start.current = { ...vRef.current };
        },
        onPanResponderMove: (_e, g) => {
          const c = cRef.current;
          if (!c.width || !c.height) return;
          onChange({
            x: clampFrac(start.current.x + g.dx / c.width, 0, 0.9),
            y: clampFrac(start.current.y + g.dy / c.height, 0.02, 0.96),
          });
        },
      }),
    [onChange],
  );

  return (
    <View
      style={[
        styles.dragMove,
        { left: value.x * container.width, top: value.y * container.height },
      ]}
      {...move.panHandlers}
    >
      {children}
    </View>
  );
}

/** A free crop rectangle: drag the body to move, drag the corner to resize. */
function CropBox({
  container,
  value,
  onChange,
}: {
  container: { width: number; height: number };
  value: { x: number; y: number; w: number; h: number };
  onChange: (p: { x: number; y: number; w: number; h: number }) => void;
}) {
  const vRef = React.useRef(value);
  vRef.current = value;
  const cRef = React.useRef(container);
  cRef.current = container;
  const start = React.useRef(value);
  const MIN = 0.12;

  const move = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: () => {
          start.current = { ...vRef.current };
        },
        onPanResponderMove: (_e, g) => {
          const c = cRef.current;
          if (!c.width || !c.height) return;
          const x = clampFrac(
            start.current.x + g.dx / c.width,
            0,
            Math.max(0, 1 - start.current.w),
          );
          const y = clampFrac(
            start.current.y + g.dy / c.height,
            0,
            Math.max(0, 1 - start.current.h),
          );
          onChange({ x, y, w: start.current.w, h: start.current.h });
        },
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
        },
        onPanResponderMove: (_e, g) => {
          const c = cRef.current;
          if (!c.width || !c.height) return;
          const w = clampFrac(
            start.current.w + g.dx / c.width,
            MIN,
            1 - start.current.x,
          );
          const h = clampFrac(
            start.current.h + g.dy / c.height,
            MIN,
            1 - start.current.y,
          );
          onChange({ x: start.current.x, y: start.current.y, w, h });
        },
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
      ]}
      {...move.panHandlers}
    >
      <View
        style={styles.resizeHandle}
        hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}
        {...resize.panHandlers}
      >
        <Feather name="maximize-2" size={12} color="#ffffff" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  backRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.muted,
  },
  backTitle: { flex: 1, fontSize: 16, color: C.foreground, fontFamily: fonts.headingSemibold },

  headerRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 16 },
  iconTile: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: C.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  fileLabel: { fontSize: 15, color: C.foreground, fontFamily: fonts.headingSemibold },
  fileSub: { fontSize: 12.5, color: C.mutedForeground, fontFamily: fonts.body, marginTop: 2 },

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
  },
  loadingText: { fontSize: 14, color: C.mutedForeground, fontFamily: fonts.bodyMedium },
  dragBox: {
    position: "absolute",
    borderWidth: 1.5,
    borderColor: C.primary,
    borderStyle: "dashed",
    borderRadius: 4,
    backgroundColor: "rgba(247,67,61,0.04)",
    alignItems: "center",
    justifyContent: "center",
  },
  signFill: {
    width: "100%",
    textAlign: "center",
    color: C.foreground,
  },
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
  segmented: {
    flexDirection: "row",
    gap: 6,
    backgroundColor: C.muted,
    borderRadius: 12,
    padding: 4,
  },
  segment: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 9,
    borderRadius: 9,
  },
  segmentActive: { backgroundColor: C.background },
  segmentText: { fontSize: 13.5, color: C.mutedForeground, fontFamily: fonts.bodyMedium },
  segmentTextActive: { color: C.primary, fontFamily: fonts.bodySemibold },
  dragMove: { position: "absolute", paddingHorizontal: 4, paddingVertical: 2 },
  overlayText: { fontFamily: fonts.bodySemibold },
  wmWrap: { ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center" },
  wmMeasure: {
    position: "absolute",
    left: -9999,
    top: 0,
    opacity: 0,
    alignItems: "flex-start",
  },
  wmText: {
    fontSize: 34,
    fontFamily: fonts.headingBold,
    color: C.foreground,
    transform: [{ rotate: "-32deg" }],
    letterSpacing: 2,
  },
  wmGrid: { gap: 6 },
  wmGridRow: { flexDirection: "row", gap: 6 },
  wmGridBtn: {
    flex: 1,
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.background,
    alignItems: "center",
    justifyContent: "center",
  },
  wmGridDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: C.primary,
  },
  cropFrame: {
    position: "absolute",
    borderWidth: 2,
    borderColor: C.primary,
    borderStyle: "dashed",
    borderRadius: 4,
    backgroundColor: "rgba(247,67,61,0.05)",
  },

  pageNav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  navBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: C.muted,
    alignItems: "center",
    justifyContent: "center",
  },
  pageNavText: { fontSize: 13, color: C.mutedForeground, fontFamily: fonts.bodyMedium, minWidth: 110, textAlign: "center" },

  pageGrid: { flexDirection: "row", flexWrap: "wrap", gap: 14, justifyContent: "space-between" },
  thumbWrap: { width: "47%", gap: 6 },
  thumb: {
    width: "100%",
    aspectRatio: 1 / 1.3,
    backgroundColor: "#ffffff",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: "center",
    justifyContent: "center",
  },
  thumbDeleted: { borderColor: C.destructive, backgroundColor: "#fef2f2", opacity: 0.7 },
  thumbNum: { fontSize: 22, color: C.mutedForeground, fontFamily: fonts.headingBold },
  thumbBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 999,
    backgroundColor: C.destructive,
    alignItems: "center",
    justifyContent: "center",
  },
  thumbLabel: { fontSize: 12.5, color: C.foreground, fontFamily: fonts.bodyMedium, textAlign: "center" },

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

  successWrap: { alignItems: "center", gap: 6 },
  successIcon: {
    width: 64,
    height: 64,
    borderRadius: 999,
    backgroundColor: "#dcfce7",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
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
