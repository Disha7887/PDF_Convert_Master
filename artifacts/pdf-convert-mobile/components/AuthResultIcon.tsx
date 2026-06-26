import LottieView from "lottie-react-native";
import React from "react";
import { View, type ViewStyle } from "react-native";

const success = require("../assets/lottie/auth-success.json");
const error = require("../assets/lottie/auth-error.json");
const welcome = require("../assets/lottie/auth-welcome.json");
const signup = require("../assets/lottie/signup.json");
const passwordReset = require("../assets/lottie/password-reset.json");
const loginRequired = require("../assets/lottie/please-login.json");

export type AuthResultKind =
  | "success"
  | "error"
  | "welcome"
  | "signup"
  | "password-reset"
  | "login-required";

const MAP: Record<AuthResultKind, unknown> = {
  success,
  error,
  welcome,
  signup,
  "password-reset": passwordReset,
  "login-required": loginRequired,
};

export interface AuthResultIconProps {
  kind: AuthResultKind;
  /** Square pixel size. Defaults to 160. */
  size?: number;
  loop?: boolean;
  style?: ViewStyle;
}

/**
 * Native auth result animation (success / error / welcome). Plays the matching
 * Lottie via lottie-react-native. Mirrors the web `AuthResultIcon`.
 */
export function AuthResultIcon({ kind, size = 160, loop = false, style }: AuthResultIconProps) {
  return (
    <View
      style={[
        { width: size, height: size, alignItems: "center", justifyContent: "center" },
        style,
      ]}
    >
      <LottieView
        source={MAP[kind] as never}
        autoPlay
        loop={loop}
        style={{ width: size, height: size }}
      />
    </View>
  );
}

export default AuthResultIcon;
