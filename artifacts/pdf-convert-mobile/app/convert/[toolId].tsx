import { Feather } from "@expo/vector-icons";
import { Asset } from "expo-asset";
import * as DocumentPicker from "expo-document-picker";
import { File, Paths } from "expo-file-system";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Sharing from "expo-sharing";
import React, { useCallback, useState } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";

import ConverterStatusIcon from "@/components/ConverterStatusIcon";
import FileBrokenIcon from "@/components/FileBrokenIcon";
import { Button, Card, ScreenScroll } from "@/components/ui";
import colors from "@/constants/colors";
import { addFile } from "@/constants/files";
import { addHistory } from "@/constants/history";
import { ROUTES } from "@/constants/routes";
import { cardShadow, fonts } from "@/constants/theme";
import { getToolActionLabel, getToolById, type Tool } from "@/constants/tools";
import { SAMPLE_ASSETS } from "@/mocks/data";
import {
  getConversionResult,
  startConversion,
  type ConversionResult,
  type PickedFile,
} from "@/services/api";

const C = colors.light;
const IMAGE_EXTS = [".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp", ".tiff"];

type Stage = "select" | "converting" | "done" | "error" | "unsupported";

// ── helpers (module scope) ───────────────────────────────────────────────────
function extOf(name: string): string {
  const m = name.toLowerCase().match(/\.[^.]+$/);
  return m ? m[0] : "";
}

function sanitizeName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_") || "output";
}

function isImageTool(tool: Tool): boolean {
  return (
    tool.editor === "image" ||
    (tool.acceptedFormats.length > 0 &&
      tool.acceptedFormats.every((f) => IMAGE_EXTS.includes(f)))
  );
}

function formatBytes(size?: number): string {
  if (!size || size <= 0) return "—";
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Produces a real, shareable output file for the mock conversion. No network is
 * involved while `USE_MOCK_DATA` is true. PDF/image results resolve to the
 * bundled sample asset matching the tool's output format; text results are
 * generated on-device.
 */
async function materializeOutput(
  name: string,
  sampleKey: ConversionResult["sampleKey"],
  tool: Tool,
  files: PickedFile[],
): Promise<string> {
  if (sampleKey === "pdf" || sampleKey === "image") {
    const asset = Asset.fromModule(SAMPLE_ASSETS[sampleKey]);
    await asset.downloadAsync();
    return asset.localUri ?? asset.uri;
  }
  const file = new File(Paths.cache, sanitizeName(name));
  file.create({ overwrite: true, intermediates: true });
  file.write(
    `PDF Convert Master — sample output\n` +
      `Tool: ${tool.title}\n` +
      `Output: ${name}\n` +
      `Source: ${files.map((f) => f.name).join(", ")}\n` +
      `Generated: ${new Date().toISOString()}\n`,
  );
  return file.uri;
}

async function shareFile(uri: string): Promise<boolean> {
  if (!(await Sharing.isAvailableAsync())) return false;
  await Sharing.shareAsync(uri);
  return true;
}

// ── screen ───────────────────────────────────────────────────────────────────
export default function ConvertScreen() {
  const router = useRouter();
  const { toolId, preview } = useLocalSearchParams<{ toolId: string; preview?: string }>();
  const tool = getToolById(toolId);

  // `preview` drives the canvas gallery: it initializes a specific stage so the
  // success / error / processing states can be shown as standalone frames.
  const previewStage: Stage | null =
    preview === "processing" || preview === "converting"
      ? "converting"
      : preview === "success" || preview === "done"
        ? "done"
        : preview === "error"
          ? "error"
          : preview === "unsupported"
            ? "unsupported"
            : null;

  const [files, setFiles] = useState<PickedFile[]>([]);
  const [stage, setStage] = useState<Stage>(previewStage ?? "select");
  const [error, setError] = useState<string | null>(
    previewStage === "error"
      ? "That file format isn't supported. Please choose a different file."
      : previewStage === "unsupported"
        ? "That file type isn't supported by this tool. Please choose a different file."
        : null,
  );
  const [output, setOutput] = useState<{ uri: string; name: string } | null>(
    previewStage === "done" ? { uri: "", name: "converted-document.docx" } : null,
  );

  const goBack = useCallback(() => {
    if (router.canGoBack()) router.back();
    else router.replace(ROUTES.tools as never);
  }, [router]);

  const pickFiles = useCallback(async () => {
    if (!tool) return;
    setError(null);
    try {
      let picked: PickedFile[] = [];
      const imageTool = isImageTool(tool);

      if (imageTool) {
        const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!perm.granted) {
          setError("Photo library access is required to choose images.");
          return;
        }
        const res = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ["images"],
          allowsMultipleSelection: tool.multiFile,
          quality: 1,
        });
        if (res.canceled) return;
        picked = res.assets.map((a, i) => ({
          uri: a.uri,
          name: a.fileName ?? `image-${Date.now()}-${i + 1}.jpg`,
          size: a.fileSize,
          mimeType: a.mimeType,
        }));
      } else {
        const res = await DocumentPicker.getDocumentAsync({
          type: "*/*",
          multiple: tool.multiFile,
          copyToCacheDirectory: true,
        });
        if (res.canceled) return;
        picked = res.assets.map((a) => ({
          uri: a.uri,
          name: a.name,
          size: a.size ?? undefined,
          mimeType: a.mimeType,
        }));
      }

      const valid: PickedFile[] = [];
      for (const f of picked) {
        const ext = extOf(f.name);
        if (
          !imageTool &&
          tool.acceptedFormats.length > 0 &&
          ext &&
          !tool.acceptedFormats.includes(ext)
        ) {
          setError(
            `This tool doesn't support ${ext} files. Accepted formats: ${tool.acceptedFormats.join(", ")}.`,
          );
          setStage("unsupported");
          return;
        }
        if (f.size && f.size > tool.maxFileSizeMB * 1024 * 1024) {
          setError(`"${f.name}" exceeds the ${tool.maxFileSize} limit.`);
          continue;
        }
        valid.push(f);
      }
      if (valid.length === 0) return;

      if (Platform.OS !== "web") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }

      // Editor tools hand off to the interactive editor with the picked file.
      if (tool.editor === "pdf" || tool.editor === "image") {
        const pathname = tool.editor === "pdf" ? ROUTES.pdfEditor : ROUTES.imageEditor;
        router.push({
          pathname,
          params: { toolId: tool.id, uri: valid[0].uri, name: valid[0].name },
        } as never);
        return;
      }

      setFiles((prev) => (tool.multiFile ? [...prev, ...valid] : valid));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not pick a file.");
    }
  }, [tool, router]);

  const convert = useCallback(async () => {
    if (!tool || files.length === 0) return;
    setStage("converting");
    setError(null);
    try {
      const { jobId } = await startConversion(tool.id, files);
      const result = await getConversionResult(tool.id, jobId, files[0].name);
      if (result.status !== "completed") {
        throw new Error(result.error ?? "Conversion failed. Please try again.");
      }
      const name = result.outputFilename ?? sanitizeName(`output-${tool.id}`);
      const uri = await materializeOutput(name, result.sampleKey, tool, files);
      setOutput({ uri, name });
      setStage("done");
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
      await addFile({
        id: `f_${Date.now()}`,
        kind: tool.outputFormat.toLowerCase().includes("pdf")
          ? "converted-pdf"
          : "converted-file",
        name,
        uri,
        elementCount: files.length,
        createdAt: Date.now(),
        toolId: tool.id,
        toolTitle: tool.title,
        outputFormat: tool.outputFormat,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Conversion failed.");
      setStage("error");
    }
  }, [tool, files]);

  const reset = useCallback(() => {
    setFiles([]);
    setOutput(null);
    setError(null);
    setStage("select");
  }, []);

  const removeFile = useCallback((uri: string) => {
    setFiles((prev) => prev.filter((f) => f.uri !== uri));
  }, []);

  const onShare = useCallback(async () => {
    if (!output) return;
    try {
      const ok = await shareFile(output.uri);
      if (!ok) setError("Sharing isn't available on this platform.");
    } catch {
      setError("Could not open the share sheet.");
    }
  }, [output]);

  if (!tool) {
    return (
      <ScreenScroll insetTop>
        <BackRow onPress={goBack} />
        <View style={styles.emptyState}>
          <Feather name="alert-triangle" size={40} color={C.border} />
          <Text style={styles.emptyTitle}>Tool not found</Text>
          <Text style={styles.emptyText}>
            We couldn&apos;t find that tool. Head back and pick another one.
          </Text>
          <Button label="Browse tools" icon="grid" onPress={() => router.replace(ROUTES.tools as never)} />
        </View>
      </ScreenScroll>
    );
  }

  const isEditorTool = tool.editor === "pdf" || tool.editor === "image";

  return (
    <ScreenScroll insetTop>
      <BackRow onPress={goBack} title={tool.title} />

      {/* Select stage */}
      {stage === "select" && (
        <View style={{ gap: 16 }}>
          <Pressable
            onPress={pickFiles}
            style={({ pressed }) => [styles.dropzone, { opacity: pressed ? 0.92 : 1 }]}
            testID="button-pick-file"
          >
            <View style={styles.dropIcon}>
              <ConverterStatusIcon status="upload" toolId={tool.id} size={52} />
            </View>
            <Text style={styles.dropTitle}>{tool.dropAreaText}</Text>
            <Text style={styles.dropHint}>{tool.fileTypeHint}</Text>
            <View style={styles.dropBtn}>
              <Feather name="folder" size={16} color={C.primaryForeground} />
              <Text style={styles.dropBtnText}>{tool.buttonText}</Text>
            </View>
            {isEditorTool && (
              <Text style={styles.editorHint}>
                Opens the {tool.editor === "pdf" ? "PDF" : "image"} editor after you choose a file.
              </Text>
            )}
          </Pressable>

          {error ? (
            <Text style={styles.errorText} testID="text-error">
              {error}
            </Text>
          ) : null}

          {files.length > 0 && (
            <Card>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>
                  {files.length} file{files.length !== 1 ? "s" : ""} selected
                </Text>
                <Pressable onPress={reset} hitSlop={8} testID="button-clear-all">
                  <Text style={styles.clearText}>Clear all</Text>
                </Pressable>
              </View>

              <View style={{ gap: 10, marginTop: 12 }}>
                {files.map((f) => (
                  <View key={f.uri} style={styles.fileRow} testID={`row-file-${f.name}`}>
                    <View style={styles.fileIcon}>
                      <Feather name="file" size={18} color={C.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.fileName} numberOfLines={1}>
                        {f.name}
                      </Text>
                      <Text style={styles.fileMeta}>{formatBytes(f.size)}</Text>
                    </View>
                    <Pressable
                      onPress={() => removeFile(f.uri)}
                      hitSlop={8}
                      testID={`button-remove-${f.name}`}
                    >
                      <Feather name="x" size={18} color={C.mutedForeground} />
                    </Pressable>
                  </View>
                ))}
              </View>

              <View style={{ gap: 10, marginTop: 16 }}>
                <Button
                  label={getToolActionLabel(tool)}
                  icon="zap"
                  fullWidth
                  onPress={convert}
                  testID="button-convert"
                />
                {tool.multiFile && (
                  <Button
                    label="Add more files"
                    icon="plus"
                    variant="outline"
                    fullWidth
                    onPress={pickFiles}
                    testID="button-add-more"
                  />
                )}
              </View>
            </Card>
          )}
        </View>
      )}

      {/* Converting stage */}
      {stage === "converting" && (
        <View style={styles.centerState} testID="status-converting">
          <ConverterStatusIcon status="processing" size={96} />
          <Text style={styles.centerTitle}>Converting…</Text>
          <Text style={styles.centerText}>
            Processing your file{files.length !== 1 ? "s" : ""} with {tool.title}.
          </Text>
        </View>
      )}

      {/* Done stage */}
      {stage === "done" && output && (
        <Card style={{ marginTop: 4 }}>
          <View style={styles.successWrap}>
            <ConverterStatusIcon status="success" size={88} />
            <Text style={styles.successTitle} testID="text-success">
              Conversion complete
            </Text>
            <Text style={styles.successText}>Your file is ready to download.</Text>

            <View style={styles.outputRow}>
              <Feather name="file-text" size={18} color={C.primary} />
              <Text style={styles.outputName} numberOfLines={1} testID="text-output-name">
                {output.name}
              </Text>
            </View>

            <View style={{ gap: 10, width: "100%", marginTop: 16 }}>
              <Button
                label="Download / Share"
                icon="download"
                fullWidth
                onPress={onShare}
                testID="button-share"
              />
              <Button
                label="Convert another"
                icon="refresh-cw"
                variant="outline"
                fullWidth
                onPress={reset}
                testID="button-convert-another"
              />
            </View>
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
          </View>
        </Card>
      )}

      {/* Error stage */}
      {stage === "error" && (
        <Card style={{ marginTop: 4 }}>
          <View style={styles.successWrap}>
            <ConverterStatusIcon status="error" size={88} />
            <Text style={styles.successTitle}>Something went wrong</Text>
            <Text style={styles.successText} testID="text-error">
              {error ?? "The conversion failed. Please try again."}
            </Text>
            <View style={{ gap: 10, width: "100%", marginTop: 16 }}>
              <Button label="Try again" icon="refresh-cw" fullWidth onPress={() => setStage("select")} testID="button-try-again" />
            </View>
          </View>
        </Card>
      )}

      {/* Unsupported file stage */}
      {stage === "unsupported" && (
        <Card style={{ marginTop: 4 }}>
          <View style={styles.successWrap}>
            <FileBrokenIcon size={108} />
            <Text style={styles.successTitle}>Unsupported file</Text>
            <Text style={styles.successText} testID="text-unsupported">
              {error ?? "That file type isn't supported. Please choose a different file."}
            </Text>
            {tool.acceptedFormats.length > 0 ? (
              <Text style={styles.acceptedText}>
                Accepted: {tool.acceptedFormats.join(", ")}
              </Text>
            ) : null}
            <View style={{ gap: 10, width: "100%", marginTop: 16, alignItems: "center" }}>
              <Button
                label="Choose another file"
                icon="folder"
                onPress={() => {
                  setError(null);
                  setStage("select");
                }}
                style={{ alignSelf: "center" }}
                testID="button-choose-another"
              />
            </View>
          </View>
        </Card>
      )}
    </ScreenScroll>
  );
}

// ── shared in-screen header ──────────────────────────────────────────────────
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

  hero: { alignItems: "center", gap: 8, marginBottom: 24 },
  iconTile: {
    width: 76,
    height: 76,
    borderRadius: 20,
    backgroundColor: C.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 24,
    color: C.foreground,
    fontFamily: fonts.headingBold,
    textAlign: "center",
    marginTop: 4,
  },
  desc: {
    fontSize: 14,
    lineHeight: 20,
    color: C.mutedForeground,
    fontFamily: fonts.body,
    textAlign: "center",
  },
  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "center",
    marginTop: 6,
  },

  dropzone: {
    borderWidth: 1.5,
    borderColor: C.blue200,
    borderStyle: "dashed",
    borderRadius: 18,
    backgroundColor: C.surfaceAlt,
    paddingVertical: 32,
    paddingHorizontal: 20,
    alignItems: "center",
    gap: 8,
  },
  dropIcon: {
    width: 60,
    height: 60,
    borderRadius: 16,
    backgroundColor: C.blue50,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  dropTitle: { fontSize: 16, color: C.foreground, fontFamily: fonts.headingSemibold, textAlign: "center" },
  dropHint: { fontSize: 12.5, color: C.mutedForeground, fontFamily: fonts.body, textAlign: "center" },
  dropBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: C.primary,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  dropBtnText: { color: C.primaryForeground, fontSize: 14, fontFamily: fonts.bodySemibold },
  editorHint: { fontSize: 12, color: C.mutedForeground, fontFamily: fonts.body, textAlign: "center", marginTop: 4 },

  cardHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  cardTitle: { fontSize: 15, color: C.foreground, fontFamily: fonts.headingSemibold },
  clearText: { fontSize: 13, color: C.destructive, fontFamily: fonts.bodySemibold },

  fileRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  fileIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: C.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  fileName: { fontSize: 14, color: C.foreground, fontFamily: fonts.bodyMedium },
  fileMeta: { fontSize: 12, color: C.mutedForeground, fontFamily: fonts.body, marginTop: 2 },

  centerState: { alignItems: "center", gap: 10, paddingVertical: 48 },
  centerTitle: { fontSize: 18, color: C.foreground, fontFamily: fonts.headingSemibold, marginTop: 8 },
  centerText: { fontSize: 14, color: C.mutedForeground, fontFamily: fonts.body, textAlign: "center" },

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
  successText: { fontSize: 14, color: C.mutedForeground, fontFamily: fonts.body, textAlign: "center" },
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
    ...cardShadow,
  },
  outputName: { flex: 1, fontSize: 14, color: C.foreground, fontFamily: fonts.bodyMedium },

  errorText: { fontSize: 13, color: C.destructive, fontFamily: fonts.body, textAlign: "center", marginTop: 4 },
  acceptedText: { fontSize: 12.5, color: C.mutedForeground, fontFamily: fonts.bodyMedium, textAlign: "center", marginTop: 2 },

  emptyState: { alignItems: "center", gap: 12, paddingVertical: 60 },
  emptyTitle: { fontSize: 18, color: C.foreground, fontFamily: fonts.headingSemibold },
  emptyText: { fontSize: 14, color: C.mutedForeground, fontFamily: fonts.body, textAlign: "center" },
});
