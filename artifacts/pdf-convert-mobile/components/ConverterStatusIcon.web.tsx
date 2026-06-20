import Lottie from "lottie-react";
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
 * Web converter status icon. Uses the pure-JS lottie-react player (the same
 * renderer the web app uses) so animations render reliably on Expo web, where
 * lottie-react-native's WASM-based web path is unreliable behind the preview
 * proxy. Mirrors the web `ConverterStatusIcon`.
 */
export function ConverterStatusIcon({
  status,
  size = 96,
  toolId,
  style,
}: ConverterStatusIconProps) {
  const { animation, loop } = resolveStatusAnimation(status, toolId);

  return (
    <View style={[{ width: size, height: size }, style]}>
      <Lottie
        animationData={animation}
        loop={loop}
        autoplay
        style={{ width: size, height: size }}
      />
    </View>
  );
}

export default ConverterStatusIcon;
