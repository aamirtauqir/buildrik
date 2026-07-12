"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useWizard } from "@/components/onboarding/wizard/wizard-context";

/** Entry frame: resume the wizard at the last saved route (server-persisted via
 *  WizardBoot). New users land on /onboarding/workspace (the default route). */
export default function OnboardingPage() {
  const router = useRouter();
  const { data } = useWizard();

  useEffect(() => {
    const target = data.route && data.route !== "/onboarding" ? data.route : "/onboarding/workspace";
    router.replace(target);
  }, [data.route, router]);

  return (
    <div className="min-h-dvh bg-white flex items-center justify-center">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-onb-line border-t-onb-primary" />
    </div>
  );
}
