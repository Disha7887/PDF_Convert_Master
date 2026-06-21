import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { StyleSheet } from "react-native";

import colors from "@/constants/colors";

const C = colors.light;

export default function HomeScreen() {
  return (
    <LinearGradient
      colors={[C.surfaceAlt, C.blue50, C.blue100, C.blue200]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.fill}
    />
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
});
