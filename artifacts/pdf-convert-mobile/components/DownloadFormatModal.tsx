import { Feather } from "@expo/vector-icons";
import React from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SvgXml } from "react-native-svg";

import { Button, Field } from "@/components/ui";
import { CELEBRATE_XML } from "@/constants/celebrateIcon";
import colors from "@/constants/colors";
import { formatIconXml } from "@/constants/formatIcons";
import { fonts } from "@/constants/theme";

const C = colors.light;

type FeatherName = keyof typeof Feather.glyphMap;

export interface FormatChoice {
  id: string;
  label: string;
  ext: string;
  color: string;
  icon: FeatherName;
}

interface DownloadFormatModalProps {
  visible: boolean;
  onClose: () => void;
  /** Big celebratory heading. Defaults to "Awesome job!". */
  title?: string;
  /** One-line context under the title. */
  subtitle: string;
  /** Label above the format grid. Defaults to "Save as:". */
  sectionLabel?: string;
  /** Selectable output formats. */
  formats: FormatChoice[];
  selectedId: string;
  onSelect: (id: string) => void;
  /** Primary action label/icon. Defaults to "Download" / "download". */
  confirmLabel?: string;
  confirmIcon?: FeatherName;
  onConfirm: () => void;
  /** Disables the primary action (e.g. while saving). */
  busy?: boolean;
  /** Optional editable file name section (shown only when provided). */
  fileName?: string;
  onChangeFileName?: (value: string) => void;
  previewName?: string;
}

/** Filled selection tick (user-provided glyph), tinted with the given colour. */
function tickXml(color: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" id="correct">
  <path fill="${color}" d="M32 12a20 20 0 1 0 20 20 20 20 0 0 0-20-20Zm9.41 16.41-11 11a2 2 0 0 1-2.82 0l-6-6a2 2 0 0 1 2.82-2.82L29 35.17l9.59-9.58a2 2 0 0 1 2.82 2.82Z"/>
</svg>`;
}

/**
 * Shared "result is ready — pick an output format" chooser. Used by every
 * conversion tool's Download action and by the camera scanner's Save action so
 * the format-selection UX is identical everywhere.
 */
export default function DownloadFormatModal({
  visible,
  onClose,
  title = "Awesome job!",
  subtitle,
  sectionLabel = "Save as:",
  formats,
  selectedId,
  onSelect,
  confirmLabel = "Download",
  confirmIcon = "download",
  onConfirm,
  busy = false,
  fileName,
  onChangeFileName,
  previewName,
}: DownloadFormatModalProps) {
  const showFileName = fileName !== undefined && onChangeFileName !== undefined;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <Pressable style={styles.modalBackdrop} onPress={onClose}>
          <Pressable style={styles.modalCard} onPress={() => {}}>
            <View style={styles.celebrateHeader}>
              <View style={styles.celebrateIcon}>
                <SvgXml xml={CELEBRATE_XML} width={52} height={52} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.celebrateTitle}>{title}</Text>
                <Text style={styles.celebrateSubtitle}>{subtitle}</Text>
              </View>
              <Pressable onPress={onClose} hitSlop={8} testID="button-download-close">
                <Feather name="x" size={22} color={C.mutedForeground} />
              </Pressable>
            </View>

            <Text style={styles.modalSectionLabel}>{sectionLabel}</Text>
            <View style={styles.formatGrid}>
              {formats.map((f) => {
                const active = selectedId === f.id;
                const iconXml = formatIconXml(f.ext);
                return (
                  <Pressable
                    key={f.id}
                    onPress={() => onSelect(f.id)}
                    style={[styles.formatTile, active && styles.formatTileActive]}
                    testID={`format-${f.id}`}
                  >
                    {active ? (
                      <SvgXml xml={tickXml(C.primary)} width={20} height={20} />
                    ) : (
                      <Feather name="circle" size={18} color={C.border} />
                    )}
                    {iconXml ? (
                      <SvgXml xml={iconXml} width={28} height={28} />
                    ) : (
                      <View style={[styles.formatBadge, { backgroundColor: f.color }]}>
                        <Feather name={f.icon} size={15} color="#fff" />
                      </View>
                    )}
                    <Text style={styles.formatLabel} numberOfLines={1}>
                      {f.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {showFileName ? (
              <View style={{ marginTop: 4 }}>
                <Field
                  label="File name"
                  value={fileName}
                  onChangeText={onChangeFileName}
                  autoCapitalize="none"
                  autoCorrect={false}
                  placeholder="output"
                />
                {previewName ? (
                  <Text style={styles.modalPreview} numberOfLines={1}>
                    {previewName}
                  </Text>
                ) : null}
              </View>
            ) : null}

            <View style={styles.modalActions}>
              <Button
                label="Cancel"
                variant="outline"
                onPress={onClose}
                style={{ flex: 1 }}
                testID="button-download-cancel"
              />
              <Button
                label={confirmLabel}
                icon={confirmIcon}
                onPress={onConfirm}
                disabled={busy}
                style={{ flex: 1 }}
                testID="button-download-confirm"
              />
            </View>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(15,23,42,0.45)",
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: C.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 28,
    gap: 12,
    ...(Platform.OS === "web" ? { maxWidth: 460, width: "100%", alignSelf: "center" } : null),
  },
  celebrateHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 4,
  },
  celebrateIcon: {
    width: 52,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
  },
  celebrateTitle: { fontSize: 20, color: C.foreground, fontFamily: fonts.headingBold },
  celebrateSubtitle: {
    fontSize: 13,
    color: C.mutedForeground,
    fontFamily: fonts.body,
    marginTop: 1,
  },
  modalSectionLabel: {
    fontSize: 14,
    color: C.foreground,
    fontFamily: fonts.bodySemibold,
    marginTop: 4,
  },
  formatGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 4,
  },
  formatTile: {
    flexBasis: "47%",
    flexGrow: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: C.border,
    backgroundColor: C.background,
  },
  formatTileActive: { borderColor: C.primary, backgroundColor: C.surfaceAlt },
  formatBadge: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  formatLabel: {
    flex: 1,
    fontSize: 14,
    color: C.foreground,
    fontFamily: fonts.bodySemibold,
  },
  modalPreview: {
    fontSize: 12,
    color: C.mutedForeground,
    fontFamily: fonts.body,
    marginTop: 6,
  },
  modalActions: { flexDirection: "row", gap: 10, marginTop: 8 },
});
