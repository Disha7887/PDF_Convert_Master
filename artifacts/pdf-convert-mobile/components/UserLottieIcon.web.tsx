import Lottie from "lottie-react";
import React from "react";
import { View, type ViewStyle } from "react-native";

import userAnim from "@/assets/lottie/user.json";

interface UserLottieIconProps {
  size?: number;
  loop?: boolean;
  autoPlay?: boolean;
  style?: ViewStyle;
}

/**
 * Web renderer for the animated user/account Lottie icon. Uses the pure-JS
 * lottie-react player (matching the web app) because lottie-react-native's
 * web path does not render reliably behind the preview proxy.
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
      <Lottie
        animationData={userAnim}
        loop={loop}
        autoplay={autoPlay}
        style={{ width: size, height: size }}
      />
    </View>
  );
}

export default UserLottieIcon;
