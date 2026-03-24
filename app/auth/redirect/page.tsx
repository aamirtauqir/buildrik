"use client";

import { useEffect } from "react";
import { useOnboardingFlow } from "@/lib/hooks/use-onboarding-flow";

export default function AuthRedirectPage() {
  const { isLoading, navigateToCurrentStep } = useOnboardingFlow();

  useEffect(() => {
    if (!isLoading) {
      navigateToCurrentStep();
    }
  }, [isLoading, navigateToCurrentStep]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-white">
      <div className="text-center">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-[#E42313] border-t-transparent" />
        <p className="mt-4 text-sm" style={{ color: "#7A7A7A" }}>Signing you in...</p>
      </div>
    </div>
  );
}
