import { useRouter } from "expo-router";
import Lottie from "lottie-react";
import React from "react";
import { Platform, Pressable, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ROUTES } from "@/constants/routes";
import { useAuth } from "@/contexts/AuthContext";

import animation from "../assets/lottie/auth-button.json";

/**
 * Web renderer for the floating auth button. Uses the pure-JS lottie-react
 * player (matching the rest of the app's web Lottie path). Size and edge offsets
 * derive from the viewport width and safe-area insets, so nothing is hardcoded.
 */
export function AuthLottieButton() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { isAuthenticated } = useAuth();

  const size = Math.round(Math.min(Math.max(width * 0.14, 44), 72));
  const top = insets.top + (Platform.OS === "web" ? 14 : 6);
  const right = Math.max(width * 0.04, 12);

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
        zIndex: 50,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Lottie
        animationData={animation}
        loop
        autoplay
        style={{ width: size, height: size }}
      />
    </Pressable>
  );
}

export default AuthLottieButton;
