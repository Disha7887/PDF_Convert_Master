import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  LayoutChangeEvent,
  PanResponder,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from "react-native";
import Svg, { Path } from "react-native-svg";

import colors from "@/constants/colors";
import { fonts } from "@/constants/theme";

const C = colors.light;

// On web the browser locks in `touch-action` at touchstart, so toggling
// `scrollEnabled` mid-gesture can't stop a scroll that already began. Setting
// `touch-action: none` statically on the drawing surface stops the browser from
// ever starting a page scroll from a touch that begins on the pad.
const WEB_NO_TOUCH_SCROLL =
  Platform.OS === "web" ? ({ touchAction: "none" } as unknown as ViewStyle) : null;

export interface SignatureData {
  /** SVG path `d` strings, in pad-pixel space (origin top-left). */
  paths: string[];
  /** Pad width in px at capture time. */
  width: number;
  /** Pad height in px at capture time. */
  height: number;
}

/**
 * Finger/mouse signature pad. Captures strokes as SVG path strings (vector), so
 * they can be embedded straight into the PDF via pdf-lib `drawSvgPath` — no
 * rasterisation needed, works on web and native.
 */
export default function SignaturePad({
  onChange,
  strokeColor = "#1c2434",
  onInteract,
}: {
  onChange: (data: SignatureData | null) => void;
  strokeColor?: string;
  /** Called with `true` while a stroke is in progress so the parent can freeze
   *  page scrolling and not fight the drawing gesture. */
  onInteract?: (active: boolean) => void;
}) {
  const [paths, setPaths] = useState<string[]>([]);
  const [current, setCurrent] = useState("");
  const size = useRef({ width: 0, height: 0 });
  const pathsRef = useRef<string[]>([]);
  const currentRef = useRef("");
  const iRef = useRef(onInteract);
  iRef.current = onInteract;

  const emit = useCallback(() => {
    const all = pathsRef.current;
    onChange(
      all.length
        ? { paths: all, width: size.current.width, height: size.current.height }
        : null,
    );
  }, [onChange]);

  const responder = useMemo(
    () =>
      PanResponder.create({
        // Fully claim the stroke so the parent ScrollView can't steal it and
        // scroll the page mid-draw.
        onStartShouldSetPanResponder: () => true,
        onStartShouldSetPanResponderCapture: () => true,
        onMoveShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponderCapture: () => true,
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: (e) => {
          const { locationX, locationY } = e.nativeEvent;
          currentRef.current = `M ${locationX.toFixed(1)} ${locationY.toFixed(1)}`;
          setCurrent(currentRef.current);
          iRef.current?.(true);
        },
        onPanResponderMove: (e) => {
          const { locationX, locationY } = e.nativeEvent;
          if (!currentRef.current) {
            currentRef.current = `M ${locationX.toFixed(1)} ${locationY.toFixed(1)}`;
          } else {
            currentRef.current += ` L ${locationX.toFixed(1)} ${locationY.toFixed(1)}`;
          }
          setCurrent(currentRef.current);
        },
        onPanResponderRelease: () => {
          if (currentRef.current) {
            pathsRef.current = [...pathsRef.current, currentRef.current];
            setPaths(pathsRef.current);
            currentRef.current = "";
            setCurrent("");
            emit();
          }
          iRef.current?.(false);
        },
        onPanResponderTerminate: () => iRef.current?.(false),
      }),
    [emit],
  );

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    size.current = { width, height };
  }, []);

  const clear = useCallback(() => {
    pathsRef.current = [];
    currentRef.current = "";
    setPaths([]);
    setCurrent("");
    emit();
  }, [emit]);

  const hasInk = paths.length > 0 || current.length > 0;

  return (
    <View style={{ gap: 8 }}>
      <View
        style={[styles.pad, WEB_NO_TOUCH_SCROLL]}
        onLayout={onLayout}
        {...responder.panHandlers}
      >
        <Svg width="100%" height="100%">
          {paths.map((d, i) => (
            <Path
              key={i}
              d={d}
              stroke={strokeColor}
              strokeWidth={2.5}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ))}
          {current ? (
            <Path
              d={current}
              stroke={strokeColor}
              strokeWidth={2.5}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ) : null}
        </Svg>
        {!hasInk ? (
          <Text style={styles.hint} pointerEvents="none">
            Draw your signature here
          </Text>
        ) : null}
      </View>
      <Pressable
        onPress={clear}
        disabled={!hasInk}
        style={({ pressed }) => [styles.clearBtn, { opacity: !hasInk ? 0.4 : pressed ? 0.6 : 1 }]}
        testID="button-clear-signature"
      >
        <Text style={styles.clearText}>Clear</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  pad: {
    width: "100%",
    height: 170,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: "#ffffff",
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  hint: {
    position: "absolute",
    fontSize: 14,
    color: C.mutedForeground,
    fontFamily: fonts.body,
  },
  clearBtn: { alignSelf: "flex-end", paddingHorizontal: 12, paddingVertical: 6 },
  clearText: { fontSize: 13, color: C.primary, fontFamily: fonts.bodyMedium },
});
