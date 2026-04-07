"use client";

import { useRouter } from "next/navigation";
import { OnboardingProjectSetup } from "@/components/onboarding/project-setup";
import { trpc } from "@lib/trpc/client";

const editorUrl = process.env.NEXT_PUBLIC_EDITOR_URL || "http://localhost:5050";

export default function OnboardingSetupPage() {
  const router = useRouter();
  const createSite = trpc.sites.create.useMutation({
    onSuccess: (site) => { window.location.href = `${editorUrl}/?siteId=${site.id}`; },
  });
  const setupProject = trpc.onboarding.setupProject.useMutation({
    onSuccess: (_data, variables) => {
      switch (variables.method) {
        case "blank":
          createSite.mutate({ name: variables.projectName, method: "blank" });
          break;
        case "template":
          router.push("/dashboard/sites/new?method=template");
          break;
        case "ai":
          router.push("/dashboard/sites/new?method=ai");
          break;
      }
    },
  });

  return (
    <OnboardingProjectSetup
      onContinue={(data) => setupProject.mutate(data)}
      onBack={() => router.push("/onboarding/role")}
      loading={setupProject.isPending || createSite.isPending}
    />
  );
}
