import { Feather } from "@expo/vector-icons";
import React from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type ScrollViewProps,
  type StyleProp,
  type TextInputProps,
  type TextStyle,
  type ViewStyle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import colors from "@/constants/colors";
import { SCREEN_PADDING, cardShadow, fonts } from "@/constants/theme";

const C = colors.light;
type FeatherName = keyof typeof Feather.glyphMap;

// ─── ScreenScroll ────────────────────────────────────────────────────────────
interface ScreenScrollProps extends ScrollViewProps {
  /** Add top safe-area padding (use on tab screens without a native header). */
  insetTop?: boolean;
  /** Reserve space for the bottom tab bar (use on tab screens). */
  tabBar?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
  children: React.ReactNode;
}

export function ScreenScroll({
  insetTop = false,
  tabBar = false,
  contentStyle,
  children,
  ...rest
}: ScreenScrollProps) {
  const insets = useSafeAreaInsets();
  const topPad = insetTop ? (Platform.OS === "web" ? 67 : insets.top) : 0;
  const bottomPad = tabBar
    ? Platform.OS === "web"
      ? 34 + 84
      : 96
    : Platform.OS === "web"
      ? 34 + 24
      : insets.bottom + 24;

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[
        {
          paddingTop: topPad + 16,
          paddingBottom: bottomPad,
          paddingHorizontal: SCREEN_PADDING,
        },
        contentStyle,
      ]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      {...rest}
    >
      {children}
    </ScrollView>
  );
}

// ─── Button ──────────────────────────────────────────────────────────────────
type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "destructive";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  loading?: boolean;
  disabled?: boolean;
  icon?: FeatherName;
  iconRight?: FeatherName;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export function Button({
  label,
  onPress,
  variant = "primary",
  size = "md",
  fullWidth,
  loading,
  disabled,
  icon,
  iconRight,
  style,
  testID,
}: ButtonProps) {
  const palette: Record<ButtonVariant, { bg: string; fg: string; border: string }> = {
    primary: { bg: C.primary, fg: C.primaryForeground, border: C.primary },
    secondary: { bg: C.secondary, fg: C.secondaryForeground, border: C.secondary },
    outline: { bg: "transparent", fg: C.primary, border: C.border },
    ghost: { bg: "transparent", fg: C.primary, border: "transparent" },
    destructive: { bg: C.destructive, fg: C.destructiveForeground, border: C.destructive },
  };
  const sizes: Record<ButtonSize, { py: number; px: number; font: number; icon: number }> = {
    sm: { py: 8, px: 14, font: 13, icon: 15 },
    md: { py: 12, px: 18, font: 15, icon: 17 },
    lg: { py: 16, px: 22, font: 16, icon: 19 },
  };
  const v = palette[variant];
  const s = sizes[size];
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      testID={testID}
      style={({ pressed }) => [
        styles.btn,
        {
          backgroundColor: v.bg,
          borderColor: v.border,
          paddingVertical: s.py,
          paddingHorizontal: s.px,
          opacity: isDisabled ? 0.55 : pressed ? 0.88 : 1,
          alignSelf: fullWidth ? "stretch" : "flex-start",
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={v.fg} size="small" />
      ) : (
        <>
          {icon && <Feather name={icon} size={s.icon} color={v.fg} />}
          <Text style={[styles.btnLabel, { color: v.fg, fontSize: s.font }]}>{label}</Text>
          {iconRight && <Feather name={iconRight} size={s.icon} color={v.fg} />}
        </>
      )}
    </Pressable>
  );
}

// ─── Card ────────────────────────────────────────────────────────────────────
interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  padded?: boolean;
  elevated?: boolean;
}

export function Card({ children, style, padded = true, elevated = true }: CardProps) {
  return (
    <View
      style={[
        styles.card,
        padded && { padding: 16 },
        elevated && cardShadow,
        style,
      ]}
    >
      {children}
    </View>
  );
}

// ─── Badge ───────────────────────────────────────────────────────────────────
interface BadgeProps {
  label: string;
  tone?: "primary" | "success" | "warning" | "danger" | "neutral";
  style?: StyleProp<ViewStyle>;
}

export function Badge({ label, tone = "primary", style }: BadgeProps) {
  const tones = {
    primary: { bg: C.blue50, fg: C.blue700 },
    success: { bg: "#dcfce7", fg: "#166534" },
    warning: { bg: "#fef3c7", fg: "#92400e" },
    danger: { bg: "#fee2e2", fg: "#991b1b" },
    neutral: { bg: C.muted, fg: C.mutedForeground },
  } as const;
  const t = tones[tone];
  return (
    <View style={[styles.badge, { backgroundColor: t.bg }, style]}>
      <Text style={[styles.badgeText, { color: t.fg }]}>{label}</Text>
    </View>
  );
}

// ─── Chip (selectable pill) ──────────────────────────────────────────────────
interface ChipProps {
  label: string;
  active?: boolean;
  onPress?: () => void;
}

export function Chip({ label, active, onPress }: ChipProps) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        {
          backgroundColor: active ? C.primary : C.muted,
          borderColor: active ? C.primary : C.border,
        },
      ]}
    >
      <Text
        style={[
          styles.chipText,
          { color: active ? C.primaryForeground : C.foreground },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

// ─── SectionHeading ──────────────────────────────────────────────────────────
interface SectionHeadingProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  align?: "left" | "center";
  style?: StyleProp<ViewStyle>;
}

export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  align = "left",
  style,
}: SectionHeadingProps) {
  const alignStyle: TextStyle = { textAlign: align };
  return (
    <View style={[{ alignItems: align === "center" ? "center" : "flex-start" }, style]}>
      {eyebrow && <Text style={[styles.eyebrow, alignStyle]}>{eyebrow.toUpperCase()}</Text>}
      <Text style={[styles.sectionTitle, alignStyle]}>{title}</Text>
      {subtitle && <Text style={[styles.sectionSubtitle, alignStyle]}>{subtitle}</Text>}
    </View>
  );
}

// ─── Divider ─────────────────────────────────────────────────────────────────
export function Divider({ style }: { style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.divider, style]} />;
}

// ─── Field (labeled text input) ──────────────────────────────────────────────
interface FieldProps extends TextInputProps {
  label?: string;
  error?: string;
  icon?: FeatherName;
}

export function Field({ label, error, icon, style, ...rest }: FieldProps) {
  return (
    <View style={{ gap: 6 }}>
      {label && <Text style={styles.fieldLabel}>{label}</Text>}
      <View
        style={[
          styles.fieldWrap,
          { borderColor: error ? C.destructive : C.border },
        ]}
      >
        {icon && <Feather name={icon} size={18} color={C.mutedForeground} />}
        <TextInput
          placeholderTextColor={C.mutedForeground}
          style={[styles.fieldInput, style]}
          {...rest}
        />
      </View>
      {error ? <Text style={styles.fieldError}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.background },
  btn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  btnLabel: { fontFamily: fonts.bodySemibold },
  card: {
    backgroundColor: C.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
  },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, alignSelf: "flex-start" },
  badgeText: { fontSize: 12, fontFamily: fonts.bodySemibold },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 999,
    borderWidth: 1,
  },
  chipText: { fontSize: 14, fontFamily: fonts.bodyMedium },
  eyebrow: {
    fontSize: 12,
    letterSpacing: 1.2,
    color: C.primary,
    fontFamily: fonts.bodySemibold,
    marginBottom: 8,
  },
  sectionTitle: { fontSize: 24, color: C.foreground, fontFamily: fonts.headingBold },
  sectionSubtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: C.mutedForeground,
    fontFamily: fonts.body,
    marginTop: 8,
  },
  divider: { height: 1, backgroundColor: C.border, marginVertical: 16 },
  fieldLabel: { fontSize: 14, color: C.foreground, fontFamily: fonts.bodyMedium },
  fieldWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    backgroundColor: C.background,
  },
  fieldInput: {
    flex: 1,
    paddingVertical: 13,
    fontSize: 15,
    color: C.foreground,
    fontFamily: fonts.body,
  },
  fieldError: { fontSize: 12, color: C.destructive, fontFamily: fonts.body },
});
