import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Redirect } from "wouter";
import { PageLoader } from "@/components/page-loader";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <PageLoader size={140} />;
  }

  if (!isAuthenticated) {
    return <Redirect to="/signin" />;
  }

  return <>{children}</>;
}