import LottieView from "lottie-react-native";
import React from "react";
import { View, type StyleProp, type ViewStyle } from "react-native";

import colors from "@/constants/colors";

const processing = require("../assets/lottie/processing.json");

const C = colors.light;

/**
 * App-wide loading / processing indicator. Renders the shared `processing`
 * Lottie animation (the navy dot-ring) used everywhere the app is loading,
 * processing, uploading, or downloading. Native renderer (lottie-react-native);
 * the web variant lives in `Loader.web.tsx`.
 */
export function Loader({
  size = 56,
  style,
}: {
  size?: number;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View
      style={[
        { width: size, height: size, alignItems: "center", justifyContent: "center" },
        style,
      ]}
    >
      <LottieView source={processing as never} autoPlay loop style={{ width: size, height: size }} />
    </View>
  );
}

/** Full-screen centered loader, e.g. while the app boots or a screen hydrates. */
export function ScreenLoader({ size = 80 }: { size?: number }) {
  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: C.background,
      }}
    >
      <Loader size={size} />
    </View>
  );
}

export default Loader;
