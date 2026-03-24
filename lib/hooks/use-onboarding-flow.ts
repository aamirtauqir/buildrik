"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { trpc } from "@/lib/trpc/client";

export function useOnboardingFlow() {
  const router = useRouter();
  const stateQuery = trpc.onboarding.getState.useQuery();

  const navigateToCurrentStep = useCallback(() => {
    if (!stateQuery.data) return;
    const state = stateQuery.data;

    if (state.completed || state.dismissed) {
      router.push("/dashboard");
      return;
    }

    switch (state.step) {
      case "ROLE_SELECT":
        router.push("/onboarding/role");
        break;
      case "PROJECT_SETUP":
        router.push("/onboarding/setup");
        break;
      case "SITE_CREATION":
        router.push("/onboarding/setup");
        break;
      case "EDITOR_TOUR":
      case "CHECKLIST":
        router.push("/dashboard");
        break;
      case "COMPLETED":
        router.push("/dashboard");
        break;
      default:
        router.push("/onboarding/role");
    }
  }, [stateQuery.data, router]);

  return {
    state: stateQuery.data,
    isLoading: stateQuery.isLoading,
    navigateToCurrentStep,
    isComplete: stateQuery.data?.completed || stateQuery.data?.dismissed,
  };
}
