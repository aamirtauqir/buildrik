"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { AuthCard } from "@/components/auth/auth-card";
import { AuthLogo } from "@/components/auth/auth-logo";
import { AuthIcon } from "@/components/auth/auth-icon";
import { AuthButton } from "@/components/auth/auth-button";
import { ResendTimer } from "@/components/auth/resend-timer";
import { trpc } from "@lib/trpc/client";

function MagicLinkSentContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";
  const resendMutation = trpc.auth.magicLink.useMutation();

  return (
    <AuthCard>
      <AuthLogo />
      <AuthIcon name="mail" color="blue" />
      <h1 className="text-auth-title text-auth-text-primary text-center">Check your email</h1>
      <p className="text-auth-subtitle text-auth-text-muted text-center mt-1">
        We sent a magic link to {email || "your email"}. Click the link to sign in. Expires in 15 minutes.
      </p>
      <div className="h-6" />
      <a href="mailto:" className="w-full">
        <AuthButton type="button">Open Email App</AuthButton>
      </a>
      <div className="h-4" />
      <ResendTimer initialSeconds={60} onResend={() => resendMutation.mutate({ email })} />
      <div className="h-3" />
      <Link href="/auth/login" className="text-auth-link hover:underline text-center block">Use password instead</Link>
      <div className="h-2" />
      <Link href="/auth/login" className="text-auth-label text-auth-link hover:underline text-center block">← Back to sign in</Link>
    </AuthCard>
  );
}

export default function MagicLinkSentPage() {
  return <Suspense fallback={null}><MagicLinkSentContent /></Suspense>;
}
