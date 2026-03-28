"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { AuthCard } from "@/components/auth/auth-card";
import { AuthLogo } from "@/components/auth/auth-logo";
import { AuthIcon } from "@/components/auth/auth-icon";
import { AuthButton } from "@/components/auth/auth-button";
import { ResendTimer } from "@/components/auth/resend-timer";
import { FormBanner } from "@/components/auth/form-banner";
import { createClientSession } from "@/lib/auth/create-session";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc/client";

function getInboxUrl(email: string): { url: string; label: string } | null {
  const domain = email.split("@")[1]?.toLowerCase();
  if (!domain) return null;
  if (domain === "gmail.com" || domain === "googlemail.com") {
    return { url: "https://mail.google.com", label: "Gmail" };
  }
  if (["outlook.com", "hotmail.com", "live.com", "msn.com"].includes(domain)) {
    return { url: "https://outlook.live.com", label: "Outlook" };
  }
  if (domain === "yahoo.com") {
    return { url: "https://mail.yahoo.com", label: "Yahoo Mail" };
  }
  return null;
}

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") ?? "";
  const email = searchParams.get("email") ?? "";

  const [autoLoginPending, setAutoLoginPending] = useState(false);
  const [autoLoginFailed, setAutoLoginFailed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const verifyMutation = trpc.auth.verifyEmail.useMutation({
    onSuccess: ({ sessionToken }) => {
      if (sessionToken) {
        setAutoLoginPending(true);
        createClientSession(sessionToken).then((ok) => {
          if (ok) {
            router.push("/auth/redirect");
          } else {
            setAutoLoginPending(false);
            setAutoLoginFailed(true);
          }
        });
      } else {
        setAutoLoginFailed(true);
      }
    },
    onError: (err) => setError(err.message),
  });

  const resendMutation = trpc.auth.resendVerification.useMutation();

  // Auto-verify when token is present
  useEffect(() => {
    if (token && !autoLoginPending && !autoLoginFailed && !error) {
      verifyMutation.mutate({ token });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // Auto-login loading state
  if (autoLoginPending) {
    return (
      <AuthCard>
        <AuthIcon name="check" color="green" />
        <h1 className="text-auth-title text-auth-text-primary text-center">
          Email verified
        </h1>
        <p className="text-auth-subtitle text-auth-text-muted text-center mt-1">
          Signing you in…
        </p>
      </AuthCard>
    );
  }

  // Auto-login failed OR email-change path (no session)
  if (autoLoginFailed) {
    return (
      <AuthCard>
        <AuthIcon name="check" color="green" />
        <h1 className="text-auth-title text-auth-text-primary text-center">
          Email verified
        </h1>
        <p className="text-auth-subtitle text-auth-text-muted text-center mt-1">
          Your email has been verified. Please sign in.
        </p>

        <div className="h-6" />

        <AuthButton onClick={() => router.push("/auth/login")}>
          Sign in →
        </AuthButton>
      </AuthCard>
    );
  }

  // Verifying in progress (has token)
  if (token && !error) {
    return (
      <AuthCard>
        <AuthLogo />
        <AuthIcon name="mail" color="blue" />
        <h1 className="text-auth-title text-auth-text-primary text-center">
          Verifying your email…
        </h1>
        <p className="text-auth-subtitle text-auth-text-muted text-center mt-1">
          Please wait while we verify your email address.
        </p>
      </AuthCard>
    );
  }

  // Error state (token expired, invalid, etc.)
  if (error) {
    return (
      <AuthCard>
        <AuthLogo />
        <AuthIcon name="warning" color="red" />
        <h1 className="text-auth-title text-auth-text-primary text-center">
          Verification failed
        </h1>

        <div className="h-4" />

        <FormBanner variant="error" title={error} />

        <div className="h-5" />

        {email ? (
          <ResendTimer initialSeconds={60} onResend={() => resendMutation.mutate({ email })} />
        ) : (
          <Link href="/auth/signup" className="text-auth-link hover:underline text-center block">
            Try signing up again
          </Link>
        )}

        <div className="h-4" />

        <Link
          href="/auth/login"
          className="text-auth-label text-auth-link hover:underline text-center block"
        >
          ← Back to sign in
        </Link>
      </AuthCard>
    );
  }

  // Default: "check your inbox" (no token, came from signup)
  const inboxUrl = email ? getInboxUrl(email) : null;

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

      {inboxUrl ? (
        <a
          href={inboxUrl.url}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            "w-full h-auth-btn rounded-auth-btn text-auth-btn font-semibold",
            "text-auth-text-secondary bg-transparent",
            "border border-auth-input-border hover:bg-gray-50 transition-colors",
            "flex items-center justify-center gap-2"
          )}
        >
          Open {inboxUrl.label}
        </a>
      ) : email ? (
        <p className="text-auth-fine text-auth-text-muted text-center">
          Open your email app to find the verification link.
        </p>
      ) : null}

      <div className="h-3" />

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

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={null}>
      <VerifyEmailContent />
    </Suspense>
  );
}
