"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthMessage } from "@/components/auth/auth-message";
import { AuthButton } from "@/components/auth/auth-button";

/**
 * One screen for every dead link (reset / verify / magic). Copy states the real
 * server TTLs from auth.service: password_reset 60 min, email_verify 24 h,
 * magic_link 15 min. A token that fails validateToken may be expired, already
 * used, or malformed — indistinguishable server-side, so the copy covers all.
 */
const VARIANTS = {
  reset: {
    title: "This link isn't valid",
    subtitle:
      "Password reset links last 1 hour and work once. Request a new one and open it straight from your email.",
    cta: "Request a new link",
    href: "/auth/forgot-password",
  },
  verify: {
    title: "Verification link expired",
    subtitle:
      "This link is no longer valid. Request a new verification email and open it within 24 hours.",
    cta: "Resend verification email",
    href: "/auth/verify-email",
  },
  magic: {
    title: "This magic link expired",
    subtitle: "For your security, magic links last 15 minutes. Request a fresh one to log in.",
    cta: "Request a new link",
    href: "/auth/magic-link",
  },
} as const;

function variantFor(type: string | null) {
  if (type === "verify") return VARIANTS.verify;
  if (type === "magic-link") return VARIANTS.magic;
  return VARIANTS.reset;
}

function ExpiredLinkContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";
  const variant = variantFor(searchParams.get("type"));

  // Only the verify screen can act on an email (it owns the resend button).
  const href =
    variant === VARIANTS.verify && email
      ? `${variant.href}?email=${encodeURIComponent(email)}`
      : variant.href;

  return (
    <AuthMessage title={variant.title} subtitle={variant.subtitle}>
      <AuthButton onClick={() => router.push(href)}>{variant.cta}</AuthButton>
      <AuthButton variant="secondary" onClick={() => router.push("/auth")}>
        Back to log in
      </AuthButton>
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
