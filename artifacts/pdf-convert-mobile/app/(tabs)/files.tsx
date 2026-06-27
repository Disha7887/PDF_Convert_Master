import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";

import LoginRequiredModal from "@/components/LoginRequiredModal";
import ToolLottieIcon from "@/components/ToolLottieIcon";
import { Field, ScreenScroll } from "@/components/ui";
import colors from "@/constants/colors";
import { ROUTES } from "@/constants/routes";
import { cardShadow, fonts } from "@/constants/theme";
import {
  categoryOf,
  loadFiles,
  removeFile,
  searchFiles,
  type FileCategory,
  type StoredFileEntry,
  type StoredFileKind,
} from "@/constants/files";
import { API_ORIGIN } from "@/constants/api";
import { useAuth } from "@/contexts/AuthContext";
import { downloadAndSave, saveFile } from "@/services/files";
import { deleteConversion } from "@/services/conversions";
import { isGuestDownloadExpired } from "@/services/downloadGate";

const C = colors.light;
type FeatherName = keyof typeof Feather.glyphMap;

function formatDate(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

const KIND_ICON: Record<StoredFileKind, FeatherName> = {
  "scanned-image": "image",
  "converted-pdf": "file-text",
  "converted-file": "file",
};

export default function FilesScreen() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [files, setFiles] = useState<StoredFileEntry[]>([]);
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<FileCategory | null>(null);
  const [loginPromptOpen, setLoginPromptOpen] = useState(false);

  const reload = useCallback(() => {
    loadFiles().then(setFiles);
  }, []);

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload]),
  );

  const counts = useMemo(() => {
    let scanned = 0;
    let converted = 0;
    for (const f of files) {
      if (categoryOf(f.kind) === "scanned") scanned += 1;
      else converted += 1;
    }
    return { scanned, converted };
  }, [files]);

  const visible = useMemo(() => {
    const byCategory = activeCategory
      ? files.filter((f) => categoryOf(f.kind) === activeCategory)
      : files;
    return searchFiles(byCategory, query);
  }, [files, activeCategory, query]);

  const onRowAction = useCallback(
    (entry: StoredFileEntry) => {
      const actions: { text: string; onPress?: () => void; style?: "destructive" | "cancel" }[] = [];
      if (entry.uri) {
        actions.push({
          text: "Download",
          onPress: async () => {
            // Converted files follow the guest 12h re-download window; scanned
            // images are the user's own local captures and stay available.
            if (
              categoryOf(entry.kind) === "converted" &&
              isGuestDownloadExpired(entry.createdAt, isAuthenticated)
            ) {
              setLoginPromptOpen(true);
              return;
            }
            // The stored `name` is a display name without an extension (e.g.
            // "Scan Jun 26"); the real extension lives in `outputFormat`. Append
            // it so the saved file is named "<name>.pdf" — without the extension
            // Android writes it as application/octet-stream and the Files app
            // reports "cannot open document".
            const ext = entry.outputFormat?.replace(/^\./, "").toLowerCase();
            const downloadName =
              ext && !entry.name.toLowerCase().endsWith(`.${ext}`)
                ? `${entry.name}.${ext}`
                : entry.name;
            try {
              // Prefer the durable backend copy (with the chosen format) for
              // server conversions: the local uri can be a different
              // representation than the chosen output format (e.g. OCR keeps the
              // PDF locally but the user picked TXT), which would otherwise save
              // mismatched bytes under a text name (a broken file). Fall back to
              // the local file for scanned/editor outputs that have no job.
              const res =
                categoryOf(entry.kind) === "converted" && entry.jobId
                  ? await downloadAndSave(
                      `${API_ORIGIN}/api/download/${entry.jobId}${ext ? `?format=${ext}` : ""}`,
                      downloadName,
                    )
                  : await saveFile(entry.uri!, downloadName);
              if (res.status === "saved") {
                Alert.alert("Downloaded", `${downloadName} was saved to ${res.location}.`);
              } else if (res.status === "failed") {
                Alert.alert("Couldn't save", "Could not save the file. Please try again.");
              }
            } catch (err) {
              const status = (err as { status?: number } | null)?.status;
              if (status === 401 || status === 403) {
                Alert.alert("Sign in required", "Please log in to download this file.");
              } else if (status === 404) {
                Alert.alert(
                  "File unavailable",
                  "This file is no longer available to download. Please convert it again.",
                );
              } else {
                Alert.alert("Couldn't save", "Could not save the file. Please try again.");
              }
            }
          },
        });
      }
      actions.push({
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await removeFile(entry.id);
          reload();
          // Also purge the durable backend/Backblaze copy so the file isn't kept
          // forever. Best-effort — the local entry is already gone either way.
          if (entry.jobId) {
            try {
              await deleteConversion(entry.jobId);
            } catch {
              // ignore — local removal already succeeded
            }
          }
        },
      });
      actions.push({ text: "Cancel", style: "cancel" });
      Alert.alert(entry.name, undefined, actions);
    },
    [reload, isAuthenticated],
  );

  const toggleCategory = (cat: FileCategory) =>
    setActiveCategory((prev) => (prev === cat ? null : cat));

  return (
    <ScreenScroll navInset tabBar>
      <LoginRequiredModal
        visible={loginPromptOpen}
        onClose={() => setLoginPromptOpen(false)}
      />
      <Field
        icon="search"
        placeholder="Search files & scans"
        value={query}
        onChangeText={setQuery}
        autoCapitalize="none"
        returnKeyType="search"
      />

      <View style={styles.categoryRow}>
        <CategoryCard
          label="Scanned Images"
          count={counts.scanned}
          icon="image"
          active={activeCategory === "scanned"}
          onPress={() => toggleCategory("scanned")}
        />
        <CategoryCard
          label="Converted PDFs"
          count={counts.converted}
          icon="file-text"
          active={activeCategory === "converted"}
          onPress={() => toggleCategory("converted")}
        />
      </View>

      <View style={styles.listHeaderRow}>
        <Text style={styles.listHeading}>
          {activeCategory === "scanned"
            ? "Scanned Images"
            : activeCategory === "converted"
              ? "Converted PDFs"
              : "All files"}
        </Text>
        {activeCategory ? (
          <Pressable onPress={() => setActiveCategory(null)} hitSlop={8}>
            <Text style={styles.clearLink}>Show all</Text>
          </Pressable>
        ) : null}
      </View>

      {visible.length === 0 ? (
        <EmptyState hasFiles={files.length > 0} onScan={() => router.push(ROUTES.scanner as never)} />
      ) : (
        <View style={[styles.list, cardShadow]}>
          {visible.map((entry, i) => (
            <Pressable
              key={entry.id}
              onPress={() => onRowAction(entry)}
              style={({ pressed }) => [
                styles.row,
                i > 0 && styles.rowDivider,
                { backgroundColor: pressed ? C.muted : "transparent" },
              ]}
            >
              {entry.thumbnailUri ? (
                <Image source={{ uri: entry.thumbnailUri }} style={styles.thumb} contentFit="cover" />
              ) : entry.toolId ? (
                <View style={styles.thumbFallback}>
                  <ToolLottieIcon toolId={entry.toolId} size={34} autoPlay={false} loop={false} />
                </View>
              ) : (
                <View style={styles.thumbFallback}>
                  <Feather name={KIND_ICON[entry.kind]} size={20} color={C.primary} />
                </View>
              )}
              <View style={{ flex: 1 }}>
                <Text style={styles.rowName} numberOfLines={1}>
                  {entry.name}
                </Text>
                <Text style={styles.rowMeta} numberOfLines={1}>
                  {entry.elementCount} {entry.elementCount === 1 ? "element" : "elements"} ·{" "}
                  {formatDate(entry.createdAt)}
                </Text>
              </View>
              <Feather name="more-vertical" size={18} color={C.mutedForeground} />
            </Pressable>
          ))}
        </View>
      )}

      <Pressable
        style={({ pressed }) => [styles.fab, { opacity: pressed ? 0.9 : 1 }]}
        onPress={() => router.push(ROUTES.scanner as never)}
      >
        <Feather name="camera" size={22} color="#fff" />
        <Text style={styles.fabText}>Scan</Text>
      </Pressable>
    </ScreenScroll>
  );
}

function CategoryCard({
  label,
  count,
  icon,
  active,
  onPress,
}: {
  label: string;
  count: number;
  icon: FeatherName;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.categoryCard,
        cardShadow,
        active && styles.categoryCardActive,
        { opacity: pressed ? 0.92 : 1 },
      ]}
    >
      <View style={[styles.categoryIcon, active && styles.categoryIconActive]}>
        <Feather name={icon} size={20} color={active ? "#fff" : C.primary} />
      </View>
      <Text style={styles.categoryCount}>{count}</Text>
      <Text style={styles.categoryLabel}>{label}</Text>
    </Pressable>
  );
}

function EmptyState({ hasFiles, onScan }: { hasFiles: boolean; onScan: () => void }) {
  return (
    <View style={[styles.empty, cardShadow]}>
      <View style={styles.emptyIcon}>
        <Feather name="folder" size={26} color={C.primary} />
      </View>
      <Text style={styles.emptyTitle}>{hasFiles ? "No matching files" : "No files yet"}</Text>
      <Text style={styles.emptySub}>
        {hasFiles
          ? "Try a different search or category."
          : "Scanned documents and converted files will appear here."}
      </Text>
      {!hasFiles ? (
        <Pressable style={styles.emptyBtn} onPress={onScan}>
          <Feather name="camera" size={16} color="#fff" />
          <Text style={styles.emptyBtnText}>Scan a document</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  categoryRow: { flexDirection: "row", gap: 12, marginTop: 16 },
  categoryCard: {
    flex: 1,
    backgroundColor: C.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    padding: 16,
    gap: 6,
  },
  categoryCardActive: { borderColor: C.primary, backgroundColor: C.blue50 },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: C.accent,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  categoryIconActive: { backgroundColor: C.primary },
  categoryCount: { fontSize: 22, color: C.foreground, fontFamily: fonts.headingBold },
  categoryLabel: { fontSize: 13, color: C.mutedForeground, fontFamily: fonts.bodyMedium },
  listHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 26,
    marginBottom: 12,
  },
  listHeading: { fontSize: 17, color: C.foreground, fontFamily: fonts.headingSemibold },
  clearLink: { fontSize: 13, color: C.primary, fontFamily: fonts.bodySemibold },
  list: {
    backgroundColor: C.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    overflow: "hidden",
  },
  row: { flexDirection: "row", alignItems: "center", gap: 14, paddingHorizontal: 14, paddingVertical: 12 },
  rowDivider: { borderTopWidth: 1, borderTopColor: C.border },
  thumb: { width: 46, height: 56, borderRadius: 8, backgroundColor: C.muted },
  thumbFallback: {
    width: 46,
    height: 56,
    borderRadius: 8,
    backgroundColor: C.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  rowName: { fontSize: 15, color: C.foreground, fontFamily: fonts.bodySemibold },
  rowMeta: { fontSize: 12.5, color: C.mutedForeground, fontFamily: fonts.body, marginTop: 3 },
  empty: {
    backgroundColor: C.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: C.border,
    padding: 28,
    alignItems: "center",
    gap: 8,
  },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: C.accent,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  emptyTitle: { fontSize: 16, color: C.foreground, fontFamily: fonts.headingSemibold },
  emptySub: {
    fontSize: 13.5,
    lineHeight: 20,
    color: C.mutedForeground,
    fontFamily: fonts.body,
    textAlign: "center",
  },
  emptyBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: C.primary,
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 12,
    marginTop: 10,
  },
  emptyBtnText: { color: "#fff", fontSize: 14, fontFamily: fonts.bodySemibold },
  fab: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    alignSelf: "center",
    backgroundColor: C.primary,
    paddingHorizontal: 26,
    paddingVertical: 14,
    borderRadius: 999,
    marginTop: 24,
    shadowColor: C.primary,
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  fabText: { color: "#fff", fontSize: 15, fontFamily: fonts.bodySemibold },
});
