"use client";

import { useRouter } from "next/navigation";
import { OnboardingRoleSelect } from "@/components/onboarding/role-select";
import { api } from "@/lib/trpc/client";

export default function OnboardingRolePage() {
  const router = useRouter();
  const selectRole = api.onboarding.selectRole.useMutation({
    onSuccess: () => router.push("/onboarding/setup"),
  });

  return (
    <OnboardingRoleSelect
      onContinue={(role) => selectRole.mutate({ role })}
      loading={selectRole.isPending}
    />
  );
}
