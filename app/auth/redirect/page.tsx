"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useOnboardingFlow } from "@/lib/hooks/use-onboarding-flow";

function isSameOrigin(url: string): boolean {
  try {
    const parsed = new URL(url, window.location.origin);
    return parsed.origin === window.location.origin;
  } catch {
    return false;
  }
}

function AuthRedirectContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawReturnUrl = searchParams.get("returnUrl");
  const returnUrl = rawReturnUrl && isSameOrigin(rawReturnUrl) ? rawReturnUrl : null;
  const { isLoading, navigateToCurrentStep, isComplete } = useOnboardingFlow();

  useEffect(() => {
    if (!isLoading) {
      if (isComplete && returnUrl) {
        router.push(returnUrl);
      } else {
        navigateToCurrentStep();
      }
    }
  }, [isLoading, isComplete, navigateToCurrentStep, returnUrl, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-white">
      <div className="text-center">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-[#E42313] border-t-transparent" />
        <p className="mt-4 text-sm" style={{ color: "#7A7A7A" }}>Signing you in...</p>
      </div>
    </div>
  );
}

export default function AuthRedirectPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-[#E42313] border-t-transparent" />
      </div>
    }>
      <AuthRedirectContent />
    </Suspense>
  );
}
