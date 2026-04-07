"use client";

import Link from "next/link";
import { AuthCard } from "@/components/auth/auth-card";
import { AuthLogo } from "@/components/auth/auth-logo";
import { AuthIcon } from "@/components/auth/auth-icon";
import { AuthButton } from "@/components/auth/auth-button";

export default function AccessDeniedPage() {
  return (
    <AuthCard>
      <AuthLogo />
      <AuthIcon name="shield-x" color="red" />

      <h1 className="text-auth-title text-auth-text-primary text-center">
        Access denied
      </h1>
      <p className="text-auth-subtitle text-auth-text-muted text-center mt-1 mb-6">
        You don&apos;t have permission to access this resource.
      </p>

      <div className="h-4" />

      <AuthButton onClick={() => (window.location.href = "/dashboard")}>
        Go to Dashboard
      </AuthButton>

      <div className="h-4" />

      <Link
        href="mailto:admin@buildrik.com"
        className="text-auth-link hover:underline text-center block"
      >
        Contact workspace admin
      </Link>

      <div className="h-4" />

      <Link
        href="/auth/login"
        className="text-auth-label text-auth-link hover:underline text-center block"
      >
        ← Back to sign in
      </Link>
    </AuthCard>
  );
}
