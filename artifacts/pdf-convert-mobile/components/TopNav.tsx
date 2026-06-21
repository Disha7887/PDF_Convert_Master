import { Feather } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { usePathname, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  useColorScheme,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";

import { GlassSurface } from "@/components/Glass";
import colors from "@/constants/colors";
import { ROUTES } from "@/constants/routes";
import { fonts } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";

const C = colors.light;

/** Height of the bar row (below the status-bar / safe-area inset). */
export const NAV_BAR_HEIGHT = 56;

/** Safe-area top used by the nav (web has no real inset, so simulate the notch). */
export function useNavTopInset() {
  const insets = useSafeAreaInsets();
  return Platform.OS === "web" ? 24 : insets.top;
}

const PEOPLE_PATH =
  "M26.68,23.36a11,11,0,0,0-6.91-7.7,6,6,0,1,0-7.54,0,11,11,0,0,0-6.91,7.7,2.86,2.86,0,0,0,.54,2.47A3,3,0,0,0,8.25,27h15.5a3,3,0,0,0,2.39-1.17A2.86,2.86,0,0,0,26.68,23.36ZM12,11a4,4,0,1,1,4,4A4,4,0,0,1,12,11ZM24.56,24.6a1,1,0,0,1-.81.4H8.25a1,1,0,0,1-.81-.4.85.85,0,0,1-.18-.76,9,9,0,0,1,17.48,0A.85.85,0,0,1,24.56,24.6Z";

/**
 * Shared top navigation bar for the main tab screens.
 *
 * It has NO solid background — only a translucent blur, so screen content
 * scrolls underneath and reads through as a frosted-glass effect. The bar holds
 * the site icon on the left and the people / account icon on the right. The blur
 * layer is non-interactive (pointerEvents="none") so taps on the empty middle
 * fall through to the content below; only the two icons are pressable.
 */
export function TopNav() {
  const router = useRouter();
  const pathname = usePathname();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const { isAuthenticated, user, signout } = useAuth();
  const topInset = useNavTopInset();
  const [menuOpen, setMenuOpen] = useState(false);

  // The Camera/Scanner screen is a full-bleed capture surface. The home and
  // account icons (and their blur bar) don't belong there, so hide the whole
  // nav while that route is active. They reappear on every other screen.
  const isCameraScreen =
    pathname === ROUTES.scanner || pathname.startsWith(`${ROUTES.scanner}/`);
  if (isCameraScreen) return null;

  // Signed-in: the people icon opens an account menu. Signed-out: it sends the
  // user straight to the sign-in popup.
  const onAccountPress = () => {
    if (isAuthenticated) setMenuOpen(true);
    else router.push(ROUTES.signIn as never);
  };

  const go = (route: string) => {
    setMenuOpen(false);
    router.push(route as never);
  };

  const onLogout = () => {
    setMenuOpen(false);
    signout();
    router.push(ROUTES.home as never);
  };

  return (
    <View style={[styles.wrap, { height: topInset + NAV_BAR_HEIGHT }]}>
      <BlurView
        intensity={Platform.OS === "android" ? 30 : 40}
        tint={isDark ? "dark" : "light"}
        experimentalBlurMethod="dimezisBlurView"
        style={[StyleSheet.absoluteFill, styles.blur]}
      />
      <View
        style={[styles.bar, { marginTop: topInset, height: NAV_BAR_HEIGHT }]}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="PDF Convert Master home"
          hitSlop={8}
          onPress={() => router.push(ROUTES.home as never)}
          style={styles.logoMark}
        >
          <Feather name="file-text" size={18} color="#fff" />
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            isAuthenticated ? "Account menu" : "Sign in or create an account"
          }
          hitSlop={8}
          onPress={onAccountPress}
          style={styles.profileBtn}
          testID="button-account"
        >
          <Svg width={28} height={28} viewBox="0 0 32 32">
            <Path d={PEOPLE_PATH} fill={C.primary} />
          </Svg>
        </Pressable>
      </View>

      <Modal
        visible={menuOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuOpen(false)}
      >
        <Pressable
          style={styles.menuBackdrop}
          onPress={() => setMenuOpen(false)}
          testID="account-menu-backdrop"
        >
          <Pressable
            style={[styles.menuPos, { top: topInset + NAV_BAR_HEIGHT - 4 }]}
            onPress={(e) => e.stopPropagation()}
          >
            <GlassSurface radius={18} style={styles.menuGlass}>
            <View style={styles.menuHeader}>
              <View style={styles.menuAvatar}>
                <Svg width={22} height={22} viewBox="0 0 32 32">
                  <Path d={PEOPLE_PATH} fill="#fff" />
                </Svg>
              </View>
              <View style={styles.menuHeaderText}>
                <Text style={styles.menuName} numberOfLines={1}>
                  {user?.name ?? "Account"}
                </Text>
                {!!user?.email && (
                  <Text style={styles.menuEmail} numberOfLines={1}>
                    {user.email}
                  </Text>
                )}
              </View>
            </View>

            <View style={styles.menuDivider} />

            <MenuItem
              icon="user"
              label="Profile Settings"
              onPress={() => go(ROUTES.settings)}
              testID="menu-profile-settings"
            />
            <MenuItem
              icon="grid"
              label="Dashboard"
              onPress={() => go(ROUTES.dashboardHome)}
              testID="menu-dashboard"
            />

            <View style={styles.menuDivider} />

            <MenuItem
              icon="log-out"
              label="Log out"
              destructive
              onPress={onLogout}
              testID="menu-logout"
            />
            </GlassSurface>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

type FeatherName = keyof typeof Feather.glyphMap;

function MenuItem({
  icon,
  label,
  onPress,
  destructive,
  testID,
}: {
  icon: FeatherName;
  label: string;
  onPress: () => void;
  destructive?: boolean;
  testID?: string;
}) {
  const tint = destructive ? "#dc2626" : C.foreground;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.menuItem, pressed && styles.menuItemPressed]}
      testID={testID}
    >
      <Feather name={icon} size={18} color={tint} />
      <Text style={[styles.menuItemLabel, { color: tint }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 50,
  },
  blur: {},
  bar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },
  logoMark: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: C.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  profileBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },

  menuBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.18)",
  },
  menuPos: {
    position: "absolute",
    right: 12,
    minWidth: 240,
  },
  menuGlass: {
    paddingVertical: 6,
  },
  menuHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 8,
  },
  menuAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: C.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  menuHeaderText: { flex: 1 },
  menuName: { fontSize: 15, color: C.foreground, fontFamily: fonts.bodySemibold },
  menuEmail: { fontSize: 12, color: C.mutedForeground, fontFamily: fonts.body, marginTop: 1 },
  menuDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: C.border,
    marginVertical: 4,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  menuItemPressed: { backgroundColor: C.muted },
  menuItemLabel: { fontSize: 15, fontFamily: fonts.bodyMedium },
});

export default TopNav;
