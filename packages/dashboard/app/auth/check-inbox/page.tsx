"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { AuthCard } from "@/components/auth/auth-card";
import { ResendTimer } from "@/components/auth/resend-timer";
import { trpc } from "@lib/trpc/client";

function CheckInboxContent() {
  const searchParams = useSearchParams();
  const isReset = searchParams.get("type") === "reset";
  const email = searchParams.get("email") ?? "";

  const resendResetMutation = trpc.auth.forgotPassword.useMutation();
  const resendVerificationMutation = trpc.auth.resendVerification.useMutation();

  const resend = () => {
    if (!email) return;
    if (isReset) resendResetMutation.mutate({ email });
    else resendVerificationMutation.mutate({ email });
  };

  return (
    <AuthCard>
      <div className="text-center">
        <h1 className="text-auth-title text-auth-text-primary">Check your inbox</h1>
        <p className="text-auth-subtitle text-auth-text-muted mt-2">
          We sent {isReset ? "a password reset link" : "a verification link"} to{" "}
          {email ? <span className="text-auth-text-body font-medium">{email}</span> : "your email"}.{" "}
          {isReset ? "Click it to choose a new password." : "Confirm it to finish setting up your account."}
        </p>
      </div>

      <div className="h-6" />

      <ResendTimer initialSeconds={60} label="Resend email" onResend={resend} />

      <div className="h-4" />

      <p className="text-auth-label text-auth-text-muted text-center">
        Wrong address?{" "}
        <Link
          href={isReset ? "/auth/forgot-password" : `/auth/change-email${email ? `?email=${encodeURIComponent(email)}` : ""}`}
          className="text-auth-text-body font-semibold hover:underline"
        >
          Use a different email
        </Link>
      </p>
    </AuthCard>
  );
}

export default function CheckInboxPage() {
  return (
    <Suspense fallback={null}>
      <CheckInboxContent />
    </Suspense>
  );
}
