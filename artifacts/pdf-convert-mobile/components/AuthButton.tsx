import { useRouter } from "expo-router";
import React from "react";
import { Platform, Pressable, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";

import colors from "@/constants/colors";
import { ROUTES } from "@/constants/routes";
import { useAuth } from "@/contexts/AuthContext";

const PEOPLE_PATH =
  "M26.68,23.36a11,11,0,0,0-6.91-7.7,6,6,0,1,0-7.54,0,11,11,0,0,0-6.91,7.7,2.86,2.86,0,0,0,.54,2.47A3,3,0,0,0,8.25,27h15.5a3,3,0,0,0,2.39-1.17A2.86,2.86,0,0,0,26.68,23.36ZM12,11a4,4,0,1,1,4,4A4,4,0,0,1,12,11ZM24.56,24.6a1,1,0,0,1-.81.4H8.25a1,1,0,0,1-.81-.4.85.85,0,0,1-.18-.76,9,9,0,0,1,17.48,0A.85.85,0,0,1,24.56,24.6Z";

/**
 * Floating auth button pinned to the upper-right corner of the main tab screens.
 * Renders the supplied "people" icon and routes to sign-in (or Settings when
 * already authenticated). Size and edge offsets derive from the viewport width
 * and safe-area insets — nothing is hardcoded, so it scales across device sizes.
 */
export function AuthButton() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { isAuthenticated } = useAuth();

  const size = Math.round(Math.min(Math.max(width * 0.12, 40), 64));
  const top = insets.top + (Platform.OS === "web" ? 14 : 6);
  const right = Math.max(width * 0.04, 12);
  const iconSize = Math.round(size * 0.56);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={isAuthenticated ? "Account" : "Sign in or create an account"}
      hitSlop={8}
      onPress={() =>
        router.push((isAuthenticated ? ROUTES.settings : ROUTES.signIn) as never)
      }
      style={{
        position: "absolute",
        top,
        right,
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: colors.light.card,
        borderWidth: 1,
        borderColor: colors.light.border,
        alignItems: "center",
        justifyContent: "center",
        zIndex: 50,
        shadowColor: "#000",
        shadowOpacity: 0.1,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 2 },
        elevation: 3,
      }}
    >
      <Svg width={iconSize} height={iconSize} viewBox="0 0 32 32">
        <Path d={PEOPLE_PATH} fill={colors.light.primary} />
      </Svg>
    </Pressable>
  );
}

export default AuthButton;
