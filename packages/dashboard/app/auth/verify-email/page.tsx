"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { AuthCard } from "@/components/auth/auth-card";
import { AuthButton } from "@/components/auth/auth-button";
import { ResendTimer } from "@/components/auth/resend-timer";
import { FormBanner } from "@/components/auth/form-banner";
import { trpc } from "@lib/trpc/client";
import { Loader2 } from "lucide-react";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") ?? "";
  const email = searchParams.get("email") ?? "";

  const [verified, setVerified] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(5);

  const verifyMutation = trpc.auth.verifyEmail.useMutation({
    onSuccess: () => setVerified(true),
    onError: (err) => setError(err.message),
  });

  const resendMutation = trpc.auth.resendVerification.useMutation();

  useEffect(() => {
    if (token && !verified && !error) {
      verifyMutation.mutate({ token });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    if (!verified) return;
    if (countdown <= 0) {
      router.push("/auth");
      return;
    }
    const timer = setInterval(() => setCountdown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [verified, countdown, router]);

  if (verified) {
    return (
      <AuthCard>
        <div className="text-center">
          <h1 className="text-auth-title text-auth-text-primary">Email verified</h1>
          <p className="text-auth-subtitle text-auth-text-muted mt-2">
            Your email has been verified. You can now sign in.
          </p>
        </div>
        <div className="h-6" />
        <AuthButton onClick={() => router.push("/auth")}>Go to log in</AuthButton>
        <div className="h-4" />
        <p className="text-auth-label text-auth-text-muted text-center">Redirecting in {countdown}s…</p>
      </AuthCard>
    );
  }

  if (token && !error) {
    return (
      <AuthCard>
        <div className="flex flex-col items-center gap-5 py-2 text-center">
          <Loader2 className="w-8 h-8 text-auth-cta animate-spin" />
          <div>
            <h1 className="text-auth-title text-auth-text-primary">Verifying your email…</h1>
            <p className="text-auth-subtitle text-auth-text-muted mt-2">
              Please wait while we verify your email address.
            </p>
          </div>
        </div>
      </AuthCard>
    );
  }

  if (error) {
    return (
      <AuthCard>
        <div className="text-center">
          <h1 className="text-auth-title text-auth-text-primary">Verification failed</h1>
        </div>
        <div className="h-4" />
        <FormBanner variant="error" title={error} />
        <div className="h-5" />
        {email ? (
          <ResendTimer initialSeconds={60} onResend={() => resendMutation.mutate({ email })} />
        ) : (
          <Link href="/auth/signup" className="text-auth-link font-medium hover:underline text-center block">
            Try signing up again
          </Link>
        )}
        <div className="h-4" />
        <Link href="/auth" className="text-auth-label text-auth-link hover:underline text-center block">
          Back to log in
        </Link>
      </AuthCard>
    );
  }

  return (
    <AuthCard>
      <div className="text-center">
        <h1 className="text-auth-title text-auth-text-primary">Verify your email</h1>
        <p className="text-auth-subtitle text-auth-text-muted mt-2">
          We sent a verification link to {email ? <span className="text-auth-text-secondary font-medium">{email}</span> : "your email address"}. Click it to activate your account.
        </p>
      </div>

      <div className="h-6" />

      <ResendTimer initialSeconds={60} onResend={() => resendMutation.mutate({ email })} />

      <div className="h-2" />

      <p className="text-auth-fine text-auth-text-placeholder text-center">
        Don&apos;t see it? Check your spam or junk folder.
      </p>

      <div className="h-5" />

      <Link
        href={`/auth/change-email${email ? `?email=${encodeURIComponent(email)}` : ""}`}
        className="text-auth-label text-auth-link hover:underline text-center block"
      >
        Use a different email
      </Link>
    </AuthCard>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={null}>
      <VerifyEmailContent />
    </Suspense>
  );
}
