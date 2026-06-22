import Lottie, { type LottieRefCurrentProps } from "lottie-react";
import React, { useEffect, useRef } from "react";
import { View, type ViewStyle } from "react-native";

import userAnim from "@/assets/lottie/user.json";

interface UserLottieIconProps {
  size?: number;
  style?: ViewStyle;
  /** Delay before the first play, in ms. Defaults to 3000 (3s). */
  initialDelayMs?: number;
  /** Gap between single plays, in ms. Defaults to 30000 (30s). */
  periodMs?: number;
}

/**
 * Web renderer for the animated user/account Lottie icon. Uses the pure-JS
 * lottie-react player (matching the web app) because lottie-react-native's
 * web path does not render reliably behind the preview proxy. Plays once after
 * `initialDelayMs`, then once every `periodMs` (no continuous loop).
 */
export function UserLottieIcon({
  size = 28,
  style,
  initialDelayMs = 3000,
  periodMs = 30000,
}: UserLottieIconProps) {
  const ref = useRef<LottieRefCurrentProps>(null);

  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval> | undefined;
    const playOnce = () => ref.current?.goToAndPlay(0, true);
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
      <Lottie
        lottieRef={ref}
        animationData={userAnim}
        loop={false}
        autoplay={false}
        style={{ width: size, height: size }}
      />
    </View>
  );
}

export default UserLottieIcon;
