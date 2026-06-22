import { LottieIcon } from "@/components/ui/lottie-icon";
import successAnim from "@/assets/lottie/auth-success.json";
import errorAnim from "@/assets/lottie/auth-error.json";
import welcomeAnim from "@/assets/lottie/auth-welcome.json";

export type AuthResultKind = "success" | "error" | "welcome";

const MAP: Record<AuthResultKind, unknown> = {
  success: successAnim,
  error: errorAnim,
  welcome: welcomeAnim,
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
