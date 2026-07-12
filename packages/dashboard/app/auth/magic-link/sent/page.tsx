"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { AuthCard } from "@/components/auth/auth-card";
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
          {email ? <span className="text-auth-text-secondary font-medium">{email}</span> : "your email"}. It expires in 15 minutes.
        </p>
      </div>

      <div className="h-6" />

      <ResendTimer initialSeconds={60} onResend={() => resendMutation.mutate({ email })} />

      <div className="h-4" />

      <Link href="/auth/magic-link" className="text-auth-label text-auth-link hover:underline text-center block">
        Try another email
      </Link>
    </AuthCard>
  );
}

export default function MagicLinkSentPage() {
  return <Suspense fallback={null}><MagicLinkSentContent /></Suspense>;
}
