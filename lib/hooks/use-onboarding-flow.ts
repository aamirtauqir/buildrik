"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { trpc } from "@/lib/trpc/client";
import { wizardDataSchema } from "@buildrik/shared/schemas/onboarding";

/**
 * Post-auth entry router for the M2 onboarding wizard. Resumes at the last saved
 * frame (wizardData.route); new users start at S1; anyone past the wizard
 * (CHECKLIST/COMPLETED/dismissed) goes to the dashboard, where the checklist
 * widget takes over.
 */
export function useOnboardingFlow() {
  const router = useRouter();
  const stateQuery = trpc.onboarding.getState.useQuery();

  const navigateToCurrentStep = useCallback(() => {
    if (!stateQuery.data) return;
    const state = stateQuery.data;

    if (
      state.completed ||
      state.dismissed ||
      state.step === "CHECKLIST" ||
      state.step === "COMPLETED"
    ) {
      router.push("/dashboard");
      return;
    }

    const wizard = wizardDataSchema.safeParse(state.wizardData);
    router.push(wizard.success ? wizard.data.route : "/onboarding/workspace");
  }, [stateQuery.data, router]);

  return {
    state: stateQuery.data,
    isLoading: stateQuery.isLoading,
    navigateToCurrentStep,
    isComplete: stateQuery.data?.completed || stateQuery.data?.dismissed,
  };
}
