"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { AuthMessage } from "@/components/auth/auth-message";
import { AuthButton } from "@/components/auth/auth-button";

function SocialErrorContent() {
  const searchParams = useSearchParams();
  const provider = searchParams.get("provider") ?? "the provider";
  const providerLabel = provider.charAt(0).toUpperCase() + provider.slice(1);

  return (
    <AuthMessage
      title="Sign-in failed"
      subtitle={`We couldn't authenticate with ${providerLabel}. Please try again.`}
    >
      <AuthButton onClick={() => window.history.back()}>Try again</AuthButton>
      <Link href="/auth" className="text-auth-label text-auth-link hover:underline text-center">
        Use email instead
      </Link>
    </AuthMessage>
  );
}

export default function SocialErrorPage() {
  return (
    <Suspense fallback={null}>
      <SocialErrorContent />
    </Suspense>
  );
}
