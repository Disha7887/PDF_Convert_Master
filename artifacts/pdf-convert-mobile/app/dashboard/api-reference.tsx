import { Feather } from "@expo/vector-icons";
import { SignInRequiredIcon } from "@/components/SignInRequiredIcon";
import { useRouter } from "expo-router";
import React from "react";
import { Platform, StyleSheet, Text, View } from "react-native";

import { Badge, Button, Card, ScreenScroll } from "@/components/ui";
import colors from "@/constants/colors";
import { ROUTES } from "@/constants/routes";
import { cardShadow, fonts } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import { tools, type Tool } from "@/constants/tools";
import { API_BASE_URL } from "@/constants/api";

const C = colors.light;

const monoFont = Platform.select({ ios: "Menlo", android: "monospace", default: "monospace" });

const BASE_URL = `${API_BASE_URL}/v1`;

// Tool types backed by a real /api/v1 endpoint (the server ToolType enum).
// Every other catalog tool is client-side only and has no public endpoint.
const API_TOOL_TYPES = new Set<string>([
  "pdf_to_word", "pdf_to_excel", "pdf_to_powerpoint", "pdf_to_images",
  "word_to_pdf", "excel_to_pdf", "powerpoint_to_pdf", "html_to_pdf",
  "images_to_pdf", "resize_image", "crop_image", "rotate_image",
  "convert_image_format", "compress_image", "upscale_image", "remove_background",
  "merge_pdfs", "split_pdf", "rotate_pdf", "compress_pdf", "ocr_pdf",
]);

const apiTools = tools.filter((t) => API_TOOL_TYPES.has(t.serverToolType));

// Tool-specific request options honoured by the live /api/v1 endpoint.
const TOOL_OPTIONS: Record<string, { name: string; desc: string }[]> = {
  convert_image_format: [
    { name: "outputFormat", desc: "Target format — one of png, jpg, webp, gif, avif, tiff" },
  ],
  compress_image: [{ name: "quality", desc: "Compression quality 10–100 (default 80)" }],
  resize_image: [
    { name: "width", desc: "Target width in px" },
    { name: "height", desc: "Target height in px" },
    { name: "percentage", desc: "Scale by percent instead of width/height" },
    { name: "maintainAspectRatio", desc: "Keep aspect ratio (default true)" },
  ],
  rotate_image: [
    { name: "angle", desc: "Rotation in degrees (default 90)" },
    { name: "flipHorizontal", desc: "Mirror horizontally (true/false)" },
    { name: "flipVertical", desc: "Mirror vertically (true/false)" },
  ],
  crop_image: [
    { name: "x", desc: "Left offset in px" },
    { name: "y", desc: "Top offset in px" },
    { name: "width", desc: "Crop width in px" },
    { name: "height", desc: "Crop height in px (omit all four for a centered 75% crop)" },
  ],
  upscale_image: [
    { name: "scale", desc: "Upscale factor — 2 or 4 (default 4); requires AI upscaling" },
  ],
};

function fileRule(type: string): string {
  return type === "merge_pdfs"
    ? "2–20 files (one field per file, named files)"
    : "Exactly 1 file (field named file)";
}

// Backend-enforced limits & accepted formats, mirrored from the api-server
// tool config (storage.ts). Keep in sync if the server limits change.
const BACKEND_TOOL_META: Record<string, { maxFileSizeMB: number; formats: string[] }> = {
  pdf_to_word: { maxFileSizeMB: 50, formats: ["pdf"] },
  pdf_to_excel: { maxFileSizeMB: 50, formats: ["pdf"] },
  pdf_to_powerpoint: { maxFileSizeMB: 50, formats: ["pdf"] },
  pdf_to_images: { maxFileSizeMB: 100, formats: ["pdf"] },
  word_to_pdf: { maxFileSizeMB: 100, formats: ["doc", "docx"] },
  excel_to_pdf: { maxFileSizeMB: 100, formats: ["xls", "xlsx"] },
  powerpoint_to_pdf: { maxFileSizeMB: 200, formats: ["ppt", "pptx"] },
  html_to_pdf: { maxFileSizeMB: 10, formats: ["html", "htm"] },
  images_to_pdf: { maxFileSizeMB: 100, formats: ["jpg", "jpeg", "png", "gif", "bmp", "tiff"] },
  compress_image: { maxFileSizeMB: 50, formats: ["jpg", "jpeg", "png", "gif", "bmp"] },
  convert_image_format: { maxFileSizeMB: 50, formats: ["jpg", "jpeg", "png", "gif", "bmp", "tiff", "webp"] },
  crop_image: { maxFileSizeMB: 50, formats: ["jpg", "jpeg", "png", "gif", "bmp"] },
  resize_image: { maxFileSizeMB: 50, formats: ["jpg", "jpeg", "png", "gif", "bmp"] },
  rotate_image: { maxFileSizeMB: 50, formats: ["jpg", "jpeg", "png", "gif", "bmp"] },
  upscale_image: { maxFileSizeMB: 25, formats: ["jpg", "jpeg", "png", "webp"] },
  remove_background: { maxFileSizeMB: 25, formats: ["jpg", "jpeg", "png"] },
  merge_pdfs: { maxFileSizeMB: 200, formats: ["pdf"] },
  split_pdf: { maxFileSizeMB: 100, formats: ["pdf"] },
  compress_pdf: { maxFileSizeMB: 200, formats: ["pdf"] },
  rotate_pdf: { maxFileSizeMB: 100, formats: ["pdf"] },
  ocr_pdf: { maxFileSizeMB: 100, formats: ["pdf"] },
};

const CURL_EXAMPLE = `curl -X POST "${BASE_URL}/pdf_to_word" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -F "file=@document.pdf" \\
  -o converted_output`;

const RESPONSE_EXAMPLE = `200 OK
Content-Type: application/octet-stream

<binary file contents>`;

function CodeBlock({ code }: { code: string }) {
  return (
    <View style={styles.codeBlock}>
      <Text style={styles.codeText}>{code}</Text>
    </View>
  );
}

function AuthGate() {
  const router = useRouter();
  return (
    <View style={styles.gate}>
      <View style={styles.gateIcon}>
        <SignInRequiredIcon />
      </View>
      <Text style={styles.gateTitle}>Sign in required</Text>
      <Text style={styles.gateText}>Sign in to view the API reference and your endpoints.</Text>
      <Button label="Sign In" icon="log-in" onPress={() => router.push(ROUTES.signIn as never)} style={{ alignSelf: "center" }} />
    </View>
  );
}

function EndpointCard({ tool }: { tool: Tool }) {
  const opts = TOOL_OPTIONS[tool.serverToolType] || [];
  const meta = BACKEND_TOOL_META[tool.serverToolType];
  const accepts = meta ? meta.formats.map((f) => `.${f}`).join(", ") : tool.acceptedFormats.join(", ");
  const maxSize = meta ? `${meta.maxFileSizeMB} MB` : tool.maxFileSize;
  return (
    <View style={styles.endpoint} testID={`endpoint-${tool.serverToolType}`}>
      <View style={styles.endpointHead}>
        <Badge label="POST" tone="success" />
        <Text style={styles.endpointPath} numberOfLines={1}>
          /api/v1/{tool.serverToolType}
        </Text>
      </View>
      <Text style={styles.endpointName}>{tool.title}</Text>
      <Text style={styles.endpointDesc}>{tool.description}</Text>

      <View style={styles.metaRow}>
        <Text style={styles.metaLabel}>Accepts: </Text>
        <Text style={styles.metaValue}>{accepts}</Text>
      </View>
      <View style={styles.metaRow}>
        <Text style={styles.metaLabel}>Max size: </Text>
        <Text style={styles.metaValue}>{maxSize} per file</Text>
      </View>
      <View style={styles.metaRow}>
        <Text style={styles.metaLabel}>Files: </Text>
        <Text style={styles.metaValue}>{fileRule(tool.serverToolType)}</Text>
      </View>
      <View style={styles.metaRow}>
        <Text style={styles.metaLabel}>Options: </Text>
        <Text style={styles.metaValue}>
          {opts.length > 0
            ? opts.map((o) => `${o.name} — ${o.desc}`).join("; ")
            : "None"}
        </Text>
      </View>
    </View>
  );
}

export default function ApiReferenceScreen() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return (
      <ScreenScroll>
        <AuthGate />
      </ScreenScroll>
    );
  }

  return (
    <ScreenScroll>
      <Text style={styles.pageTitle}>API Reference</Text>

      {/* Quick Reference */}
      <Card style={styles.block} elevated={false}>
        <Text style={styles.cardTitle}>Quick Reference</Text>
        <View style={{ gap: 12, marginTop: 14 }}>
          <View style={styles.refBox}>
            <Text style={styles.refLabel}>Base URL</Text>
            <Text style={styles.refMono}>{BASE_URL}</Text>
          </View>
          <View style={styles.refBox}>
            <Text style={styles.refLabel}>Authentication</Text>
            <Text style={styles.refText}>
              <Text style={styles.inlineMono}>Authorization: Bearer &lt;your-api-key&gt;</Text> — create
              one under API Setup.
            </Text>
          </View>
          <View style={styles.refBox}>
            <Text style={styles.refLabel}>Request format</Text>
            <Text style={styles.refText}>
              <Text style={styles.inlineMono}>multipart/form-data</Text> with a{" "}
              <Text style={styles.inlineMono}>file</Text> field. Returns the converted file bytes
              directly.
            </Text>
          </View>
        </View>
      </Card>

      {/* Example Request */}
      <Card style={styles.block} elevated={false}>
        <Text style={styles.cardTitle}>Example Request</Text>
        <Text style={styles.subLabel}>Request</Text>
        <CodeBlock code={CURL_EXAMPLE} />
        <Text style={styles.subLabel}>Response</Text>
        <CodeBlock code={RESPONSE_EXAMPLE} />
        <Text style={styles.note}>
          For <Text style={styles.inlineMono}>merge_pdfs</Text>, send multiple{" "}
          <Text style={styles.inlineMono}>files</Text> fields. For{" "}
          <Text style={styles.inlineMono}>convert_image_format</Text>, add{" "}
          <Text style={styles.inlineMono}>-F 'options=&#123;"outputFormat":"png"&#125;'</Text>.
        </Text>
      </Card>

      {/* Available Endpoints */}
      <Text style={styles.sectionTitle}>Available Endpoints</Text>
      <View style={{ gap: 12 }}>
        {apiTools.map((tool) => (
          <EndpointCard key={tool.id} tool={tool} />
        ))}
      </View>
    </ScreenScroll>
  );
}

const styles = StyleSheet.create({
  pageTitle: { fontSize: 26, color: C.foreground, fontFamily: fonts.headingBold, marginBottom: 18 },
  block: { marginBottom: 18, ...cardShadow },
  cardTitle: { fontSize: 18, color: C.foreground, fontFamily: fonts.headingBold },
  sectionTitle: {
    fontSize: 18,
    color: C.foreground,
    fontFamily: fonts.headingBold,
    marginBottom: 12,
    marginTop: 4,
  },

  refBox: { backgroundColor: C.muted, borderRadius: 12, padding: 14, gap: 6 },
  refLabel: { fontSize: 15, color: C.foreground, fontFamily: fonts.bodySemibold },
  refMono: { fontSize: 13, color: C.mutedForeground, fontFamily: monoFont },
  refText: { fontSize: 14, lineHeight: 20, color: C.mutedForeground, fontFamily: fonts.body },
  inlineMono: { fontFamily: monoFont, color: C.foreground, fontSize: 13 },

  subLabel: {
    fontSize: 13,
    color: C.foreground,
    fontFamily: fonts.bodySemibold,
    marginTop: 14,
    marginBottom: 6,
  },
  codeBlock: {
    backgroundColor: C.surfaceAlt,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 12,
    padding: 14,
  },
  codeText: { fontSize: 12.5, lineHeight: 19, color: C.foreground, fontFamily: monoFont },
  note: { fontSize: 12.5, lineHeight: 19, color: C.mutedForeground, fontFamily: fonts.body, marginTop: 12 },

  endpoint: {
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 14,
    padding: 16,
    gap: 4,
    ...cardShadow,
  },
  endpointHead: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 4 },
  endpointPath: { flex: 1, fontSize: 13.5, color: C.foreground, fontFamily: monoFont },
  endpointName: { fontSize: 15, color: C.foreground, fontFamily: fonts.bodySemibold },
  endpointDesc: { fontSize: 13, lineHeight: 19, color: C.mutedForeground, fontFamily: fonts.body, marginBottom: 6 },
  metaRow: { flexDirection: "row", flexWrap: "wrap" },
  metaLabel: { fontSize: 13, color: C.foreground, fontFamily: fonts.bodyMedium },
  metaValue: { fontSize: 13, color: C.mutedForeground, fontFamily: fonts.body, flexShrink: 1 },

  gate: { alignItems: "center", paddingVertical: 60, gap: 12 },
  gateIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: C.accent,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  gateTitle: { fontSize: 18, color: C.foreground, fontFamily: fonts.headingBold },
  gateText: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
    color: C.mutedForeground,
    fontFamily: fonts.body,
    paddingHorizontal: 20,
    marginBottom: 8,
  },
});
