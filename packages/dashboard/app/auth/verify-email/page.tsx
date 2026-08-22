"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { AuthCard } from "@/components/auth/auth-card";
import { AuthBackLink } from "@/components/auth/auth-back-link";
import { AuthButton } from "@/components/auth/auth-button";
import { ResendTimer } from "@/components/auth/resend-timer";
import { trpc } from "@lib/trpc/client";
import { Loader2 } from "lucide-react";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") ?? "";
  const email = searchParams.get("email") ?? "";
  const sendFailed = searchParams.get("sent") === "0";

  const [verified, setVerified] = useState(false);
  const [rateLimited, setRateLimited] = useState(false);

  const expiredHref = `/auth/error/expired-link?type=verify${email ? `&email=${encodeURIComponent(email)}` : ""}`;

  const verifyMutation = trpc.auth.verifyEmail.useMutation({
    onSuccess: () => setVerified(true),
    onError: (err) => {
      // A dead/used/expired token and a malformed one are indistinguishable
      // server-side (validateToken returns null for all three) — both land on
      // the expired-link screen.
      if (err.data?.code === "TOO_MANY_REQUESTS") setRateLimited(true);
      else router.replace(expiredHref);
    },
  });

  const resendMutation = trpc.auth.resendVerification.useMutation({
    onError: (err) => {
      if (err.data?.code === "TOO_MANY_REQUESTS") setRateLimited(true);
    },
  });

  useEffect(() => {
    if (token) verifyMutation.mutate({ token });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  if (rateLimited) {
    return (
      <AuthCard>
        <div className="text-center">
          <h1 className="text-auth-title text-auth-text-primary">Too many requests</h1>
          <p className="text-auth-subtitle text-auth-text-muted mt-2">
            You&apos;ve asked for several verification emails. Please wait before requesting another.
          </p>
        </div>

        <div className="h-6" />

        <AuthButton variant="secondary" onClick={() => router.push("/auth")}>
          Back to log in
        </AuthButton>
      </AuthCard>
    );
  }

  if (verified) {
    return (
      <AuthCard>
        <div className="text-center">
          <h1 className="text-auth-title text-auth-text-primary">You&apos;re verified</h1>
          <p className="text-auth-subtitle text-auth-text-muted mt-2">
            Your email is confirmed and your account is secure. Log in to set up your workspace and start building.
          </p>
        </div>

        <div className="h-6" />

        <AuthButton onClick={() => router.push("/auth")}>Continue to log in</AuthButton>
      </AuthCard>
    );
  }

  if (token) {
    return (
      <AuthCard>
        <div className="flex flex-col items-center gap-5 py-2 text-center">
          <Loader2 className="w-8 h-8 text-auth-cta animate-spin" />
          <div>
            <h1 className="text-auth-title text-auth-text-primary">Verifying your email…</h1>
            <p className="text-auth-subtitle text-auth-text-muted mt-2">
              Please wait while we confirm your email address.
            </p>
          </div>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard>
      <div className="text-center">
        <h1 className="text-auth-title text-auth-text-primary">Verify your email</h1>
        {/* signup passes sent=0 when the send threw. Telling someone to check
            an inbox nothing reached leaves them waiting on a mail that is not
            coming; the account exists, so Resend is the way out. */}
        {sendFailed ? (
          <p className="text-auth-subtitle text-auth-text-muted mt-2">
            Your account was created, but we couldn&apos;t send the verification link to{" "}
            {email ? <span className="text-auth-text-body font-medium">{email}</span> : "your email address"} just now.
            Use Resend below — nothing is lost.
          </p>
        ) : (
          <p className="text-auth-subtitle text-auth-text-muted mt-2">
            We sent a verification link to{" "}
            {email ? <span className="text-auth-text-body font-medium">{email}</span> : "your email address"}. Confirm it
            to finish setting up your account.
          </p>
        )}
      </div>

      <div className="h-6" />

      {email ? (
        <ResendTimer initialSeconds={60} label="Resend email" onResend={() => resendMutation.mutate({ email })} />
      ) : (
        <AuthButton variant="secondary" onClick={() => router.push("/auth")}>
          Back to log in
        </AuthButton>
      )}

      <div className="h-4" />

      <p className="text-auth-label text-auth-text-muted text-center">
        Wrong email?{" "}
        <Link
          href={`/auth/change-email${email ? `?email=${encodeURIComponent(email)}` : ""}`}
          className="font-semibold text-auth-text-body hover:underline"
        >
          Change it
        </Link>
      </p>

      <div className="h-3" />
      <AuthBackLink />
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
