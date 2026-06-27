import React from "react";
import { AuthCard } from "@/components/AuthCard";
import { useSeo } from "@/lib/useSeo";

export const SignIn: React.FC = () => {
  useSeo({ title: "Sign In", canonicalPath: "/signin", noindex: true });
  return <AuthCard mode="signin" />;
};
