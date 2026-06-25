/**
 * Custom purchase-confirmation modal.
 *
 * RevenueCat's test store needs an explicit confirm step, and the SDK guidance
 * is to NOT use `Alert.alert` for it (it can be swallowed). This renders a
 * brand-styled sheet instead, deriving the price/title from the package — never
 * hardcoded.
 */
import { Feather } from "@expo/vector-icons";
import React from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

import { Button } from "@/components/ui";
import colors from "@/constants/colors";
import { fonts } from "@/constants/theme";

const C = colors.light;

export interface PurchaseConfirmDetails {
  title: string;
  priceString: string;
  /** Optional sub-line, e.g. "Billed monthly" or "+100 credits". */
  detail?: string;
}

export function PurchaseConfirmModal({
  visible,
  details,
  loading,
  onConfirm,
  onCancel,
}: {
  visible: boolean;
  details: PurchaseConfirmDetails | null;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <Pressable style={styles.backdrop} onPress={loading ? undefined : onCancel}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.iconWrap}>
            <Feather name="shopping-bag" size={24} color={C.primary} />
          </View>
          <Text style={styles.title}>Confirm Purchase</Text>
          {details ? (
            <>
              <Text style={styles.product}>{details.title}</Text>
              <Text style={styles.price}>{details.priceString}</Text>
              {details.detail ? (
                <Text style={styles.detail}>{details.detail}</Text>
              ) : null}
            </>
          ) : null}
          <View style={styles.actions}>
            <Button
              label="Cancel"
              variant="outline"
              fullWidth
              disabled={loading}
              onPress={onCancel}
              testID="button-cancel-purchase"
            />
            <Button
              label="Buy"
              variant="primary"
              fullWidth
              loading={loading}
              onPress={onConfirm}
              testID="button-confirm-purchase"
            />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(28,36,52,0.55)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  sheet: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: C.background,
    borderRadius: 22,
    padding: 24,
    alignItems: "center",
    gap: 6,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: C.accent,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  title: { fontSize: 18, color: C.foreground, fontFamily: fonts.headingBold },
  product: {
    fontSize: 15,
    color: C.foreground,
    fontFamily: fonts.bodySemibold,
    textAlign: "center",
    marginTop: 4,
  },
  price: {
    fontSize: 28,
    color: C.primary,
    fontFamily: fonts.headingBold,
    marginTop: 2,
  },
  detail: {
    fontSize: 13,
    color: C.mutedForeground,
    fontFamily: fonts.body,
    textAlign: "center",
  },
  actions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 18,
    alignSelf: "stretch",
  },
});
