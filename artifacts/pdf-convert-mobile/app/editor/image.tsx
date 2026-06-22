import { Feather } from "@expo/vector-icons";
import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Image,
  PanResponder,
  Platform,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
  type ViewStyle,
} from "react-native";

import ConverterStatusIcon from "@/components/ConverterStatusIcon";
import DownloadFormatModal from "@/components/DownloadFormatModal";
import { Badge, Button, Card, Chip, ScreenScroll } from "@/components/ui";
import colors from "@/constants/colors";
import { addHistory } from "@/constants/history";
import { ROUTES } from "@/constants/routes";
import { fonts } from "@/constants/theme";
import { getToolById } from "@/constants/tools";
import { getDownloadFormats, prepareDownloadUri } from "@/services/downloadFormats";
import { saveFile } from "@/services/files";

const C = colors.light;

// On web the browser locks in `touch-action` at touchstart, so toggling
// `scrollEnabled` mid-gesture can't stop a scroll that already began. Setting
// `touch-action: none` statically on the draggable elements stops the browser
// from ever starting a page scroll from a touch that begins on them.
const WEB_NO_TOUCH_SCROLL =
  Platform.OS === "web" ? ({ touchAction: "none" } as unknown as ViewStyle) : null;

const CROP_ASPECTS: { label: string; value: number | undefined }[] = [
  { label: "Free", value: undefined },
  { label: "1:1", value: 1 },
  { label: "4:3", value: 4 / 3 },
  { label: "16:9", value: 16 / 9 },
];

function stripExt(name: string): string {
  return name.replace(/\.[^./]+$/, "") || "image";
}
function extOf(name: string): string {
  const m = name.toLowerCase().match(/\.[^./]+$/);
  return m ? m[0] : ".png";
}
interface CropRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

function clampFrac(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

/**
 * Converts the on-screen crop rectangle (fractions of the image) into a real
 * pixel-space crop rect on the original image.
 */
function computeCropRect(
  w: number,
  h: number,
  rect: CropRect,
): { originX: number; originY: number; width: number; height: number } {
  const originX = Math.max(0, Math.round(rect.x * w));
  const originY = Math.max(0, Math.round(rect.y * h));
  return {
    originX,
    originY,
    width: Math.max(1, Math.min(w - originX, Math.round(rect.w * w))),
    height: Math.max(1, Math.min(h - originY, Math.round(rect.h * h))),
  };
}

/** Largest centered crop rect (in image fractions) matching an aspect ratio. */
function cropRectForAspect(
  w: number,
  h: number,
  a: number | undefined,
): CropRect {
  if (!a || !w || !h) return { x: 0.05, y: 0.05, w: 0.9, h: 0.9 };
  const origRatio = w / h;
  let cw: number;
  let ch: number;
  if (a >= origRatio) {
    cw = w;
    ch = w / a;
  } else {
    ch = h;
    cw = h * a;
  }
  return { x: (w - cw) / 2 / w, y: (h - ch) / 2 / h, w: cw / w, h: ch / h };
}

export default function ImageEditorScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ toolId?: string; uri?: string; name?: string }>();
  const tool = getToolById(params.toolId);
  const mode = tool?.editorMode ?? "resize";
  const uri = params.uri;
  const fileName = params.name ?? "image.png";

  const [origW, setOrigW] = useState(0);
  const [origH, setOrigH] = useState(0);

  // resize
  const [width, setWidth] = useState("");
  const [height, setHeight] = useState("");
  const [lock, setLock] = useState(true);

  // crop — free draggable + resizable rectangle (fractions of the image)
  const [cropRect, setCropRect] = useState<CropRect>({ x: 0.1, y: 0.1, w: 0.8, h: 0.8 });
  const [surf, setSurf] = useState(0);
  // True while the user is dragging the crop box, so we freeze page scrolling.
  const [interacting, setInteracting] = useState(false);

  // rotate
  const [angle, setAngle] = useState(0);

  const [saved, setSaved] = useState<{ uri: string; name: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [downloadOpen, setDownloadOpen] = useState(false);
  const [dlFormat, setDlFormat] = useState<string>("");
  const [dlName, setDlName] = useState("");
  const [dlBusy, setDlBusy] = useState(false);
  const pendingActionRef = useRef<(() => void | Promise<void>) | null>(null);

  // The displayed (contained) image box inside the square preview surface, so the
  // crop rectangle maps directly onto image pixels despite letterboxing.
  const imgBox = useMemo(() => {
    if (!surf || !origW || !origH) return null;
    const r = origW / origH;
    let w = surf;
    let h = surf;
    if (r >= 1) h = surf / r;
    else w = surf * r;
    return { left: (surf - w) / 2, top: (surf - h) / 2, width: w, height: h };
  }, [surf, origW, origH]);

  useEffect(() => {
    if (!uri) return;
    Image.getSize(
      uri,
      (w, h) => {
        setOrigW(w);
        setOrigH(h);
        setWidth(String(w));
        setHeight(String(h));
      },
      () => {
        // ignore — keep zero dimensions
      },
    );
  }, [uri]);

  const goBack = useCallback(() => {
    if (router.canGoBack()) router.back();
    else router.replace(ROUTES.tools as never);
  }, [router]);

  const aspectRatio = origW > 0 && origH > 0 ? origW / origH : 1;

  const changeWidth = useCallback(
    (val: string) => {
      const num = parseInt(val.replace(/[^0-9]/g, ""), 10);
      setWidth(val.replace(/[^0-9]/g, ""));
      if (lock && Number.isFinite(num) && num > 0) {
        setHeight(String(Math.max(1, Math.round(num / aspectRatio))));
      }
    },
    [lock, aspectRatio],
  );
  const changeHeight = useCallback(
    (val: string) => {
      const num = parseInt(val.replace(/[^0-9]/g, ""), 10);
      setHeight(val.replace(/[^0-9]/g, ""));
      if (lock && Number.isFinite(num) && num > 0) {
        setWidth(String(Math.max(1, Math.round(num * aspectRatio))));
      }
    },
    [lock, aspectRatio],
  );

  const applyResizePreset = useCallback(
    (key: string) => {
      if (origW === 0 || origH === 0) return;
      if (key === "original") {
        setWidth(String(origW));
        setHeight(String(origH));
      } else if (key === "half") {
        setWidth(String(Math.round(origW / 2)));
        setHeight(String(Math.round(origH / 2)));
      } else if (key === "1280") {
        setWidth("1280");
        setHeight(String(Math.round(1280 / aspectRatio)));
      } else if (key === "640") {
        setWidth("640");
        setHeight(String(Math.round(640 / aspectRatio)));
      }
    },
    [origW, origH, aspectRatio],
  );

  const rotateBy = useCallback((delta: number) => {
    setAngle((a) => (((a + delta) % 360) + 360) % 360);
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const meta = (() => {
    const map: Record<string, { title: string; icon: keyof typeof Feather.glyphMap; action: string }> = {
      resize: { title: "Resize Image", icon: "maximize-2", action: "Apply resize" },
      crop: { title: "Crop Image", icon: "crop", action: "Apply crop" },
      rotate: { title: "Rotate Image", icon: "refresh-cw", action: "Apply rotation" },
    };
    return map[mode] ?? map.resize;
  })();

  const save = useCallback(async () => {
    if (!tool || !uri) return;
    setError(null);
    try {
      if (mode !== "rotate" && (origW === 0 || origH === 0)) {
        setError("Couldn't read the image dimensions. Please try another image.");
        return;
      }

      const isPng = extOf(fileName).toLowerCase() === ".png";
      const format = isPng ? SaveFormat.PNG : SaveFormat.JPEG;
      const outExt = isPng ? ".png" : ".jpg";
      const name = `${stripExt(fileName)}-${mode}${outExt}`;

      let ctx = ImageManipulator.manipulate(uri);
      if (mode === "resize") {
        const w = parseInt(width, 10);
        const h = parseInt(height, 10);
        ctx = ctx.resize({
          width: Number.isFinite(w) && w > 0 ? w : origW,
          height: Number.isFinite(h) && h > 0 ? h : origH,
        });
      } else if (mode === "rotate") {
        ctx = ctx.rotate(angle);
      } else if (mode === "crop") {
        ctx = ctx.crop(computeCropRect(origW, origH, cropRect));
      }

      const ref = await ctx.renderAsync();
      const result = await ref.saveAsync({ format, compress: 0.92 });
      setSaved({ uri: result.uri, name });
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
      setError(e instanceof Error ? e.message : "Could not save the image.");
    }
  }, [tool, uri, fileName, mode, origW, origH, width, height, angle, cropRect]);

  const openDownload = useCallback(() => {
    if (!tool || !saved) return;
    const base = saved.name.replace(/\.[^./]+$/, "") || "output";
    setDlName(base);
    const fmts = getDownloadFormats(tool, { outputName: saved.name, hasOcrText: false });
    setDlFormat(fmts[0].id);
    setDownloadOpen(true);
  }, [tool, saved]);

  const onConfirmDownload = useCallback(async () => {
    if (!tool || !saved) return;
    const fmts = getDownloadFormats(tool, { outputName: saved.name, hasOcrText: false });
    const fmt = fmts.find((f) => f.id === dlFormat) ?? fmts[0];
    const base = (dlName.trim() || "output").replace(/\.[^./]+$/, "") || "output";
    const fullName = `${base}.${fmt.ext}`;

    const runSave = async () => {
      setDlBusy(true);
      try {
        const out = await prepareDownloadUri(fmt, { sourceUri: saved.uri, baseName: base, fullName });
        const res = await saveFile(out, fullName);
        if (res.status === "saved") {
          Alert.alert("Downloaded", `${fullName} was saved to ${res.location}.`);
        } else if (res.status === "failed") {
          setError("Could not save the file. Please try again.");
        }
        // "presented"/"cancelled" → the system dialog handled its own outcome.
      } catch {
        setError("Could not prepare the download.");
      } finally {
        setDlBusy(false);
      }
    };

    setDownloadOpen(false);
    // iOS serializes modal presentation, so defer the save sheet until the
    // format modal has fully dismissed; Android can run it immediately.
    if (Platform.OS === "ios") {
      pendingActionRef.current = runSave;
    } else {
      await runSave();
    }
  }, [tool, saved, dlFormat, dlName]);

  const onDownloadModalDismiss = useCallback(() => {
    const action = pendingActionRef.current;
    pendingActionRef.current = null;
    if (action) action();
  }, []);

  if (!tool || !uri) {
    return (
      <ScreenScroll insetTop>
        <BackRow onPress={goBack} />
        <View style={styles.emptyState}>
          <Feather name="image" size={40} color={C.border} />
          <Text style={styles.emptyTitle}>No image to edit</Text>
          <Button label="Browse tools" icon="grid" onPress={() => router.replace(ROUTES.tools as never)} style={{ alignSelf: "center" }} />
        </View>
      </ScreenScroll>
    );
  }

  if (saved) {
    const dlFormats = getDownloadFormats(tool, { outputName: saved.name, hasOcrText: false });
    const dlExt = (dlFormats.find((f) => f.id === dlFormat) ?? dlFormats[0]).ext;
    return (
      <ScreenScroll insetTop>
        <BackRow onPress={goBack} title={meta.title} />
        <Card style={{ marginTop: 8 }}>
          <View style={styles.successWrap}>
            <ConverterStatusIcon status="success" size={88} />
            <Text style={styles.successTitle} testID="text-success">
              Saved successfully
            </Text>
            <Image source={{ uri: saved.uri }} style={styles.savedPreview} resizeMode="contain" />
            <Text style={styles.outputName} numberOfLines={1} testID="text-output-name">
              {saved.name}
            </Text>
            <View style={{ gap: 10, width: "100%", marginTop: 16 }}>
              <Button label="Download" icon="download" fullWidth onPress={openDownload} testID="button-share" />
              <Button label="Done" icon="check" variant="outline" fullWidth onPress={goBack} testID="button-done" />
            </View>
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
          </View>
        </Card>
        <DownloadFormatModal
          visible={downloadOpen}
          onClose={() => setDownloadOpen(false)}
          onDismiss={onDownloadModalDismiss}
          subtitle={`Your ${meta.title.toLowerCase()} is ready`}
          formats={dlFormats}
          selectedId={dlFormat}
          onSelect={setDlFormat}
          onConfirm={onConfirmDownload}
          busy={dlBusy}
          fileName={dlName}
          onChangeFileName={setDlName}
          previewName={`${dlName.trim() || "output"}.${dlExt}`}
        />
      </ScreenScroll>
    );
  }

  return (
    <ScreenScroll insetTop scrollEnabled={!interacting}>
      <BackRow onPress={goBack} title={meta.title} />

      <View style={styles.headerRow}>
        <View style={styles.iconTile}>
          <Feather name={meta.icon} size={20} color={C.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.fileLabel} numberOfLines={1} testID="text-filename">
            {fileName}
          </Text>
          <Text style={styles.fileSub}>
            {origW > 0 ? `${origW} × ${origH}px` : tool.description}
          </Text>
        </View>
      </View>

      {/* Image preview surface */}
      <View
        style={styles.previewSurface}
        onLayout={(e) => setSurf(e.nativeEvent.layout.width)}
      >
        <Image
          source={{ uri }}
          style={[styles.preview, mode === "rotate" && { transform: [{ rotate: `${angle}deg` }] }]}
          resizeMode="contain"
          testID="img-preview"
        />
        {mode === "crop" && imgBox && (
          <View
            style={{
              position: "absolute",
              left: imgBox.left,
              top: imgBox.top,
              width: imgBox.width,
              height: imgBox.height,
            }}
          >
            <CropBox
              container={{ width: imgBox.width, height: imgBox.height }}
              value={cropRect}
              onChange={setCropRect}
              onInteract={setInteracting}
            />
          </View>
        )}
      </View>

      {/* Mode controls */}
      <Card style={{ marginTop: 18 }}>
        {mode === "resize" && (
          <View style={{ gap: 16 }}>
            <Text style={styles.controlTitle}>New dimensions</Text>
            <View style={styles.dimRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.controlLabel}>Width (px)</Text>
                <TextInput
                  value={width}
                  onChangeText={changeWidth}
                  keyboardType="number-pad"
                  placeholder="0"
                  placeholderTextColor={C.mutedForeground}
                  style={styles.input}
                  testID="input-width"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.controlLabel}>Height (px)</Text>
                <TextInput
                  value={height}
                  onChangeText={changeHeight}
                  keyboardType="number-pad"
                  placeholder="0"
                  placeholderTextColor={C.mutedForeground}
                  style={styles.input}
                  testID="input-height"
                />
              </View>
            </View>
            <View style={styles.lockRow}>
              <Switch
                value={lock}
                onValueChange={setLock}
                trackColor={{ true: C.primary, false: C.border }}
                thumbColor="#ffffff"
                testID="switch-lock-aspect"
              />
              <Feather name={lock ? "lock" : "unlock"} size={16} color={lock ? C.primary : C.mutedForeground} />
              <Text style={styles.controlHelp}>Lock aspect ratio</Text>
            </View>
            <View>
              <Text style={styles.controlLabel}>Presets</Text>
              <View style={styles.chipRow}>
                <Chip label="Original" onPress={() => applyResizePreset("original")} />
                <Chip label="50%" onPress={() => applyResizePreset("half")} />
                <Chip label="1280 wide" onPress={() => applyResizePreset("1280")} />
                <Chip label="640 wide" onPress={() => applyResizePreset("640")} />
              </View>
            </View>
          </View>
        )}

        {mode === "crop" && (
          <View style={{ gap: 14 }}>
            <Text style={styles.controlTitle}>Crop region</Text>
            <Text style={styles.controlHelp}>
              Drag the box to move it, and drag the corner handle to resize — or
              pick a ratio:
            </Text>
            <View style={styles.chipRow}>
              {CROP_ASPECTS.map((a) => (
                <Chip
                  key={a.label}
                  label={a.label}
                  onPress={() => setCropRect(cropRectForAspect(origW, origH, a.value))}
                />
              ))}
            </View>
          </View>
        )}

        {mode === "rotate" && (
          <View style={{ gap: 14 }}>
            <Text style={styles.controlTitle}>Rotation</Text>
            <View style={styles.chipRow}>
              <Button label="90° Left" icon="rotate-ccw" size="sm" variant="outline" onPress={() => rotateBy(-90)} testID="button-rotate-left" />
              <Button label="90° Right" icon="rotate-cw" size="sm" variant="outline" onPress={() => rotateBy(90)} testID="button-rotate-right" />
              <Button label="180°" size="sm" variant="outline" onPress={() => rotateBy(180)} testID="button-rotate-180" />
            </View>
            <Badge label={`${angle}°`} tone="primary" />
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

/**
 * Free draggable + resizable crop rectangle (fractions of the image box). Drag
 * the body to move; drag the corner handle to resize. Capture handlers stop the
 * parent move responder from stealing the corner-resize gesture.
 */
function CropBox({
  container,
  value,
  onChange,
  onInteract,
}: {
  container: { width: number; height: number };
  value: CropRect;
  onChange: (p: CropRect) => void;
  onInteract?: (active: boolean) => void;
}) {
  const vRef = useRef(value);
  vRef.current = value;
  const cRef = useRef(container);
  cRef.current = container;
  const start = useRef(value);
  const iRef = useRef(onInteract);
  iRef.current = onInteract;
  // Smallest crop side (fraction of the image box). Kept small so the user can
  // pick almost any size, but large enough that the corner handle stays grabbable.
  const MIN = 0.05;

  // The body "move" responder claims a drag ONLY at touch-start via the bubble
  // `onStartShouldSetPanResponder` (so the child corner resize handle, which uses
  // start-capture, still wins corner touches). It must NOT claim on move:
  // capturing mid-gesture steals/duplicates the child's resize and makes the box
  // grow AND move at once — feeling "faster than the finger". Page scroll during a
  // body drag is blocked by the `scrollEnabled` freeze + static web
  // `touch-action:none` + refuse-termination, not by move-capture.
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
      <View
        style={[styles.resizeHandle, WEB_NO_TOUCH_SCROLL]}
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

  previewSurface: {
    width: "100%",
    aspectRatio: 1,
    backgroundColor: C.muted,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  preview: { width: "100%", height: "100%" },
  cropFrame: {
    position: "absolute",
    borderWidth: 2,
    borderColor: C.primary,
    borderStyle: "dashed",
    borderRadius: 4,
    backgroundColor: "rgba(247,67,61,0.06)",
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

  controlTitle: { fontSize: 15, color: C.foreground, fontFamily: fonts.headingSemibold },
  controlLabel: { fontSize: 13, color: C.mutedForeground, fontFamily: fonts.bodyMedium, marginBottom: 8 },
  controlHelp: { fontSize: 13, color: C.mutedForeground, fontFamily: fonts.body },
  dimRow: { flexDirection: "row", gap: 12 },
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
  lockRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, alignItems: "center" },

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
  savedPreview: {
    width: "100%",
    height: 180,
    borderRadius: 12,
    backgroundColor: C.muted,
    marginTop: 12,
  },
  outputName: { fontSize: 14, color: C.foreground, fontFamily: fonts.bodyMedium, marginTop: 8 },

  errorText: { fontSize: 13, color: C.destructive, fontFamily: fonts.body, textAlign: "center", marginTop: 12 },

  emptyState: { alignItems: "center", gap: 12, paddingVertical: 60 },
  emptyTitle: { fontSize: 18, color: C.foreground, fontFamily: fonts.headingSemibold },
});
