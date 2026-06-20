import { Feather } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { useRouter } from "expo-router";
import React from "react";
import {
  Platform,
  Pressable,
  StyleSheet,
  View,
  useColorScheme,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";

import colors from "@/constants/colors";
import { ROUTES } from "@/constants/routes";
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
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const { isAuthenticated } = useAuth();
  const topInset = useNavTopInset();

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
            isAuthenticated ? "Account" : "Sign in or create an account"
          }
          hitSlop={8}
          onPress={() =>
            router.push((isAuthenticated ? ROUTES.settings : ROUTES.signIn) as never)
          }
          style={styles.profileBtn}
        >
          <Svg width={20} height={20} viewBox="0 0 32 32">
            <Path d={PEOPLE_PATH} fill={C.primary} />
          </Svg>
        </Pressable>
      </View>
    </View>
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
  blur: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(120,120,128,0.18)",
  },
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
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
});

export default TopNav;
