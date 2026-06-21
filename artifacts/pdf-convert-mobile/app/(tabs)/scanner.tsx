import { Feather } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import { File, Paths } from "expo-file-system";
import * as LegacyFS from "expo-file-system/legacy";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import * as Print from "expo-print";
import { useFocusEffect } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Loader } from "@/components/Loader";
import { NAV_BAR_HEIGHT, useNavTopInset } from "@/components/TopNav";
import colors from "@/constants/colors";
import { addFile } from "@/constants/files";
import { fonts } from "@/constants/theme";

const C = colors.light;
const isWeb = Platform.OS === "web";

/** Output formats the user can save a scan as. */
type SaveFormatId = "pdf" | "jpg" | "png";

interface SaveFormatOption {
  id: SaveFormatId;
  label: string;
  sub: string;
  icon: keyof typeof Feather.glyphMap;
}

const SAVE_FORMAT_OPTIONS: SaveFormatOption[] = [
  { id: "pdf", label: "PDF Document", sub: "All pages in one file", icon: "file-text" },
  { id: "jpg", label: "JPG Image", sub: "Compact photo format", icon: "image" },
  { id: "png", label: "PNG Image", sub: "Lossless image quality", icon: "image" },
];

/** Re-encodes an image to PNG or JPG on-device (genuine pixel conversion). */
async function reencodeImage(uri: string, fmt: "png" | "jpg"): Promise<string> {
  const ref = await ImageManipulator.manipulate(uri).renderAsync();
  const result = await ref.saveAsync({
    format: fmt === "png" ? SaveFormat.PNG : SaveFormat.JPEG,
    compress: 0.92,
  });
  return result.uri;
}

function persistToDocuments(srcUri: string, filename: string): string {
  if (isWeb) return srcUri;
  try {
    const src = new File(srcUri);
    const dest = new File(Paths.document, filename);
    if (dest.exists) dest.delete();
    src.copy(dest);
    return dest.uri;
  } catch {
    return srcUri;
  }
}

async function buildPdf(imageUris: string[]): Promise<string | null> {
  try {
    const sources = await Promise.all(
      imageUris.map(async (uri) => {
        if (uri.startsWith("data:")) return uri;
        const b64 = await LegacyFS.readAsStringAsync(uri, {
          encoding: LegacyFS.EncodingType.Base64,
        });
        return `data:image/jpeg;base64,${b64}`;
      }),
    );
    const html = `<html><head><meta name="viewport" content="width=device-width,initial-scale=1"/></head><body style="margin:0;padding:0">${sources
      .map(
        (d) =>
          `<img src="${d}" style="width:100%;display:block;page-break-after:always"/>`,
      )
      .join("")}</body></html>`;
    const { uri } = await Print.printToFileAsync({ html });
    return uri;
  } catch {
    return null;
  }
}

export default function ScannerScreen() {
  const insets = useSafeAreaInsets();
  const navTopInset = useNavTopInset();
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [pages, setPages] = useState<string[]>([]);
  const [capturing, setCapturing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formatPickerVisible, setFormatPickerVisible] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const toastOpacity = useRef(new Animated.Value(0)).current;

  const showToast = useCallback(
    (message: string) => {
      setToast(message);
      toastOpacity.stopAnimation();
      Animated.sequence([
        Animated.timing(toastOpacity, {
          toValue: 1,
          duration: 200,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.delay(2400),
        Animated.timing(toastOpacity, {
          toValue: 0,
          duration: 260,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start(({ finished }) => {
        if (finished) setToast(null);
      });
    },
    [toastOpacity],
  );

  // Stop any in-flight toast animation if the screen unmounts.
  useEffect(() => () => toastOpacity.stopAnimation(), [toastOpacity]);

  // Release the camera when leaving the tab to free the device.
  const [active, setActive] = useState(true);
  useFocusEffect(
    useCallback(() => {
      setActive(true);
      return () => setActive(false);
    }, []),
  );

  const capture = useCallback(async () => {
    if (!cameraRef.current || capturing) return;
    try {
      setCapturing(true);
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.6 });
      if (photo?.uri) {
        setPages((prev) => [...prev, photo.uri]);
        if (!isWeb) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } catch {
      // ignore capture errors; user can retry
    } finally {
      setCapturing(false);
    }
  }, [capturing]);

  const importFromGallery = useCallback(async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: true,
      quality: 0.7,
    });
    if (!result.canceled) {
      setPages((prev) => [...prev, ...result.assets.map((a) => a.uri)]);
    }
  }, []);

  const removePage = useCallback((index: number) => {
    setPages((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const requestSave = useCallback(() => {
    if (pages.length === 0 || saving) return;
    setFormatPickerVisible(true);
  }, [pages.length, saving]);

  const saveAs = useCallback(
    async (format: SaveFormatId) => {
      if (pages.length === 0 || saving) return;
      setFormatPickerVisible(false);
      setSaving(true);
      try {
        const id = `s_${Date.now()}`;
        const now = new Date();
        const baseName = `Scan ${now.toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
        })} ${now.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}`;

        if (format === "pdf") {
          const persistedImages = pages.map((uri, i) =>
            persistToDocuments(uri, `${id}_page_${i}.jpg`),
          );
          const pdfUri = await buildPdf(persistedImages);
          const finalPdf = pdfUri
            ? persistToDocuments(pdfUri, `${id}.pdf`)
            : undefined;
          await addFile({
            id,
            kind: "scanned-image",
            name: baseName,
            uri: finalPdf ?? persistedImages[0],
            thumbnailUri: persistedImages[0],
            elementCount: persistedImages.length,
            createdAt: Date.now(),
            outputFormat: finalPdf ? ".pdf" : ".jpg",
          });
        } else {
          // Image formats are single-image — save each scanned page as its own
          // real file so no page is lost.
          const ext = format === "png" ? "png" : "jpg";
          const multi = pages.length > 1;
          for (let i = 0; i < pages.length; i++) {
            // Always transcode so the saved bytes truly match the chosen format
            // (gallery imports may be PNG/HEIC even when "JPG" is selected).
            const encoded = await reencodeImage(pages[i], ext);
            const persisted = persistToDocuments(
              encoded,
              `${id}_page_${i}.${ext}`,
            );
            await addFile({
              id: multi ? `${id}_${i}` : id,
              kind: "scanned-image",
              name: multi ? `${baseName} (${i + 1})` : baseName,
              uri: persisted,
              thumbnailUri: persisted,
              elementCount: 1,
              createdAt: Date.now() + i,
              outputFormat: `.${ext}`,
            });
          }
        }

        if (!isWeb)
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        const label = format.toUpperCase();
        const count = format === "pdf" ? 1 : pages.length;
        showToast(
          count > 1
            ? `Saved ${count} pages as ${label}`
            : `Saved as ${label}`,
        );
        setPages([]);
      } finally {
        setSaving(false);
      }
    },
    [pages, saving, showToast],
  );

  // ── Permission states (native only) ────────────────────────────────────────
  const showCamera = !isWeb && permission?.granted && active;

  return (
    <View style={[styles.root, { paddingTop: navTopInset + NAV_BAR_HEIGHT }]}>
      <View style={styles.topBar}>
        <Text style={styles.title}>Scan Document</Text>
        {pages.length > 0 ? (
          <View style={styles.pagePill}>
            <Text style={styles.pagePillText}>{pages.length}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.viewport}>
        {showCamera ? (
          <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing="back" />
        ) : (
          <View style={styles.placeholder}>
            <View style={styles.placeholderIcon}>
              <Feather name="camera" size={30} color={C.primary} />
            </View>
            {isWeb ? (
              <>
                <Text style={styles.placeholderTitle}>Camera scanning is on device</Text>
                <Text style={styles.placeholderSub}>
                  Open the app on your phone to scan with the camera, or import images from
                  your library below.
                </Text>
              </>
            ) : !permission?.granted ? (
              <>
                <Text style={styles.placeholderTitle}>Camera access needed</Text>
                <Text style={styles.placeholderSub}>
                  Allow camera access to scan documents, or import images from your library.
                </Text>
                <Pressable style={styles.permBtn} onPress={requestPermission}>
                  <Feather name="camera" size={16} color="#fff" />
                  <Text style={styles.permBtnText}>Enable camera</Text>
                </Pressable>
              </>
            ) : (
              <Loader size={48} />
            )}
          </View>
        )}

        {/* Document frame overlay */}
        {showCamera ? (
          <View pointerEvents="none" style={styles.frame}>
            <View style={[styles.corner, styles.tl]} />
            <View style={[styles.corner, styles.tr]} />
            <View style={[styles.corner, styles.bl]} />
            <View style={[styles.corner, styles.br]} />
          </View>
        ) : null}
      </View>

      {/* Captured page thumbnails */}
      {pages.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.thumbStrip}
          contentContainerStyle={styles.thumbStripContent}
        >
          {pages.map((uri, i) => (
            <View key={`${uri}-${i}`} style={styles.thumbWrap}>
              <Image source={{ uri }} style={styles.thumb} contentFit="cover" />
              <Pressable style={styles.thumbRemove} onPress={() => removePage(i)} hitSlop={6}>
                <Feather name="x" size={12} color="#fff" />
              </Pressable>
              <Text style={styles.thumbIndex}>{i + 1}</Text>
            </View>
          ))}
        </ScrollView>
      ) : null}

      {/* Controls */}
      <View style={[styles.controls, { paddingBottom: insets.bottom + 96 }]}>
        <Pressable style={styles.sideBtn} onPress={importFromGallery}>
          <Feather name="image" size={22} color={C.foreground} />
          <Text style={styles.sideBtnText}>Import</Text>
        </Pressable>

        <Pressable
          style={[styles.shutter, (!showCamera || capturing) && styles.shutterDisabled]}
          onPress={capture}
          disabled={!showCamera || capturing}
        >
          {capturing ? (
            <Loader size={40} />
          ) : (
            <View style={styles.shutterInner} />
          )}
        </Pressable>

        <Pressable
          style={[styles.sideBtn, pages.length === 0 && styles.sideBtnDisabled]}
          onPress={requestSave}
          disabled={pages.length === 0 || saving}
        >
          {saving ? (
            <Loader size={36} />
          ) : (
            <>
              <Feather name="check" size={22} color={pages.length === 0 ? C.mutedForeground : C.primary} />
              <Text
                style={[
                  styles.sideBtnText,
                  { color: pages.length === 0 ? C.mutedForeground : C.primary },
                ]}
              >
                Save
              </Text>
            </>
          )}
        </Pressable>
      </View>

      {/* Output-format chooser shown when "Save" is tapped */}
      <Modal
        visible={formatPickerVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setFormatPickerVisible(false)}
      >
        <Pressable
          style={styles.sheetBackdrop}
          onPress={() => setFormatPickerVisible(false)}
        >
          <Pressable
            style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Save as</Text>
            <Text style={styles.sheetSub}>
              Choose the output format for {pages.length}{" "}
              {pages.length === 1 ? "page" : "pages"}
            </Text>

            {SAVE_FORMAT_OPTIONS.map((opt) => (
              <Pressable
                key={opt.id}
                style={styles.formatRow}
                onPress={() => saveAs(opt.id)}
                disabled={saving}
              >
                <View style={styles.formatIcon}>
                  <Feather name={opt.icon} size={20} color={C.primary} />
                </View>
                <View style={styles.formatText}>
                  <Text style={styles.formatLabel}>{opt.label}</Text>
                  <Text style={styles.formatSub}>{opt.sub}</Text>
                </View>
                <Feather name="chevron-right" size={20} color={C.mutedForeground} />
              </Pressable>
            ))}

            <Pressable
              style={styles.cancelBtn}
              onPress={() => setFormatPickerVisible(false)}
            >
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Save confirmation toast */}
      {toast ? (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.toast,
            { top: navTopInset + 12, opacity: toastOpacity },
          ]}
        >
          <Feather name="check-circle" size={18} color="#fff" />
          <Text style={styles.toastText}>{toast}</Text>
        </Animated.View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0b1220" },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingTop: 18,
    paddingBottom: 14,
  },
  title: { fontSize: 17, color: "#fff", fontFamily: fonts.headingSemibold },
  pagePill: {
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    paddingHorizontal: 7,
    backgroundColor: C.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  pagePillText: { color: "#fff", fontSize: 12, fontFamily: fonts.bodyBold },
  viewport: {
    flex: 1,
    margin: 16,
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: "#111827",
  },
  placeholder: { flex: 1, alignItems: "center", justifyContent: "center", padding: 28, gap: 10 },
  placeholderIcon: {
    width: 64,
    height: 64,
    borderRadius: 18,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  placeholderTitle: { fontSize: 17, color: "#fff", fontFamily: fonts.headingSemibold, textAlign: "center" },
  placeholderSub: {
    fontSize: 13.5,
    lineHeight: 20,
    color: "#cbd5e1",
    fontFamily: fonts.body,
    textAlign: "center",
  },
  permBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: C.primary,
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 12,
    marginTop: 8,
  },
  permBtnText: { color: "#fff", fontSize: 14, fontFamily: fonts.bodySemibold },
  frame: { ...StyleSheet.absoluteFillObject, margin: 22 },
  corner: { position: "absolute", width: 30, height: 30, borderColor: "#fff" },
  tl: { top: 0, left: 0, borderTopWidth: 3, borderLeftWidth: 3, borderTopLeftRadius: 6 },
  tr: { top: 0, right: 0, borderTopWidth: 3, borderRightWidth: 3, borderTopRightRadius: 6 },
  bl: { bottom: 0, left: 0, borderBottomWidth: 3, borderLeftWidth: 3, borderBottomLeftRadius: 6 },
  br: { bottom: 0, right: 0, borderBottomWidth: 3, borderRightWidth: 3, borderBottomRightRadius: 6 },
  thumbStrip: { maxHeight: 92, flexGrow: 0 },
  thumbStripContent: { paddingHorizontal: 16, gap: 10, alignItems: "center" },
  thumbWrap: { width: 56, height: 70, borderRadius: 8, overflow: "hidden" },
  thumb: { width: 56, height: 70, borderRadius: 8, backgroundColor: "#1f2937" },
  thumbRemove: {
    position: "absolute",
    top: 2,
    right: 2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center",
    justifyContent: "center",
  },
  thumbIndex: {
    position: "absolute",
    bottom: 2,
    left: 4,
    color: "#fff",
    fontSize: 11,
    fontFamily: fonts.bodyBold,
    textShadowColor: "rgba(0,0,0,0.8)",
    textShadowRadius: 3,
  },
  controls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingTop: 18,
    paddingHorizontal: 24,
  },
  sideBtn: { alignItems: "center", justifyContent: "center", gap: 4, width: 72 },
  sideBtnDisabled: { opacity: 0.5 },
  sideBtnText: { fontSize: 12, color: "#e5e7eb", fontFamily: fonts.bodyMedium },
  shutter: {
    width: 74,
    height: 74,
    borderRadius: 37,
    borderWidth: 4,
    borderColor: "rgba(255,255,255,0.55)",
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  shutterDisabled: { opacity: 0.4 },
  shutterInner: { width: 56, height: 56, borderRadius: 28, backgroundColor: "#fff" },
  sheetBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: C.background,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingHorizontal: 18,
    paddingTop: 10,
  },
  sheetHandle: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: C.border,
    marginBottom: 14,
  },
  sheetTitle: {
    fontSize: 18,
    color: C.foreground,
    fontFamily: fonts.headingSemibold,
  },
  sheetSub: {
    fontSize: 13,
    color: C.mutedForeground,
    fontFamily: fonts.body,
    marginTop: 2,
    marginBottom: 12,
  },
  formatRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  formatIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: `${C.primary}1a`,
    alignItems: "center",
    justifyContent: "center",
  },
  formatText: { flex: 1 },
  formatLabel: {
    fontSize: 15,
    color: C.foreground,
    fontFamily: fonts.bodySemibold,
  },
  formatSub: {
    fontSize: 12.5,
    color: C.mutedForeground,
    fontFamily: fonts.body,
    marginTop: 1,
  },
  cancelBtn: {
    marginTop: 14,
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: C.muted,
    alignItems: "center",
  },
  cancelBtnText: {
    fontSize: 15,
    color: C.foreground,
    fontFamily: fonts.bodySemibold,
  },
  toast: {
    position: "absolute",
    left: 16,
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: C.primary,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  toastText: {
    color: "#fff",
    fontSize: 14,
    fontFamily: fonts.bodySemibold,
  },
});
