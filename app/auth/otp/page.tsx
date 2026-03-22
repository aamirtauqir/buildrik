"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { AuthCard } from "@/components/auth/auth-card";
import { AuthLogo } from "@/components/auth/auth-logo";
import { AuthIcon } from "@/components/auth/auth-icon";
import { AuthButton } from "@/components/auth/auth-button";
import { OTPInput } from "@/components/auth/otp-input";
import { ResendTimer } from "@/components/auth/resend-timer";

function OTPContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  const handleVerify = async () => {
    if (code.length < 6) return;
    setLoading(true);
    // TODO: wire to tRPC
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setLoading(false);
  };

  return (
    <AuthCard>
      <AuthLogo />
      <AuthIcon name="phone" color="blue" />

      <h1 className="text-auth-title text-auth-text-primary text-center">
        Enter verification code
      </h1>
      <p className="text-auth-subtitle text-auth-text-muted text-center mt-1">
        We sent a code to your phone/email
      </p>

      <div className="h-6" />

      <OTPInput length={6} value={code} onChange={setCode} />

      <div className="h-5" />

      <AuthButton
        loading={loading}
        disabled={code.length < 6}
        onClick={handleVerify}
      >
        Verify
      </AuthButton>

      <div className="h-4" />

      <ResendTimer initialSeconds={60} onResend={() => {
        // TODO: wire to actual resend when OTP flow is implemented
      }} />

      <div className="h-3" />

      <Link
        href="/auth/login"
        className="text-auth-label text-auth-link hover:underline text-center block"
      >
        ← Back to sign in
      </Link>
    </AuthCard>
  );
}

export default function OTPPage() {
  return (
    <Suspense fallback={null}>
      <OTPContent />
    </Suspense>
  );
}
