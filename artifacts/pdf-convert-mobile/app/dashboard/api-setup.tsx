import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";

import { Badge, Button, Card, Field, ScreenScroll } from "@/components/ui";
import colors from "@/constants/colors";
import { ROUTES } from "@/constants/routes";
import { cardShadow, fonts } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import type { ApiKey } from "@/mocks/data";
import { mockApi } from "@/mocks/mockApi";

const C = colors.light;

const monoFont = Platform.select({ ios: "Menlo", android: "monospace", default: "monospace" });

function formatDate(value: string | null): string {
  if (!value) return "—";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function maskKey(k: ApiKey): string {
  const tail = k.key.slice(-4);
  return `${k.prefix}_••••••••${tail}`;
}

const STEPS: { title: string; body: string }[] = [
  {
    title: "Generate API Key",
    body: "Create your API key below to authenticate your requests. You can keep up to 10 keys.",
  },
  {
    title: "Configure Endpoints",
    body: "Send a Bearer token and POST your file to /api/v1/<tool>. See the API Reference for details.",
  },
  {
    title: "Test Integration",
    body: "Make your first API call to ensure everything is working correctly.",
  },
];

function AuthGate() {
  const router = useRouter();
  return (
    <View style={styles.gate}>
      <View style={styles.gateIcon}>
        <Feather name="lock" size={28} color={C.primary} />
      </View>
      <Text style={styles.gateTitle}>Sign in required</Text>
      <Text style={styles.gateText}>Sign in to generate and manage your API keys.</Text>
      <Button label="Sign In" icon="log-in" onPress={() => router.push(ROUTES.signIn as never)} />
    </View>
  );
}

export default function ApiSetupScreen() {
  const { isAuthenticated } = useAuth();

  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [keysLoading, setKeysLoading] = useState(true);
  const [newKeyName, setNewKeyName] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) return;
    let active = true;
    mockApi.getApiKeys().then((k) => {
      if (active) {
        setKeys(k);
        setKeysLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, [isAuthenticated]);

  const atLimit = keys.length >= 10;

  const handleCreate = async () => {
    if (creating || atLimit) return;
    setCreating(true);
    const created = await mockApi.createApiKey(newKeyName.trim());
    setKeys((prev) => [created, ...prev]);
    setNewKeyName("");
    setCreating(false);
  };

  if (!isAuthenticated) {
    return (
      <ScreenScroll>
        <AuthGate />
      </ScreenScroll>
    );
  }

  return (
    <ScreenScroll>
      <Text style={styles.pageTitle}>API Setup</Text>

      {/* Getting Started */}
      <Card style={styles.block} elevated={false}>
        <Text style={styles.cardTitle}>Getting Started</Text>
        <View style={{ gap: 16, marginTop: 14 }}>
          {STEPS.map((step, i) => (
            <View key={step.title} style={styles.stepRow}>
              <View style={styles.stepNum}>
                <Text style={styles.stepNumText}>{i + 1}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.stepTitle}>{step.title}</Text>
                <Text style={styles.stepText}>{step.body}</Text>
              </View>
            </View>
          ))}
        </View>
      </Card>

      {/* API Key Management */}
      <Card style={styles.block} elevated={false}>
        <Text style={styles.cardTitle}>API Key Management</Text>

        {/* Create key */}
        <View style={styles.createRow}>
          <Field
            label="Key name (optional)"
            placeholder="e.g. Production server"
            value={newKeyName}
            onChangeText={setNewKeyName}
            maxLength={60}
          />
          <Button
            label="Create New Key"
            icon="plus"
            onPress={handleCreate}
            loading={creating}
            disabled={atLimit}
            fullWidth
            testID="button-create-key"
          />
          {atLimit ? (
            <Text style={styles.limitNote}>You've reached the limit of 10 keys.</Text>
          ) : null}
        </View>

        {/* Keys list */}
        {keysLoading ? (
          <Text style={styles.emptyText}>Loading keys…</Text>
        ) : keys.length === 0 ? (
          <View style={styles.emptyBox}>
            <View style={styles.emptyIcon}>
              <Feather name="key" size={22} color={C.primary} />
            </View>
            <Text style={styles.emptyCenterText}>You don't have any API keys yet.</Text>
            <Button label="Create your first key" icon="plus" onPress={handleCreate} loading={creating} />
          </View>
        ) : (
          <View style={{ gap: 12, marginTop: 16 }}>
            {keys.map((k) => (
              <View key={k.id} style={styles.keyCard} testID={`row-key-${k.id}`}>
                <View style={styles.keyHead}>
                  <Text style={styles.keyName} numberOfLines={1}>
                    {k.name || "Untitled key"}
                  </Text>
                  <Badge label={k.status} tone={k.status === "active" ? "success" : "danger"} />
                </View>
                <Text style={styles.keyMask} numberOfLines={1}>
                  {maskKey(k)}
                </Text>
                <Text style={styles.keyMeta}>
                  Created {formatDate(k.createdAt)} · Last used{" "}
                  {k.lastUsedAt ? formatDate(k.lastUsedAt) : "never"}
                </Text>
              </View>
            ))}
          </View>
        )}
      </Card>
    </ScreenScroll>
  );
}

const styles = StyleSheet.create({
  pageTitle: { fontSize: 26, color: C.foreground, fontFamily: fonts.headingBold, marginBottom: 18 },
  block: { marginBottom: 18, ...cardShadow },
  cardTitle: { fontSize: 18, color: C.foreground, fontFamily: fonts.headingBold },

  stepRow: { flexDirection: "row", gap: 12 },
  stepNum: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: C.blue100,
    alignItems: "center",
    justifyContent: "center",
  },
  stepNumText: { fontSize: 14, color: C.primary, fontFamily: fonts.bodySemibold },
  stepTitle: { fontSize: 15, color: C.foreground, fontFamily: fonts.bodySemibold, marginBottom: 3 },
  stepText: { fontSize: 14, lineHeight: 20, color: C.mutedForeground, fontFamily: fonts.body },

  createRow: { gap: 12, marginTop: 16 },
  limitNote: { fontSize: 12, color: C.mutedForeground, fontFamily: fonts.body },

  emptyBox: { alignItems: "center", gap: 12, paddingVertical: 28 },
  emptyIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: C.blue100,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: { fontSize: 14, color: C.mutedForeground, fontFamily: fonts.body, marginTop: 16 },
  emptyCenterText: { fontSize: 14, color: C.mutedForeground, fontFamily: fonts.body, textAlign: "center" },

  keyCard: {
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 12,
    backgroundColor: C.muted,
    padding: 14,
    gap: 6,
  },
  keyHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
  keyName: { flex: 1, fontSize: 15, color: C.foreground, fontFamily: fonts.bodySemibold },
  keyMask: { fontSize: 13, color: C.mutedForeground, fontFamily: monoFont },
  keyMeta: { fontSize: 12, color: C.mutedForeground, fontFamily: fonts.body },

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
