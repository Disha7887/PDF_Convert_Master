import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  LayoutChangeEvent,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Svg, { Path } from "react-native-svg";

import colors from "@/constants/colors";
import { fonts } from "@/constants/theme";

const C = colors.light;

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
}: {
  onChange: (data: SignatureData | null) => void;
  strokeColor?: string;
}) {
  const [paths, setPaths] = useState<string[]>([]);
  const [current, setCurrent] = useState("");
  const size = useRef({ width: 0, height: 0 });
  const pathsRef = useRef<string[]>([]);
  const currentRef = useRef("");

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
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (e) => {
          const { locationX, locationY } = e.nativeEvent;
          currentRef.current = `M ${locationX.toFixed(1)} ${locationY.toFixed(1)}`;
          setCurrent(currentRef.current);
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
        },
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
      <View style={styles.pad} onLayout={onLayout} {...responder.panHandlers}>
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
