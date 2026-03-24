"use client";

import { useRouter } from "next/navigation";
import { OnboardingProjectSetup } from "@/components/onboarding/project-setup";
import { api } from "@/lib/trpc/client";

export default function OnboardingSetupPage() {
  const router = useRouter();
  const setupProject = api.onboarding.setupProject.useMutation({
    onSuccess: () => router.push("/dashboard"),
  });

  return (
    <OnboardingProjectSetup
      onContinue={(data) => setupProject.mutate(data)}
      onBack={() => router.push("/onboarding/role")}
      loading={setupProject.isPending}
    />
  );
}
