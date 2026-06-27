import { LottieIcon } from "@/components/ui/lottie-icon";
import successAnim from "@/assets/lottie/auth-success.json";
import errorAnim from "@/assets/lottie/auth-error.json";
import welcomeAnim from "@/assets/lottie/auth-welcome.json";
import signupAnim from "@/assets/lottie/signup.json";
import passwordResetAnim from "@/assets/lottie/password-reset.json";
import downloadLoginRequiredAnim from "@/assets/lottie/download-login-required.json";

export type AuthResultKind =
  | "success"
  | "error"
  | "welcome"
  | "signup"
  | "password-reset"
  | "download-login-required";

const MAP: Record<AuthResultKind, unknown> = {
  success: successAnim,
  error: errorAnim,
  welcome: welcomeAnim,
  signup: signupAnim,
  "password-reset": passwordResetAnim,
  "download-login-required": downloadLoginRequiredAnim,
};

export interface AuthResultIconProps {
  kind: AuthResultKind;
  /** Square pixel size. Defaults to 160. */
  size?: number;
  loop?: boolean;
  className?: string;
}

/**
 * Web auth result animation (success / error / welcome). Plays the matching
 * Lottie via lottie-react. Mirrors the native `AuthResultIcon`.
 */
export function AuthResultIcon({ kind, size = 160, loop = false, className }: AuthResultIconProps) {
  return <LottieIcon animationData={MAP[kind]} size={size} loop={loop} autoplay className={className} />;
}

export default AuthResultIcon;
