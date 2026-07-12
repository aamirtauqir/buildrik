"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { AuthCard } from "@/components/auth/auth-card";
import { ResendTimer } from "@/components/auth/resend-timer";
import { trpc } from "@lib/trpc/client";

function CheckInboxContent() {
  const searchParams = useSearchParams();
  const type = searchParams.get("type");
  const email = searchParams.get("email") ?? "";

  const resendResetMutation = trpc.auth.forgotPassword.useMutation();
  const resendVerificationMutation = trpc.auth.resendVerification.useMutation();

  const subtitle =
    type === "reset"
      ? "We sent password reset instructions to"
      : "We sent a verification link to";

  return (
    <AuthCard>
      <div className="text-center">
        <h1 className="text-auth-title text-auth-text-primary">Check your inbox</h1>
        <p className="text-auth-subtitle text-auth-text-muted mt-2">
          {subtitle}{" "}
          {email ? <span className="text-auth-text-secondary font-medium">{email}</span> : "your email"}.
        </p>
      </div>

      <div className="h-6" />

      <ResendTimer
        initialSeconds={60}
        onResend={() => {
          if (type === "reset" && email) {
            resendResetMutation.mutate({ email });
          } else if (email) {
            resendVerificationMutation.mutate({ email });
          }
        }}
      />

      <div className="h-2" />

      <p className="text-auth-fine text-auth-text-placeholder text-center">
        Don&apos;t see it? Check your spam or junk folder.
      </p>

      <div className="h-5" />

      <Link href="/auth/forgot-password" className="text-auth-label text-auth-link hover:underline text-center block">
        Use a different email
      </Link>
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
