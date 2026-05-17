"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useOnboardingFlow } from "@lib/hooks/use-onboarding-flow";

export default function AuthRedirectPage() {
  const router = useRouter();
  const { status } = useSession();
  const { isLoading, navigateToCurrentStep } = useOnboardingFlow();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/auth?reason=session-required");
      return;
    }
    if (status === "authenticated" && !isLoading) {
      navigateToCurrentStep();
    }
  }, [status, isLoading, navigateToCurrentStep, router]);

  return (
    <div className="flex min-h-dvh items-center justify-center bg-white">
      <div className="text-center">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-[#E42313] border-t-transparent" />
        <p className="mt-4 text-sm" style={{ color: "#7A7A7A" }}>Signing you in...</p>
      </div>
    </div>
  );
}
