"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { AuthCard } from "@/components/auth/auth-card";
import { AuthLogo } from "@/components/auth/auth-logo";
import { AuthIcon } from "@/components/auth/auth-icon";
import { AuthButton } from "@/components/auth/auth-button";

function SocialErrorContent() {
  const searchParams = useSearchParams();
  const provider = searchParams.get("provider") ?? "the provider";
  const providerLabel =
    provider.charAt(0).toUpperCase() + provider.slice(1);

  const handleRetry = () => {
    window.history.back();
  };

  return (
    <AuthCard>
      <AuthLogo />
      <AuthIcon name="warning" color="red" />

      <h1 className="text-auth-title text-auth-text-primary text-center">
        Authentication failed
      </h1>
      <p className="text-auth-subtitle text-auth-text-muted text-center mt-1 mb-6">
        Could not authenticate with {providerLabel}. Please try again.
      </p>

      <div className="h-4" />

      <AuthButton onClick={handleRetry}>Try Again</AuthButton>

      <div className="h-3" />

      <Link
        href="/auth/login"
        className="text-auth-link hover:underline text-center block"
      >
        Use email instead
      </Link>

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

export default function SocialErrorPage() {
  return (
    <Suspense fallback={null}>
      <SocialErrorContent />
    </Suspense>
  );
}
