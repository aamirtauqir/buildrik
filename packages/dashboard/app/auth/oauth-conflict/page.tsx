"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { AuthMessage } from "@/components/auth/auth-message";
import { AuthButton } from "@/components/auth/auth-button";

function OAuthConflictContent() {
  const email = useSearchParams().get("email") ?? "your email";
  return (
    <AuthMessage
      title="Account already exists"
      subtitle={`An account for ${email} was created with a password. Log in with your password to continue.`}
    >
      <AuthButton onClick={() => (window.location.href = "/auth")}>Log in with password</AuthButton>
      <AuthButton variant="secondary" onClick={() => (window.location.href = "/auth/forgot-password")}>
        Forgot password?
      </AuthButton>
    </AuthMessage>
  );
}

export default function OAuthConflictPage() {
  return <Suspense fallback={null}><OAuthConflictContent /></Suspense>;
}
