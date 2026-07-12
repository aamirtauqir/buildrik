"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { AuthMessage } from "@/components/auth/auth-message";
import { AuthButton } from "@/components/auth/auth-button";

const VARIANTS = {
  reset: {
    title: "Reset link expired",
    subtitle: "This password reset link has expired (1 hour limit).",
    cta: "Request a new reset link",
    href: "/auth/forgot-password",
  },
  verify: {
    title: "Verification link expired",
    subtitle: "This link has expired. Request a new verification email.",
    cta: "Resend verification email",
    href: "/auth/signup",
  },
  "magic-link": {
    title: "Magic link expired",
    subtitle: "This link has expired (15 minute limit). Request a new one.",
    cta: "Request a new magic link",
    href: "/auth/magic-link",
  },
} as const;

function ExpiredLinkContent() {
  const searchParams = useSearchParams();
  const type = (searchParams.get("type") ?? "reset") as keyof typeof VARIANTS;
  const v = VARIANTS[type] ?? VARIANTS.reset;

  return (
    <AuthMessage title={v.title} subtitle={v.subtitle}>
      <AuthButton onClick={() => (window.location.href = v.href)}>{v.cta}</AuthButton>
      <Link href="/auth" className="text-auth-label text-auth-text-muted hover:text-auth-text-secondary text-center">
        Back to log in
      </Link>
    </AuthMessage>
  );
}

export default function ExpiredLinkPage() {
  return (
    <Suspense fallback={null}>
      <ExpiredLinkContent />
    </Suspense>
  );
}
