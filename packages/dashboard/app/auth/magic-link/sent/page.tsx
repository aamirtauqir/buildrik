"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { AuthCard } from "@/components/auth/auth-card";
import { AuthBackLink } from "@/components/auth/auth-back-link";
import { ResendTimer } from "@/components/auth/resend-timer";
import { trpc } from "@lib/trpc/client";

function MagicLinkSentContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";
  const resendMutation = trpc.auth.magicLink.useMutation();

  return (
    <AuthCard>
      <div className="text-center">
        <h1 className="text-auth-title text-auth-text-primary">Magic link on its way</h1>
        <p className="text-auth-subtitle text-auth-text-muted mt-2">
          We emailed a log-in link to{" "}
          {email ? <span className="text-auth-text-body font-medium">{email}</span> : "your email"}. It&apos;s valid for
          15 minutes.
        </p>
      </div>

      <div className="h-6" />

      <ResendTimer initialSeconds={60} label="Resend link" onResend={() => resendMutation.mutate({ email })} />

      <div className="h-4" />

      <p className="text-auth-label text-auth-text-muted text-center">
        Didn&apos;t arrive?{" "}
        <Link href="/auth/magic-link" className="font-semibold text-auth-text-body hover:underline">
          Try another email
        </Link>
      </p>
    
      <div className="h-3" />
      <AuthBackLink />
    </AuthCard>
  );
}

export default function MagicLinkSentPage() {
  return (
    <Suspense fallback={null}>
      <MagicLinkSentContent />
    </Suspense>
  );
}
