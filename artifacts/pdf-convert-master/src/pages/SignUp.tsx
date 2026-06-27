import React from "react";
import { AuthCard } from "@/components/AuthCard";
import { useSeo } from "@/lib/useSeo";

export const SignUp: React.FC = () => {
  useSeo({ title: "Sign Up", canonicalPath: "/signup", noindex: true });
  return <AuthCard mode="signup" />;
};
