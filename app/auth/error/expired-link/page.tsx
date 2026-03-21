"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { AuthCard } from "@/components/auth/auth-card";
import { AuthLogo } from "@/components/auth/auth-logo";
import { AuthIcon } from "@/components/auth/auth-icon";
import { AuthButton } from "@/components/auth/auth-button";

function ResetVariant() {
  return (
    <>
      <h1 className="text-auth-title text-auth-text-primary text-center">
        Reset link expired
      </h1>
      <p className="text-auth-subtitle text-auth-text-muted text-center mt-1 mb-6">
        This password reset link has expired (1 hour limit).
      </p>
      <div className="h-4" />
      <AuthButton onClick={() => (window.location.href = "/auth/forgot-password")}>
        Request New Reset Link
      </AuthButton>
    </>
  );
}

function VerifyVariant() {
  return (
    <>
      <h1 className="text-auth-title text-auth-text-primary text-center">
        Verification link expired
      </h1>
      <p className="text-auth-subtitle text-auth-text-muted text-center mt-1 mb-6">
        This link has expired. Request a new verification email.
      </p>
      <div className="h-4" />
      <AuthButton onClick={() => console.log("Resend verification email")}>
        Resend Verification Email
      </AuthButton>
    </>
  );
}

function MagicLinkVariant() {
  return (
    <>
      <h1 className="text-auth-title text-auth-text-primary text-center">
        Magic link expired
      </h1>
      <p className="text-auth-subtitle text-auth-text-muted text-center mt-1 mb-6">
        This link has expired (15 min limit). Request a new one.
      </p>
      <div className="h-4" />
      <AuthButton onClick={() => console.log("Request new magic link")}>
        Request New Magic Link
      </AuthButton>
      <div className="h-3" />
      <Link
        href="/auth/login"
        className="text-auth-link hover:underline text-center block"
      >
        Use password instead
      </Link>
    </>
  );
}

export default function ExpiredLinkPage() {
  const searchParams = useSearchParams();
  const type = searchParams.get("type") ?? "reset";

  return (
    <AuthCard>
      <AuthLogo />
      <AuthIcon name="warning" color="red" />

      {type === "reset" && <ResetVariant />}
      {type === "verify" && <VerifyVariant />}
      {type === "magic-link" && <MagicLinkVariant />}
      {type !== "reset" && type !== "verify" && type !== "magic-link" && (
        <ResetVariant />
      )}

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
