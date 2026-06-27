import Lottie from "lottie-react";
import React from "react";
import { View, type ViewStyle } from "react-native";

const success = require("../assets/lottie/auth-success.json");
const error = require("../assets/lottie/auth-error.json");
const welcome = require("../assets/lottie/auth-welcome.json");
const signup = require("../assets/lottie/signup.json");
const loginRequired = require("../assets/lottie/please-login.json");
const downloadLoginRequired = require("../assets/lottie/download-login-required.json");

export type AuthResultKind =
  | "success"
  | "error"
  | "welcome"
  | "signup"
  | "login-required"
  | "download-login-required";

const MAP: Record<AuthResultKind, unknown> = {
  success,
  error,
  welcome,
  signup,
  "login-required": loginRequired,
  "download-login-required": downloadLoginRequired,
};

export interface AuthResultIconProps {
  kind: AuthResultKind;
  /** Square pixel size. Defaults to 160. */
  size?: number;
  loop?: boolean;
  style?: ViewStyle;
}

/**
 * Web auth result animation (success / error / welcome). Uses the pure-JS
 * lottie-react player for reliable rendering on Expo web. Mirrors the native
 * `AuthResultIcon`.
 */
export function AuthResultIcon({ kind, size = 160, loop = false, style }: AuthResultIconProps) {
  return (
    <View style={[{ width: size, height: size }, style]}>
      <Lottie
        animationData={MAP[kind]}
        loop={loop}
        autoplay
        style={{ width: size, height: size }}
      />
    </View>
  );
}

export default AuthResultIcon;
