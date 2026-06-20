import { Feather } from "@expo/vector-icons";
import Lottie from "lottie-react";
import React from "react";
import { View, type ViewStyle } from "react-native";

import { TOOL_ANIMATIONS } from "@/components/lottie/toolLottie";
import colors from "@/constants/colors";
import { getToolById } from "@/constants/tools";

interface ToolLottieIconProps {
  toolId: string;
  size?: number;
  loop?: boolean;
  autoPlay?: boolean;
  style?: ViewStyle;
}

type FeatherName = keyof typeof Feather.glyphMap;

/**
 * Web renderer for a tool's animated Lottie identity icon. Uses the pure-JS
 * lottie-react player (matching the web app) because lottie-react-native's
 * WASM-based web path does not render reliably behind the preview proxy. Falls
 * back to the tool's Feather icon when no animation is mapped.
 */
export function ToolLottieIcon({
  toolId,
  size = 44,
  loop = true,
  autoPlay = true,
  style,
}: ToolLottieIconProps) {
  const animation = TOOL_ANIMATIONS[toolId];
  const tool = getToolById(toolId);
  const fallbackIcon = (tool?.feather ?? "file") as FeatherName;

  return (
    <View
      style={[
        { width: size, height: size, alignItems: "center", justifyContent: "center" },
        style,
      ]}
    >
      {animation ? (
        <Lottie
          animationData={animation}
          loop={loop}
          autoplay={autoPlay}
          style={{ width: size, height: size }}
        />
      ) : (
        <Feather name={fallbackIcon} size={size * 0.6} color={colors.light.primary} />
      )}
    </View>
  );
}

export default ToolLottieIcon;
