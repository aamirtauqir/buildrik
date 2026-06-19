"use client";

import { useRouter } from "next/navigation";
import { OnboardingRoleSelect } from "@/components/onboarding/role-select";
import { trpc } from "@lib/trpc/client";

export default function OnboardingRolePage() {
  const router = useRouter();
  const selectRole = trpc.onboarding.selectRole.useMutation({
    onSuccess: () => router.push("/onboarding/setup"),
  });

  return (
    <OnboardingRoleSelect
      onContinue={(density) => selectRole.mutate({ density })}
      loading={selectRole.isPending}
    />
  );
}
