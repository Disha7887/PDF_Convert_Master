import { Link } from "wouter";
import { LogIn } from "lucide-react";

interface AuthErrorActionProps {
  to: string;
  label: string;
  className?: string;
  testId?: string;
}

// Actionable link rendered inside conversion error states when the failure was a
// 401 (expired session or revoked API key). Sends the user to sign-in or the
// API Setup page so they can recover.
export const AuthErrorAction = ({
  to,
  label,
  className = "",
  testId,
}: AuthErrorActionProps) => (
  <Link
    href={to}
    className={`inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-700 underline underline-offset-2 ${className}`}
    data-testid={testId}
  >
    <LogIn className="w-4 h-4" />
    {label}
  </Link>
);
