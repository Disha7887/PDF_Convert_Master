import AsyncStorage from "@react-native-async-storage/async-storage";
import { Feather } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import * as Sharing from "expo-sharing";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { API_BASE_URL, POLL_INTERVAL_MS, POLL_MAX_ATTEMPTS } from "@/constants/api";
import { getToolById, validateFileExtension, parseMaxSizeBytes } from "@/constants/tools";
import { useColors } from "@/hooks/useColors";
import { HISTORY_KEY, HistoryEntry } from "@/app/(tabs)/history";

interface PickedFile {
  uri: string;
  name: string;
  mimeType?: string;
  size?: number;
}

type ConvertState = "idle" | "uploading" | "polling" | "done" | "error";

export default function ConvertScreen() {
  const { toolId } = useLocalSearchParams<{ toolId: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const tool = getToolById(toolId ?? "");
  const [files, setFiles] = useState<PickedFile[]>([]);
  const [state, setState] = useState<ConvertState>("idle");
  const [progress, setProgress] = useState("");
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [outputFilename, setOutputFilename] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  if (!tool) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.destructive }}>Tool not found.</Text>
      </View>
    );
  }

  const isImageTool = tool.acceptedFormats.some((f) =>
    [".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp", ".tiff"].includes(f)
  );
  const isPdfOnly = tool.acceptedFormats.every((f) => f === ".pdf");

  async function pickFiles() {
    if (isImageTool && !isPdfOnly) {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsMultipleSelection: tool.multiFile ?? false,
        quality: 1,
      });
      if (result.canceled) return;
      const picked: PickedFile[] = result.assets.map((a) => ({
        uri: a.uri,
        name: a.fileName ?? `image_${Date.now()}.jpg`,
        mimeType: a.mimeType ?? "image/jpeg",
        size: a.fileSize,
      }));
      setFiles(picked);
    } else {
      const result = await DocumentPicker.getDocumentAsync({
        type: "*/*",
        multiple: tool.multiFile ?? false,
        copyToCacheDirectory: true,
      });
      if (result.canceled) return;
      const picked: PickedFile[] = result.assets.map((a) => ({
        uri: a.uri,
        name: a.name,
        mimeType: a.mimeType ?? "application/octet-stream",
        size: a.size,
      }));
      setFiles(picked);
    }
    setState("idle");
    setDownloadUrl(null);
    setErrorMsg(null);
    setOutputFilename(null);
  }

  function validateFiles(): string | null {
    if (files.length === 0) return "Please select at least one file.";
    const maxBytes = parseMaxSizeBytes(tool!.maxFileSizeMB);
    for (const f of files) {
      if (!validateFileExtension(f.name, tool!.acceptedFormats)) {
        const fmts = tool!.acceptedFormats.join(", ").toUpperCase();
        return `"${f.name}" is not a supported format. Accepted: ${fmts}`;
      }
      if (f.size && f.size > maxBytes) {
        return `"${f.name}" exceeds the ${tool!.maxFileSizeMB} MB limit.`;
      }
    }
    return null;
  }

  function stopPolling() {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }

  async function pollJob(jobId: string) {
    let attempts = 0;
    stopPolling();

    pollRef.current = setInterval(async () => {
      attempts++;
      if (attempts > POLL_MAX_ATTEMPTS) {
        stopPolling();
        setState("error");
        setErrorMsg("Conversion timed out. Please try again.");
        return;
      }
      try {
        const res = await fetch(`${API_BASE_URL}/jobs/${jobId}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        // Backend: { success, data: { jobId, status, outputFilename, errorMessage, downloadUrl, ... } }
        const envelope = await res.json();
        const job = envelope.data ?? envelope;

        if (job.status === "completed") {
          stopPolling();
          const url = `${API_BASE_URL}/download/${jobId}`;
          const outName = job.outputFilename ?? `converted.${tool!.outputFormat.toLowerCase().split("/")[0]}`;
          setDownloadUrl(url);
          setOutputFilename(outName);
          setState("done");
          if (Platform.OS !== "web") {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          }
          await saveToHistory("completed");
        } else if (job.status === "failed") {
          stopPolling();
          setState("error");
          setErrorMsg(job.errorMessage ?? job.error ?? "Conversion failed. Please try again.");
          await saveToHistory("failed");
        } else {
          setProgress(
            job.status === "processing" ? "Processing your file…" : "Queued…"
          );
        }
      } catch (e: any) {
        stopPolling();
        setState("error");
        setErrorMsg("Network error while checking status. Please try again.");
      }
    }, POLL_INTERVAL_MS);
  }

  async function saveToHistory(status: "completed" | "failed") {
    try {
      const raw = await AsyncStorage.getItem(HISTORY_KEY);
      const existing: HistoryEntry[] = raw ? JSON.parse(raw) : [];
      const entry: HistoryEntry = {
        id: Date.now().toString() + Math.random().toString(36).slice(2, 8),
        toolTitle: tool!.title,
        fileName: files[0]?.name ?? "unknown",
        outputFormat: tool!.outputFormat,
        timestamp: Date.now(),
        status,
      };
      const updated = [entry, ...existing].slice(0, 50);
      await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
    } catch {
      // ignore storage errors
    }
  }

  async function convert() {
    const err = validateFiles();
    if (err) {
      Alert.alert("Invalid file", err);
      return;
    }

    setState("uploading");
    setProgress("Uploading…");
    setErrorMsg(null);
    setDownloadUrl(null);

    try {
      let jobId: string;

      if (!API_BASE_URL) {
        throw new Error(
          "Backend URL is not configured. Set EXPO_PUBLIC_DOMAIN in your environment."
        );
      }

      if (tool!.isMerge) {
        // Special merge endpoint — POST /api/merge-pdfs
        const formData = new FormData();
        for (const f of files) {
          formData.append("files", {
            uri: f.uri,
            name: f.name,
            type: f.mimeType ?? "application/pdf",
          } as any);
        }
        const res = await fetch(`${API_BASE_URL}/merge-pdfs`, {
          method: "POST",
          body: formData,
        });
        if (!res.ok) {
          const body = await res.text();
          throw new Error(body || `Server error ${res.status}`);
        }
        // Backend: { success, data: { jobId, status, message } }
        const envelope = await res.json();
        if (!envelope.success) throw new Error(envelope.error ?? `Server error`);
        jobId = String(envelope.data.jobId);
      } else {
        // Standard convert endpoint — POST /api/convert
        const formData = new FormData();
        for (const f of files) {
          formData.append("file", {
            uri: f.uri,
            name: f.name,
            type: f.mimeType ?? "application/octet-stream",
          } as any);
        }
        formData.append("toolType", tool!.serverToolType);
        const res = await fetch(`${API_BASE_URL}/convert`, {
          method: "POST",
          body: formData,
        });
        if (!res.ok) {
          const body = await res.text();
          throw new Error(body || `Server error ${res.status}`);
        }
        // Backend: { success, data: { jobId, status, inputFilename, message } }
        const envelope = await res.json();
        if (!envelope.success) throw new Error(envelope.error ?? `Server error`);
        jobId = String(envelope.data.jobId);
      }

      setState("polling");
      setProgress("Starting conversion…");
      await pollJob(jobId);
    } catch (e: any) {
      setState("error");
      setErrorMsg(e?.message ?? "Upload failed. Please try again.");
    }
  }

  async function downloadAndShare() {
    if (!downloadUrl) return;
    if (Platform.OS === "web") {
      // On web just open the URL
      if (typeof window !== "undefined") {
        window.open(downloadUrl, "_blank");
      }
      return;
    }
    try {
      const localUri = FileSystem.cacheDirectory + (outputFilename ?? "converted_file");
      const dl = await FileSystem.downloadAsync(downloadUrl, localUri);
      if (dl.status !== 200) {
        Alert.alert("Download failed", "Could not download the converted file.");
        return;
      }
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(dl.uri, {
          dialogTitle: "Save or share your converted file",
          UTI: "public.item",
        });
      } else {
        Alert.alert("Saved", `File saved to: ${dl.uri}`);
      }
    } catch (e: any) {
      Alert.alert("Error", e?.message ?? "Could not download the file.");
    }
  }

  function reset() {
    stopPolling();
    setFiles([]);
    setState("idle");
    setDownloadUrl(null);
    setErrorMsg(null);
    setOutputFilename(null);
    setProgress("");
  }

  const isProcessing = state === "uploading" || state === "polling";
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom + 16;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{
        paddingTop: topPad + 16,
        paddingBottom: bottomPad,
        paddingHorizontal: 20,
      }}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {/* Back */}
      <Pressable onPress={() => router.back()} style={styles.backBtn}>
        <Feather name="arrow-left" size={20} color={colors.primary} />
        <Text style={[styles.backText, { color: colors.primary, fontFamily: "Inter_500Medium" }]}>
          Tools
        </Text>
      </Pressable>

      {/* Tool header */}
      <View style={styles.toolHeader}>
        <View style={[styles.toolIconWrap, { backgroundColor: colors.accent }]}>
          <Feather name="file-text" size={28} color={colors.primary} />
        </View>
        <Text style={[styles.toolTitle, { color: colors.foreground, fontFamily: "Poppins_700Bold" }]}>
          {tool.title}
        </Text>
        <Text style={[styles.toolDesc, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
          {tool.description}
        </Text>
        <View style={[styles.chip, { backgroundColor: colors.accent }]}>
          <Text style={[styles.chipText, { color: colors.primary, fontFamily: "Inter_600SemiBold" }]}>
            {tool.acceptedFormats.map((f) => f.toUpperCase().replace(".", "")).join(", ")} → {tool.outputFormat}
          </Text>
        </View>
      </View>

      {/* File picker area */}
      {state !== "done" && (
        <Pressable
          onPress={pickFiles}
          style={[
            styles.dropArea,
            {
              borderColor: files.length > 0 ? colors.primary : colors.border,
              backgroundColor: files.length > 0 ? colors.accent : colors.muted,
            },
          ]}
          disabled={isProcessing}
        >
          {files.length === 0 ? (
            <>
              <Feather name="upload-cloud" size={36} color={colors.mutedForeground} />
              <Text style={[styles.dropText, { color: colors.foreground, fontFamily: "Poppins_600SemiBold" }]}>
                Tap to select {tool.multiFile ? "files" : "a file"}
              </Text>
              <Text style={[styles.dropHint, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                {tool.acceptedFormats.join(", ").toUpperCase()} · Max {tool.maxFileSizeMB} MB each
              </Text>
            </>
          ) : (
            <>
              <Feather name="check-circle" size={32} color={colors.primary} />
              <Text style={[styles.dropText, { color: colors.primary, fontFamily: "Poppins_600SemiBold" }]}>
                {files.length} file{files.length !== 1 ? "s" : ""} selected
              </Text>
              {files.map((f, i) => (
                <Text
                  key={i}
                  style={[styles.fileName, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}
                  numberOfLines={1}
                >
                  {f.name}
                </Text>
              ))}
              {!isProcessing && (
                <Text style={[styles.changeFiles, { color: colors.primary, fontFamily: "Inter_500Medium" }]}>
                  Tap to change
                </Text>
              )}
            </>
          )}
        </Pressable>
      )}

      {/* Result area */}
      {state === "done" && downloadUrl && (
        <View style={[styles.resultCard, { backgroundColor: "#f0fdf4", borderColor: "#bbf7d0" }]}>
          <Feather name="check-circle" size={36} color={colors.success} />
          <Text style={[styles.resultTitle, { color: "#15803d", fontFamily: "Poppins_700Bold" }]}>
            Conversion complete!
          </Text>
          <Text style={[styles.resultFile, { color: "#166534", fontFamily: "Inter_400Regular" }]}>
            {outputFilename}
          </Text>
          <Pressable
            onPress={downloadAndShare}
            style={[styles.primaryBtn, { backgroundColor: colors.success }]}
          >
            <Feather name="share-2" size={18} color="#fff" />
            <Text style={[styles.primaryBtnText, { fontFamily: "Poppins_600SemiBold" }]}>
              Download / Share
            </Text>
          </Pressable>
          <Pressable onPress={reset} style={styles.secondaryBtn}>
            <Text style={[styles.secondaryBtnText, { color: colors.mutedForeground, fontFamily: "Inter_500Medium" }]}>
              Convert another file
            </Text>
          </Pressable>
        </View>
      )}

      {/* Error area */}
      {state === "error" && errorMsg && (
        <View style={[styles.errorCard, { backgroundColor: "#fef2f2", borderColor: "#fecaca" }]}>
          <Feather name="alert-circle" size={32} color={colors.destructive} />
          <Text style={[styles.errorTitle, { color: "#991b1b", fontFamily: "Poppins_600SemiBold" }]}>
            Conversion failed
          </Text>
          <Text style={[styles.errorMsg, { color: "#7f1d1d", fontFamily: "Inter_400Regular" }]}>
            {errorMsg}
          </Text>
          <Pressable
            onPress={reset}
            style={[styles.primaryBtn, { backgroundColor: colors.destructive }]}
          >
            <Text style={[styles.primaryBtnText, { fontFamily: "Poppins_600SemiBold" }]}>
              Try again
            </Text>
          </Pressable>
        </View>
      )}

      {/* Processing indicator */}
      {isProcessing && (
        <View style={[styles.processingCard, { backgroundColor: colors.accent, borderColor: colors.primary + "40" }]}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.processingText, { color: colors.primary, fontFamily: "Poppins_600SemiBold" }]}>
            {progress}
          </Text>
          <Text style={[styles.processingHint, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
            This may take a moment depending on file size
          </Text>
        </View>
      )}

      {/* Convert button */}
      {files.length > 0 && state === "idle" && (
        <Pressable
          onPress={convert}
          style={({ pressed }) => [
            styles.primaryBtn,
            { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1, marginTop: 20 },
          ]}
        >
          <Feather name="zap" size={18} color="#fff" />
          <Text style={[styles.primaryBtnText, { fontFamily: "Poppins_600SemiBold" }]}>
            Convert Now
          </Text>
        </Pressable>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 20,
  },
  backText: { fontSize: 15, fontWeight: "500" },
  toolHeader: {
    alignItems: "center",
    marginBottom: 28,
    gap: 8,
  },
  toolIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  toolTitle: { fontSize: 22, fontWeight: "700", textAlign: "center" },
  toolDesc: { fontSize: 14, textAlign: "center", lineHeight: 20, maxWidth: 280 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    marginTop: 4,
  },
  chipText: { fontSize: 12, fontWeight: "600" },
  dropArea: {
    borderWidth: 2,
    borderStyle: "dashed",
    borderRadius: 16,
    paddingVertical: 36,
    paddingHorizontal: 20,
    alignItems: "center",
    gap: 8,
    minHeight: 160,
    justifyContent: "center",
  },
  dropText: { fontSize: 16, fontWeight: "600", textAlign: "center" },
  dropHint: { fontSize: 12, textAlign: "center" },
  fileName: { fontSize: 12, maxWidth: 240, textAlign: "center" },
  changeFiles: { fontSize: 12, marginTop: 4, fontWeight: "500" },
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    borderRadius: 14,
    marginTop: 12,
  },
  primaryBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  secondaryBtn: {
    alignItems: "center",
    paddingVertical: 12,
  },
  secondaryBtnText: {
    fontSize: 14,
    fontWeight: "500",
  },
  processingCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 28,
    alignItems: "center",
    gap: 12,
    marginTop: 20,
  },
  processingText: { fontSize: 16, fontWeight: "600" },
  processingHint: { fontSize: 13, textAlign: "center" },
  resultCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    gap: 8,
    marginTop: 20,
  },
  resultTitle: { fontSize: 20, fontWeight: "700" },
  resultFile: { fontSize: 13, textAlign: "center" },
  errorCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    gap: 8,
    marginTop: 20,
  },
  errorTitle: { fontSize: 18, fontWeight: "600" },
  errorMsg: { fontSize: 13, textAlign: "center", lineHeight: 19 },
});
