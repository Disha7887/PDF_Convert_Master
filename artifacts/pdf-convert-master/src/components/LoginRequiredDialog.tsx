import { Link } from "wouter";
import { LogIn } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AuthResultIcon } from "@/components/AuthResultIcon";

interface LoginRequiredDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Optional override for the body copy. */
  description?: string;
}

/**
 * Clear, animated dialog shown when a download requires the user to be signed in
 * (a guest with an expired download window, or someone who logged out). Plays
 * the "cancel" Lottie so the failure reads unmistakably, then offers a Sign In
 * action. Mirrors the native `LoginRequiredModal`.
 */
export function LoginRequiredDialog({
  open,
  onOpenChange,
  description = "Please log in to download this file.",
}: LoginRequiredDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" data-testid="dialog-login-required">
        <DialogHeader className="items-center text-center">
          <AuthResultIcon kind="download-login-required" size={140} />
          <DialogTitle className="text-xl">Sign in required</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="mt-2 flex flex-col gap-2">
          <Link href="/signin" onClick={() => onOpenChange(false)}>
            <Button
              className="w-full bg-[#f7433d] text-white hover:bg-[#e23a35]"
              data-testid="button-login-required-signin"
            >
              <LogIn className="mr-2 h-4 w-4" />
              Sign In
            </Button>
          </Link>
          <Button
            variant="ghost"
            className="w-full"
            onClick={() => onOpenChange(false)}
            data-testid="button-login-required-dismiss"
          >
            Not now
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default LoginRequiredDialog;
