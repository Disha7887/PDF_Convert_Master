import React from "react";
import { View } from "react-native";

import colors from "@/constants/colors";

const C = colors.light;

export default function HomeScreen() {
  return <View style={{ flex: 1, backgroundColor: C.background }} />;
}
