"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Shield } from "lucide-react";
import { AuthCard } from "@/components/auth/auth-card";
import { AuthLogo } from "@/components/auth/auth-logo";
import { AuthIcon } from "@/components/auth/auth-icon";
import { AuthButton } from "@/components/auth/auth-button";

export default function PasswordChangedPage() {
  const router = useRouter();
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          router.push("/auth/login");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [router]);

  return (
    <AuthCard>
      <AuthLogo />
      <AuthIcon name="check" color="green" />

      <h1 className="text-auth-title text-auth-text-primary text-center">
        Password changed
      </h1>
      <p className="text-auth-subtitle text-auth-text-muted text-center mt-1 mb-6">
        Your password has been reset. You can now sign in.
      </p>

      <div className="h-6" />

      <AuthButton onClick={() => router.push("/auth/login")}>
        Go to Sign In
      </AuthButton>

      <div className="h-3" />

      <p className="text-auth-fine text-auth-text-placeholder text-center">
        Redirecting to sign in in {countdown}s...
      </p>

      <div className="h-4" />

      <p className="text-auth-fine text-auth-text-placeholder text-center flex items-center justify-center gap-1">
        <Shield className="w-3 h-3 shrink-0" />
        For your security, all active sessions have been signed out.
      </p>
    </AuthCard>
  );
}
