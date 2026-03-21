"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthCard } from "@/components/auth/auth-card";
import { AuthLogo } from "@/components/auth/auth-logo";
import { AuthIcon } from "@/components/auth/auth-icon";
import { AuthButton } from "@/components/auth/auth-button";
import { ResendTimer } from "@/components/auth/resend-timer";
import { trpc } from "@/lib/trpc/client";

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const email = searchParams.get("email") ?? "";
  const status = searchParams.get("status");
  const isVerified = status === "verified";

  const [countdown, setCountdown] = useState(5);

  const resendMutation = trpc.auth.resendVerification.useMutation();

  useEffect(() => {
    if (!isVerified) return;
    if (countdown <= 0) {
      router.push("/auth/login");
      return;
    }
    const timer = setInterval(() => setCountdown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [isVerified, countdown, router]);

  if (isVerified) {
    return (
      <AuthCard>
        <AuthIcon name="check" color="green" />
        <h1 className="text-auth-title text-auth-text-primary text-center">
          Email already verified
        </h1>
        <p className="text-auth-subtitle text-auth-text-muted text-center mt-1">
          Your email has been verified. You can sign in.
        </p>

        <div className="h-6" />

        <AuthButton href="/auth/login">Go to Sign In</AuthButton>

        <div className="h-4" />

        <p className="text-auth-subtitle text-auth-text-muted text-center">
          Redirecting in {countdown}s…
        </p>
      </AuthCard>
    );
  }

  return (
    <AuthCard>
      <AuthLogo />
      <AuthIcon name="mail" color="blue" />

      <h1 className="text-auth-title text-auth-text-primary text-center">
        Verify your email
      </h1>
      <p className="text-auth-subtitle text-auth-text-muted text-center mt-1">
        We sent a verification link to your email address. Click the link to
        activate your Buildrik account.
      </p>

      <div className="h-5" />

      {email && (
        <div className="bg-gray-100 rounded-lg px-4 py-2 text-auth-subtitle text-auth-text-primary text-center font-medium">
          {email}
        </div>
      )}

      <div className="h-4" />

      <p className="text-auth-fine text-auth-text-muted text-center">
        Don&apos;t see it? Check your spam or junk folder.
      </p>

      <div className="h-5" />

      <ResendTimer initialSeconds={60} onResend={() => resendMutation.mutate({ email })} />

      <div className="h-5" />

      <Link
        href="/auth/signup"
        className="text-auth-label text-auth-link hover:underline text-center block"
      >
        ← Use a different email
      </Link>

      <div className="h-2" />

      <Link
        href="/auth/login"
        className="text-auth-label text-auth-link hover:underline text-center block"
      >
        ← Back to sign in
      </Link>
    </AuthCard>
  );
}
