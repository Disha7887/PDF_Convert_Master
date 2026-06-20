import { Feather } from "@expo/vector-icons";
import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Sharing from "expo-sharing";
import React, { useCallback, useEffect, useState } from "react";
import {
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";

import { Badge, Button, Card, Chip, ScreenScroll } from "@/components/ui";
import colors from "@/constants/colors";
import { addHistory } from "@/constants/history";
import { ROUTES } from "@/constants/routes";
import { fonts } from "@/constants/theme";
import { getToolById } from "@/constants/tools";

const C = colors.light;

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
/**
 * Computes a real pixel-space crop rectangle on the original image. When an
 * aspect ratio is chosen we take the largest centered rect matching it; for
 * "Free" we crop the centered 80% region (mirrors the on-screen 10% inset).
 */
function computeCropRect(
  w: number,
  h: number,
  aspect: number | undefined,
): { originX: number; originY: number; width: number; height: number } {
  if (!aspect) {
    return {
      originX: Math.round(w * 0.1),
      originY: Math.round(h * 0.1),
      width: Math.max(1, Math.round(w * 0.8)),
      height: Math.max(1, Math.round(h * 0.8)),
    };
  }
  const origRatio = w / h;
  let cw: number;
  let ch: number;
  if (aspect >= origRatio) {
    cw = w;
    ch = Math.max(1, Math.round(w / aspect));
  } else {
    ch = h;
    cw = Math.max(1, Math.round(h * aspect));
  }
  return {
    originX: Math.max(0, Math.round((w - cw) / 2)),
    originY: Math.max(0, Math.round((h - ch) / 2)),
    width: Math.min(w, cw),
    height: Math.min(h, ch),
  };
}

async function shareFile(uri: string): Promise<boolean> {
  if (!(await Sharing.isAvailableAsync())) return false;
  await Sharing.shareAsync(uri);
  return true;
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

  // crop
  const [aspect, setAspect] = useState<number | undefined>(undefined);

  // rotate
  const [angle, setAngle] = useState(0);

  const [saved, setSaved] = useState<{ uri: string; name: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

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
        ctx = ctx.crop(computeCropRect(origW, origH, aspect));
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
  }, [tool, uri, fileName, mode, origW, origH, width, height, angle, aspect]);

  const onShare = useCallback(async () => {
    if (!saved) return;
    try {
      const ok = await shareFile(saved.uri);
      if (!ok) setError("Sharing isn't available on this platform.");
    } catch {
      setError("Could not open the share sheet.");
    }
  }, [saved]);

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
    return (
      <ScreenScroll insetTop>
        <BackRow onPress={goBack} title={meta.title} />
        <Card style={{ marginTop: 8 }}>
          <View style={styles.successWrap}>
            <View style={styles.successIcon}>
              <Feather name="check-circle" size={30} color={C.success} />
            </View>
            <Text style={styles.successTitle} testID="text-success">
              Saved successfully
            </Text>
            <Image source={{ uri: saved.uri }} style={styles.savedPreview} resizeMode="contain" />
            <Text style={styles.outputName} numberOfLines={1} testID="text-output-name">
              {saved.name}
            </Text>
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
          <Text style={styles.fileSub}>
            {origW > 0 ? `${origW} × ${origH}px` : tool.description}
          </Text>
        </View>
      </View>

      {/* Image preview surface */}
      <View style={styles.previewSurface}>
        <Image
          source={{ uri }}
          style={[styles.preview, mode === "rotate" && { transform: [{ rotate: `${angle}deg` }] }]}
          resizeMode="contain"
          testID="img-preview"
        />
        {mode === "crop" && (
          <View
            style={[
              styles.cropFrame,
              aspect
                ? { width: "78%", aspectRatio: aspect }
                : { top: "10%", bottom: "10%", left: "10%", right: "10%" },
            ]}
            pointerEvents="none"
          />
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
            <Text style={styles.controlTitle}>Aspect ratio</Text>
            <Text style={styles.controlHelp}>Pick a ratio for the crop region.</Text>
            <View style={styles.chipRow}>
              {CROP_ASPECTS.map((a) => (
                <Chip
                  key={a.label}
                  label={a.label}
                  active={aspect === a.value}
                  onPress={() => setAspect(a.value)}
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
