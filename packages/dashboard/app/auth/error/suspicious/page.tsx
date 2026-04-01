"use client";

import { useState } from "react";
import Link from "next/link";
import { AuthCard } from "@/components/auth/auth-card";
import { AuthLogo } from "@/components/auth/auth-logo";
import { AuthIcon } from "@/components/auth/auth-icon";
import { AuthButton } from "@/components/auth/auth-button";
import { OTPInput } from "@/components/auth/otp-input";

export default function SuspiciousPage() {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  const handleVerify = async () => {
    if (code.length < 6) return;
    setLoading(true);
    window.location.href = `/auth/2fa?code=${encodeURIComponent(code)}`;
  };

  return (
    <AuthCard>
      <AuthLogo />
      <AuthIcon name="warning" color="red" />

      <h1 className="text-auth-title text-auth-text-primary text-center">
        New device detected
      </h1>
      <p className="text-auth-subtitle text-auth-text-muted text-center mt-1 mb-6">
        We noticed a sign-in from a new device. We sent a verification code to
        your email.
      </p>

      <div className="h-4" />

      <OTPInput length={6} value={code} onChange={setCode} />

      <div className="h-5" />

      <AuthButton
        loading={loading}
        disabled={code.length < 6}
        onClick={handleVerify}
      >
        Verify Device
      </AuthButton>

      <div className="h-4" />

      <div className="bg-gray-50 rounded-lg p-3 w-full text-auth-fine text-auth-text-muted text-center">
        Chrome 120, macOS · Karachi, PK
      </div>

      <div className="h-3" />

      <Link
        href="#"
        className="text-red-500 hover:underline text-center block text-auth-link"
      >
        This wasn&apos;t me
      </Link>

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
