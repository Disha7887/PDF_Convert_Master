import { Feather } from "@expo/vector-icons";
import { File, Paths } from "expo-file-system";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Sharing from "expo-sharing";
import React, { useCallback, useMemo, useState } from "react";
import {
  Image,
  Platform,
  Pressable,
  StyleSheet,
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
const PAGE_COUNT = 4;

const TEXT_COLORS = ["#1c2434", "#2563eb", "#ef4444", "#22c55e", "#f59e0b"];
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
}

function stripExt(name: string): string {
  return name.replace(/\.[^./]+$/, "") || "document";
}
function sanitizeName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_") || "output";
}

async function writeMockPdf(name: string, summary: string): Promise<string> {
  const file = new File(Paths.cache, sanitizeName(name));
  file.create({ overwrite: true, intermediates: true });
  file.write(
    `PDF Convert Master — edited PDF (sample output)\n` +
      `${summary}\n` +
      `Generated: ${new Date().toISOString()}\n`,
  );
  return file.uri;
}

/** Copies the picked PDF into the cache under the output name (real PDF). */
async function copyPdfOutput(srcUri: string, name: string): Promise<string> {
  const dest = new File(Paths.cache, sanitizeName(name));
  try {
    if (dest.exists) dest.delete();
    const src = new File(srcUri);
    src.copy(dest);
    return dest.uri;
  } catch {
    return writeMockPdf(name, `Source: ${srcUri}`);
  }
}

async function shareFile(uri: string): Promise<boolean> {
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

  // edit
  const [textValue, setTextValue] = useState("");
  const [fontSize, setFontSize] = useState(16);
  const [color, setColor] = useState(TEXT_COLORS[0]);
  const [items, setItems] = useState<TextItem[]>([]);

  // crop
  const [cropInset, setCropInset] = useState(0.1);

  // sign
  const [signName, setSignName] = useState("");
  const [signFont, setSignFont] = useState(SIGN_FONTS[0].family);

  // watermark
  const [wmText, setWmText] = useState("CONFIDENTIAL");
  const [wmOpacity, setWmOpacity] = useState(0.22);

  // add-image
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageScale, setImageScale] = useState(0.4);

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

  const addTextItem = useCallback(() => {
    const t = textValue.trim();
    if (!t) return;
    setItems((prev) => [
      ...prev,
      { id: `t_${Date.now()}`, page, text: t, size: fontSize, color },
    ]);
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
    setImageUri(res.assets[0]?.uri ?? null);
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
      let summary = `Tool: ${tool.title}\nSource: ${fileName}`;
      if (mode === "edit") summary += `\nText boxes added: ${items.length}`;
      if (mode === "crop") summary += `\nMargins trimmed: ${Math.round(cropInset * 100)}%`;
      if (mode === "sign") summary += `\nSignature: ${signName || "(unsigned)"}`;
      if (mode === "watermark") summary += `\nWatermark: ${wmText} @ ${Math.round(wmOpacity * 100)}%`;
      if (mode === "add-image") summary += `\nImage placed: ${imageUri ? "yes" : "no"}`;
      if (mode === "delete-pages")
        summary += `\nPages removed: ${deleted.size} of ${PAGE_COUNT}`;

      const name = `${stripExt(fileName)}-${mode}.pdf`;
      const uri = params.uri
        ? await copyPdfOutput(params.uri, name)
        : await writeMockPdf(name, summary);
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
  }, [tool, fileName, mode, items, cropInset, signName, wmText, wmOpacity, imageUri, deleted]);

  const onShare = useCallback(async () => {
    if (!saved) return;
    try {
      const ok = await shareFile(saved.uri);
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
          <Button label="Browse tools" icon="grid" onPress={() => router.replace(ROUTES.tools as never)} />
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
      {mode === "delete-pages" ? (
        <View style={styles.pageGrid}>
          {Array.from({ length: PAGE_COUNT }).map((_, i) => {
            const isDeleted = deleted.has(i);
            return (
              <Pressable
                key={i}
                onPress={() => toggleDeleted(i)}
                style={styles.thumbWrap}
                testID={`thumb-page-${i + 1}`}
              >
                <View style={[styles.thumb, isDeleted && styles.thumbDeleted]}>
                  <Text style={styles.thumbNum}>{i + 1}</Text>
                  {isDeleted && (
                    <View style={styles.thumbBadge}>
                      <Feather name="trash-2" size={16} color={C.destructiveForeground} />
                    </View>
                  )}
                </View>
                <Text style={styles.thumbLabel}>Page {i + 1}</Text>
              </Pressable>
            );
          })}
        </View>
      ) : (
        <View style={styles.pageSurface}>
          <View style={styles.page}>
            {/* simulated page text lines */}
            <View style={styles.pageLinesWrap} pointerEvents="none">
              {Array.from({ length: 9 }).map((_, i) => (
                <View key={i} style={[styles.pageLine, { width: `${60 + ((i * 13) % 35)}%` }]} />
              ))}
            </View>

            {/* edit overlays */}
            {mode === "edit" &&
              items
                .filter((it) => it.page === page)
                .map((it, idx) => (
                  <Text
                    key={it.id}
                    style={[
                      styles.overlayText,
                      { color: it.color, fontSize: it.size, top: 16 + idx * 28 },
                    ]}
                    numberOfLines={1}
                  >
                    {it.text}
                  </Text>
                ))}

            {/* watermark overlay */}
            {mode === "watermark" && (
              <View style={styles.wmWrap} pointerEvents="none">
                <Text style={[styles.wmText, { opacity: wmOpacity }]}>{wmText || "WATERMARK"}</Text>
              </View>
            )}

            {/* signature overlay */}
            {mode === "sign" && signName ? (
              <Text style={[styles.signOverlay, { fontFamily: signFont }]}>{signName}</Text>
            ) : null}

            {/* add-image overlay */}
            {mode === "add-image" && imageUri ? (
              <Image
                source={{ uri: imageUri }}
                style={[styles.imgOverlay, { width: `${Math.round(imageScale * 100)}%` }]}
                resizeMode="contain"
              />
            ) : null}

            {/* crop frame */}
            {mode === "crop" && cropInset > 0 && (
              <View
                style={[
                  styles.cropFrame,
                  {
                    top: `${cropInset * 100}%`,
                    bottom: `${cropInset * 100}%`,
                    left: `${cropInset * 100}%`,
                    right: `${cropInset * 100}%`,
                  },
                ]}
                pointerEvents="none"
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
              Page {page + 1} of {PAGE_COUNT}
            </Text>
            <Pressable
              onPress={() => setPage((p) => Math.min(PAGE_COUNT - 1, p + 1))}
              disabled={page === PAGE_COUNT - 1}
              style={({ pressed }) => [
                styles.navBtn,
                { opacity: page === PAGE_COUNT - 1 ? 0.4 : pressed ? 0.6 : 1 },
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
            <Text style={styles.controlTitle}>Trim margins</Text>
            <Text style={styles.controlHelp}>Crop the same margin off every page.</Text>
            <View style={styles.chipRow}>
              {CROP_PRESETS.map((p) => (
                <Chip
                  key={p.label}
                  label={p.label}
                  active={cropInset === p.inset}
                  onPress={() => setCropInset(p.inset)}
                />
              ))}
            </View>
          </View>
        )}

        {mode === "sign" && (
          <View style={{ gap: 14 }}>
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
                      active={imageScale === s}
                      onPress={() => setImageScale(s)}
                    />
                  ))}
                </View>
              </View>
            )}
          </View>
        )}

        {mode === "delete-pages" && (
          <View style={{ gap: 10 }}>
            <Text style={styles.controlTitle}>Select pages to delete</Text>
            <Text style={styles.controlHelp}>
              Tap a page to mark it for removal. {deleted.size} of {PAGE_COUNT} selected.
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

  pageSurface: { gap: 12 },
  page: {
    width: "100%",
    aspectRatio: 1 / 1.414,
    backgroundColor: "#ffffff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    overflow: "hidden",
    padding: 20,
    shadowColor: "#0f172a",
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  pageLinesWrap: { gap: 12, marginTop: 6 },
  pageLine: { height: 8, borderRadius: 4, backgroundColor: C.muted },
  overlayText: { position: "absolute", left: 20, fontFamily: fonts.bodySemibold },
  wmWrap: { ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center" },
  wmText: {
    fontSize: 34,
    fontFamily: fonts.headingBold,
    color: C.foreground,
    transform: [{ rotate: "-32deg" }],
    letterSpacing: 2,
  },
  signOverlay: {
    position: "absolute",
    right: 24,
    bottom: 28,
    fontSize: 24,
    color: C.foreground,
  },
  imgOverlay: { position: "absolute", alignSelf: "center", top: "30%", aspectRatio: 1, borderRadius: 6 },
  cropFrame: {
    position: "absolute",
    borderWidth: 2,
    borderColor: C.primary,
    borderStyle: "dashed",
    borderRadius: 4,
    backgroundColor: "rgba(37,99,235,0.05)",
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
