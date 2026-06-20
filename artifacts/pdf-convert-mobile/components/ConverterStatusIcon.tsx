import LottieView from "lottie-react-native";
import React from "react";
import { View, type ViewStyle } from "react-native";

import {
  resolveStatusAnimation,
  type ConverterStatus,
} from "@/components/lottie/converterStatus";

export interface ConverterStatusIconProps {
  status: ConverterStatus;
  /** Square pixel size. Defaults to 96. */
  size?: number;
  /**
   * Tool id used in the "upload" state to play that tool's own Lottie animation
   * instead of the generic syncing loop. Ignored for the other states.
   */
  toolId?: string;
  style?: ViewStyle;
}

/**
 * Native converter status icon. Plays the stage's Lottie animation via
 * lottie-react-native. Mirrors the web `ConverterStatusIcon`.
 */
export function ConverterStatusIcon({
  status,
  size = 96,
  toolId,
  style,
}: ConverterStatusIconProps) {
  const { animation, loop } = resolveStatusAnimation(status, toolId);

  return (
    <View
      style={[
        { width: size, height: size, alignItems: "center", justifyContent: "center" },
        style,
      ]}
    >
      <LottieView
        source={animation as never}
        autoPlay
        loop={loop}
        style={{ width: size, height: size }}
      />
    </View>
  );
}

export default ConverterStatusIcon;
