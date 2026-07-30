"use client";

import { Spinner } from "flowbite-react";
import { trpc } from "@lib/trpc/client";
import { wizardDataSchema, type WizardData } from "@buildrik/shared/schemas/onboarding";
import { WizardProvider } from "./wizard-context";

const ENTRY: WizardData = { v: 1, route: "/onboarding/workspace" };

/**
 * Loads the server-side wizard state once, then hands the wizard subtree a
 * validated `initial`. Server wins on load; a malformed/absent blob falls back
 * to the entry frame. Kept in the onboarding layout so the provider survives
 * client-side navigation between frames (single state object, no refetch).
 */
export function WizardBoot({ children }: { children: React.ReactNode }) {
  const { data, isLoading } = trpc.onboarding.getState.useQuery(undefined, {
    refetchOnWindowFocus: false,
    staleTime: Infinity,
  });

  if (isLoading) {
    return (
      <div className="min-h-dvh bg-white flex items-center justify-center">
        <Spinner size="md" />
      </div>
    );
  }

  const parsed = wizardDataSchema.safeParse(data?.wizardData);
  const initial = parsed.success ? parsed.data : ENTRY;

  return <WizardProvider initial={initial}>{children}</WizardProvider>;
}
