"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { AuthMessage } from "@/components/auth/auth-message";
import { AuthButton } from "@/components/auth/auth-button";

function SocialErrorContent() {
  const searchParams = useSearchParams();
  const provider = searchParams.get("provider");
  // Only title-case a real provider name. Capitalising the fallback rendered
  // "We couldn't authenticate with The provider." on any hit without ?provider.
  const subtitle = provider
    ? `We couldn't authenticate with ${provider.charAt(0).toUpperCase()}${provider.slice(1)}. Please try again.`
    : "We couldn't authenticate with that provider. Please try again.";

  return (
    <AuthMessage title="Sign-in failed" subtitle={subtitle}>
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
