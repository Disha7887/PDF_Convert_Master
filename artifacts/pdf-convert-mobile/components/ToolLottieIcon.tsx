import { Feather } from "@expo/vector-icons";
import LottieView from "lottie-react-native";
import React from "react";
import { View, type ViewStyle } from "react-native";

import colors from "@/constants/colors";
import { getToolById } from "@/constants/tools";
import { TOOL_ANIMATIONS } from "@/components/lottie/toolLottie";

interface ToolLottieIconProps {
  toolId: string;
  size?: number;
  loop?: boolean;
  autoPlay?: boolean;
  style?: ViewStyle;
}

type FeatherName = keyof typeof Feather.glyphMap;

/**
 * Renders a tool's animated Lottie identity icon. Falls back to the tool's
 * Feather icon if the animation cannot be loaded (e.g. on platforms where the
 * Lottie renderer is unavailable). Mirrors the web `ToolLottieIcon`.
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
      <LottieFallbackBoundary
        fallback={
          <Feather name={fallbackIcon} size={size * 0.6} color={colors.light.primary} />
        }
      >
        {animation ? (
          <LottieView
            source={animation as never}
            autoPlay={autoPlay}
            loop={loop}
            style={{ width: size, height: size }}
          />
        ) : (
          <Feather name={fallbackIcon} size={size * 0.6} color={colors.light.primary} />
        )}
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

export default ToolLottieIcon;
