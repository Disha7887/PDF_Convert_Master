import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import LottieView from "lottie-react-native";
import React from "react";
import { Platform, Pressable, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import colors from "@/constants/colors";
import { ROUTES } from "@/constants/routes";
import { useAuth } from "@/contexts/AuthContext";

const animation = require("../assets/lottie/auth-button.json");

/**
 * Floating auth button pinned to the upper-right corner of the main tab screens.
 * Plays the "Button" Lottie and routes to sign-in (or Settings when already
 * authenticated). Size and edge offsets derive from the viewport width and the
 * safe-area insets — nothing is hardcoded, so it scales across device sizes.
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
      <LottieFallbackBoundary
        fallback={<Feather name="user" size={size * 0.55} color={colors.light.primary} />}
      >
        <LottieView
          source={animation as never}
          autoPlay
          loop
          style={{ width: size, height: size }}
        />
      </LottieFallbackBoundary>
    </Pressable>
  );
}

interface BoundaryProps {
  fallback: React.ReactNode;
  children: React.ReactNode;
}

/** Catches render errors from the Lottie renderer and shows a Feather fallback. */
class LottieFallbackBoundary extends React.Component<BoundaryProps, { hasError: boolean }> {
  constructor(props: BoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}

export default AuthLottieButton;
