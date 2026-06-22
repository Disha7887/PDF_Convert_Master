import { Feather } from "@expo/vector-icons";
import LottieView from "lottie-react-native";
import React, { useEffect, useRef } from "react";
import { View, type ViewStyle } from "react-native";

import colors from "@/constants/colors";

const userAnim = require("@/assets/lottie/user.json");

interface UserLottieIconProps {
  size?: number;
  style?: ViewStyle;
  /** Delay before the first play, in ms. Defaults to 3000 (3s). */
  initialDelayMs?: number;
  /** Gap between single plays, in ms. Defaults to 30000 (30s). */
  periodMs?: number;
}

/**
 * Animated user/account Lottie icon. Mirrors the web app's navbar user icon so
 * the account control looks identical across web and mobile. Instead of looping
 * continuously, it plays a single time after `initialDelayMs`, then plays once
 * every `periodMs`. Native renderer (lottie-react-native); a web sibling
 * (`.web.tsx`) uses the pure-JS player. Falls back to a Feather user icon if
 * the Lottie renderer errors.
 */
export function UserLottieIcon({
  size = 28,
  style,
  initialDelayMs = 3000,
  periodMs = 30000,
}: UserLottieIconProps) {
  const ref = useRef<React.ElementRef<typeof LottieView>>(null);

  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval> | undefined;
    const playOnce = () => {
      ref.current?.reset();
      ref.current?.play();
    };
    const timeoutId = setTimeout(() => {
      playOnce();
      intervalId = setInterval(playOnce, periodMs);
    }, initialDelayMs);
    return () => {
      clearTimeout(timeoutId);
      if (intervalId) clearInterval(intervalId);
    };
  }, [initialDelayMs, periodMs]);

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
          ref={ref}
          source={userAnim as never}
          autoPlay={false}
          loop={false}
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
