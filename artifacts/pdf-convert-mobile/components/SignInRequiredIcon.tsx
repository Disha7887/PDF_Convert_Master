import LottieView from "lottie-react-native";
import React from "react";

const signInAnimation = require("../assets/lottie/sign-in-required.json");

export function SignInRequiredIcon({ size = 44 }: { size?: number }) {
  return (
    <LottieView
      source={signInAnimation as never}
      autoPlay
      loop
      style={{ width: size, height: size }}
    />
  );
}
