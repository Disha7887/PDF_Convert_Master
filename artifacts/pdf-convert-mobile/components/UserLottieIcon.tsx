import { Feather } from "@expo/vector-icons";
import LottieView from "lottie-react-native";
import React from "react";
import { View, type ViewStyle } from "react-native";

import colors from "@/constants/colors";

const userAnim = require("@/assets/lottie/user.json");

interface UserLottieIconProps {
  size?: number;
  loop?: boolean;
  autoPlay?: boolean;
  style?: ViewStyle;
}

/**
 * Animated user/account Lottie icon. Mirrors the web app's navbar user icon so
 * the account control looks identical across web and mobile. Native renderer
 * (lottie-react-native); a web sibling (`.web.tsx`) uses the pure-JS player.
 * Falls back to a Feather user icon if the Lottie renderer errors.
 */
export function UserLottieIcon({
  size = 28,
  loop = true,
  autoPlay = true,
  style,
}: UserLottieIconProps) {
  return (
    <View
      style={[
        { width: size, height: size, alignItems: "center", justifyContent: "center" },
        style,
      ]}
    >
      <LottieFallbackBoundary
        fallback={
          <Feather name="user" size={size * 0.7} color={colors.light.primary} />
        }
      >
        <LottieView
          source={userAnim as never}
          autoPlay={autoPlay}
          loop={loop}
          style={{ width: size, height: size }}
        />
      </LottieFallbackBoundary>
    </View>
  );
}

interface BoundaryProps {
  fallback: React.ReactNode;
  children: React.ReactNode;
}

/** Catches render errors from the Lottie renderer and shows the Feather icon. */
class LottieFallbackBoundary extends React.Component<
  BoundaryProps,
  { hasError: boolean }
> {
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

export default UserLottieIcon;
