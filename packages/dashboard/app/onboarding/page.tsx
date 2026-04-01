"use client";

import { useEffect } from "react";
import { useOnboardingFlow } from "@lib/hooks/use-onboarding-flow";

export default function OnboardingPage() {
  const { isLoading, navigateToCurrentStep } = useOnboardingFlow();

  useEffect(() => {
    if (!isLoading) {
      navigateToCurrentStep();
    }
  }, [isLoading, navigateToCurrentStep]);

  return (
    <div className="flex min-h-screen items-center justify-center" style={{ backgroundColor: "#0D0D0D" }}>
      <div className="text-center">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-white border-t-transparent" />
        <p className="mt-4 text-sm text-white/60">Loading...</p>
      </div>
    </div>
  );
}
