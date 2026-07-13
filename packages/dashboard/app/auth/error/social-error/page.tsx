"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { XCircle } from "lucide-react";
import { AuthMessage } from "@/components/auth/auth-message";
import { AuthButton } from "@/components/auth/auth-button";

function SocialErrorContent() {
  const searchParams = useSearchParams();
  const provider = searchParams.get("provider");
  // Only title-case a real provider name. Capitalising the fallback rendered
  // "We couldn't authenticate with The provider." on any hit without ?provider.
  // (The mockup hardcodes "Google"; the route is provider-agnostic.)
  const who = provider
    ? `${provider.charAt(0).toUpperCase()}${provider.slice(1)}`
    : "that provider";

  return (
    <AuthMessage
      icon={<XCircle size={26} strokeWidth={1.7} className="text-auth-input-error" />}
      title="Couldn't connect that account"
      subtitle={`We couldn't complete sign-in with ${who}. Please try again, or use your email and password.`}
    >
      <AuthButton onClick={() => window.history.back()}>Try again</AuthButton>
      <AuthButton variant="secondary" onClick={() => (window.location.href = "/auth")}>
        Use email instead
      </AuthButton>
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
