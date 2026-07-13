"use client";

import { useRouter } from "next/navigation";
import { AuthCard } from "@/components/auth/auth-card";
import { AuthButton } from "@/components/auth/auth-button";

export default function PasswordChangedPage() {
  const router = useRouter();

  return (
    <AuthCard>
      <div className="text-center">
        <h1 className="text-auth-title text-auth-text-primary">Password updated</h1>
        <p className="text-auth-subtitle text-auth-text-muted mt-2">
          Your password has been changed. Use it next time you log in to Buildrick.
        </p>
      </div>

      <div className="h-6" />

      <AuthButton onClick={() => router.push("/auth")}>Continue to log in</AuthButton>

      <div className="h-3" />

      <p className="text-auth-fine text-auth-text-placeholder text-center">
        For your security, all active sessions have been signed out.
      </p>
    </AuthCard>
  );
}
