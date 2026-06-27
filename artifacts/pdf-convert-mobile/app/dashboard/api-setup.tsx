import { Feather } from "@expo/vector-icons";
import { SignInRequiredIcon } from "@/components/SignInRequiredIcon";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import { Modal, Platform, Pressable, StyleSheet, Text, View } from "react-native";

import { Loader } from "@/components/Loader";
import { Badge, Button, Card, Field, ScreenScroll } from "@/components/ui";
import { API_BASE_URL } from "@/constants/api";
import colors from "@/constants/colors";
import { USE_MOCK_DATA } from "@/constants/config";
import { ROUTES } from "@/constants/routes";
import { cardShadow, fonts } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import { mockApi } from "@/mocks/mockApi";

const C = colors.light;
const KEY_LIMIT = 3;

const monoFont = Platform.select({ ios: "Menlo", android: "monospace", default: "monospace" });

/** Normalised API key shape used in this screen regardless of source. */
interface KeyItem {
  id: string;
  name: string | null;
  maskedKey: string;
  createdAt: string | null;
  lastUsedAt: string | null;
}

/** Cross-platform clipboard helper */
async function copyToClipboard(text: string): Promise<boolean> {
  try {
    const nav = (globalThis as { navigator?: { clipboard?: { writeText(t: string): Promise<void> } } }).navigator;
    if (nav?.clipboard?.writeText) {
      await nav.clipboard.writeText(text);
      return true;
    }
  } catch {
    // ignore
  }
  return false;
}

function formatDate(value: string | null): string {
  if (!value) return "—";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

const STEPS: { title: string; body: string }[] = [
  {
    title: "Generate API Key",
    body: `Create your API key below to authenticate your requests. You can keep up to ${KEY_LIMIT} keys.`,
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

// ── Backend helpers (used when USE_MOCK_DATA is false) ─────────────────────

async function fetchKeys(token: string): Promise<KeyItem[]> {
  const res = await fetch(`${API_BASE_URL}/keys`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const body = await res.json();
  if (!res.ok || !body.success) throw new Error(body.error ?? "Failed to load keys");
  return (body.data as any[]).map((k) => ({
    id: k.id,
    name: k.name ?? null,
    maskedKey: k.maskedKey ?? "sk-••••",
    createdAt: k.createdAt ?? null,
    lastUsedAt: k.lastUsedAt ?? null,
  }));
}

async function createKey(token: string, name: string): Promise<{ item: KeyItem; rawKey: string }> {
  const res = await fetch(`${API_BASE_URL}/keys`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ name: name || undefined }),
  });
  const body = await res.json();
  if (!res.ok || !body.success) throw new Error(body.error ?? "Failed to create key");
  const d = body.data;
  return {
    rawKey: d.apiKey as string,
    item: {
      id: d.id,
      name: d.name ?? null,
      maskedKey: d.maskedKey ?? "sk-••••",
      createdAt: d.createdAt ?? null,
      lastUsedAt: null,
    },
  };
}

async function deleteKey(token: string, id: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/keys/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || (body && body.success === false)) throw new Error(body.error ?? "Failed to revoke key");
}

// ── Auth gate ──────────────────────────────────────────────────────────────

function AuthGate() {
  const router = useRouter();
  return (
    <View style={styles.gate}>
      <View style={styles.gateIcon}>
        <SignInRequiredIcon />
      </View>
      <Text style={styles.gateTitle}>Sign in required</Text>
      <Text style={styles.gateText}>Sign in to generate and manage your API keys.</Text>
      <Button label="Sign In" icon="log-in" onPress={() => router.push(ROUTES.signIn as never)} style={{ alignSelf: "center" }} />
    </View>
  );
}

// ── Main screen ────────────────────────────────────────────────────────────

export default function ApiSetupScreen() {
  const { isAuthenticated, token } = useAuth();

  const [keys, setKeys] = useState<KeyItem[]>([]);
  const [keysLoading, setKeysLoading] = useState(true);
  const [newKeyName, setNewKeyName] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [revealedKey, setRevealedKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const [revokeTarget, setRevokeTarget] = useState<KeyItem | null>(null);
  const [revoking, setRevoking] = useState(false);

  const loadKeys = useCallback(async () => {
    if (!isAuthenticated) return;
    setKeysLoading(true);
    setError(null);
    try {
      if (USE_MOCK_DATA) {
        const raw = await mockApi.getApiKeys();
        setKeys(
          raw.map((k) => ({
            id: k.id,
            name: k.name,
            maskedKey: `${k.prefix}••••${k.key.slice(-4)}`,
            createdAt: k.createdAt,
            lastUsedAt: k.lastUsedAt,
          })),
        );
      } else {
        setKeys(await fetchKeys(token ?? ""));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load keys");
    } finally {
      setKeysLoading(false);
    }
  }, [isAuthenticated, token]);

  useEffect(() => {
    loadKeys();
  }, [loadKeys]);

  const atLimit = keys.length >= KEY_LIMIT;

  const handleCreate = async () => {
    if (creating || atLimit) return;
    setCreating(true);
    setError(null);
    try {
      if (USE_MOCK_DATA) {
        const created = await mockApi.createApiKey(newKeyName.trim());
        setKeys((prev) => [
          {
            id: created.id,
            name: created.name,
            maskedKey: `${created.prefix}••••${created.key.slice(-4)}`,
            createdAt: created.createdAt,
            lastUsedAt: null,
          },
          ...prev,
        ]);
        setRevealedKey(created.key);
      } else {
        const { item, rawKey } = await createKey(token ?? "", newKeyName.trim());
        setKeys((prev) => [item, ...prev]);
        setRevealedKey(rawKey);
      }
      setNewKeyName("");
      setCopied(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create key");
    } finally {
      setCreating(false);
    }
  };

  const handleCopy = async () => {
    if (!revealedKey) return;
    const ok = await copyToClipboard(revealedKey);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const closeReveal = () => {
    setRevealedKey(null);
    setCopied(false);
  };

  const confirmRevoke = async () => {
    if (!revokeTarget || revoking) return;
    setRevoking(true);
    setError(null);
    try {
      if (USE_MOCK_DATA) {
        await mockApi.deleteApiKey(revokeTarget.id);
      } else {
        await deleteKey(token ?? "", revokeTarget.id);
      }
      setKeys((prev) => prev.filter((k) => k.id !== revokeTarget.id));
      setRevokeTarget(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to revoke key");
    } finally {
      setRevoking(false);
    }
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

        {error ? (
          <View style={styles.errorBox}>
            <Feather name="alert-circle" size={15} color={C.destructive} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

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
            <Text style={styles.limitNote}>You've reached the limit of {KEY_LIMIT} keys.</Text>
          ) : null}
        </View>

        {/* Keys list */}
        {keysLoading ? (
          <View style={{ alignItems: "center", paddingVertical: 24 }}>
            <Loader size={48} />
          </View>
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
                  <Badge label="active" tone="success" />
                </View>
                <Text style={styles.keyMask} numberOfLines={1}>
                  {k.maskedKey}
                </Text>
                <Text style={styles.keyMeta}>
                  Created {formatDate(k.createdAt)} · Last used{" "}
                  {k.lastUsedAt ? formatDate(k.lastUsedAt) : "never"}
                </Text>
                <Pressable
                  style={({ pressed }) => [styles.revokeBtn, { opacity: pressed ? 0.6 : 1 }]}
                  onPress={() => setRevokeTarget(k)}
                  hitSlop={6}
                  testID={`button-revoke-${k.id}`}
                >
                  <Feather name="trash-2" size={15} color={C.destructive} />
                  <Text style={styles.revokeText}>Revoke</Text>
                </Pressable>
              </View>
            ))}
          </View>
        )}
      </Card>

      {/* Reveal-once dialog */}
      <Modal visible={!!revealedKey} transparent animationType="fade" onRequestClose={closeReveal}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Copy your API key</Text>
            <Text style={styles.modalDesc}>
              This is the only time the full key will be shown. Store it somewhere safe.
            </Text>
            <View style={styles.revealRow}>
              <Text style={styles.revealCode} selectable testID="text-revealed-key">
                {revealedKey}
              </Text>
            </View>
            <Pressable
              style={({ pressed }) => [styles.copyBtn, { opacity: pressed ? 0.85 : 1 }]}
              onPress={handleCopy}
              testID="button-copy-key"
            >
              <Feather name={copied ? "check" : "copy"} size={16} color={C.primary} />
              <Text style={styles.copyText}>{copied ? "Copied!" : "Copy key"}</Text>
            </Pressable>
            <Button label="Done" onPress={closeReveal} fullWidth testID="button-reveal-done" />
          </View>
        </View>
      </Modal>

      {/* Revoke confirmation */}
      <Modal visible={!!revokeTarget} transparent animationType="fade" onRequestClose={() => setRevokeTarget(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Revoke this API key?</Text>
            <Text style={styles.modalDesc}>
              Any application using{" "}
              <Text style={styles.modalMono}>{revokeTarget?.maskedKey ?? ""}</Text> will immediately
              stop working. This cannot be undone.
            </Text>
            <View style={styles.modalActions}>
              <Button label="Cancel" variant="outline" onPress={() => setRevokeTarget(null)} fullWidth />
              <Pressable
                style={({ pressed }) => [styles.dangerBtn, { opacity: pressed || revoking ? 0.7 : 1 }]}
                onPress={confirmRevoke}
                disabled={revoking}
                testID="button-confirm-revoke"
              >
                <Text style={styles.dangerBtnText}>{revoking ? "Revoking…" : "Revoke key"}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
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

  errorBox: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#fff0f0", borderRadius: 8, padding: 10, marginTop: 12 },
  errorText: { fontSize: 13, color: C.destructive, fontFamily: fonts.body, flex: 1 },

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
  revokeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    marginTop: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.card,
  },
  revokeText: { fontSize: 13, color: C.destructive, fontFamily: fonts.bodySemibold },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15,23,42,0.45)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  modalCard: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: C.card,
    borderRadius: 18,
    padding: 22,
    gap: 14,
  },
  modalTitle: { fontSize: 18, color: C.foreground, fontFamily: fonts.headingBold },
  modalDesc: { fontSize: 14, lineHeight: 21, color: C.mutedForeground, fontFamily: fonts.body },
  modalMono: { fontFamily: monoFont, color: C.foreground },
  revealRow: {
    backgroundColor: C.muted,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    padding: 14,
  },
  revealCode: { fontSize: 13, lineHeight: 20, color: C.foreground, fontFamily: monoFont },
  copyBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 11,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.primary,
    backgroundColor: C.blue50,
  },
  copyText: { fontSize: 14, color: C.primary, fontFamily: fonts.bodySemibold },
  modalActions: { gap: 12, marginTop: 2 },
  dangerBtn: {
    backgroundColor: C.destructive,
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: "center",
  },
  dangerBtnText: { fontSize: 15, color: "#fff", fontFamily: fonts.bodySemibold },

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
