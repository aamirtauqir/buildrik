"use client";

import { useRouter } from "next/navigation";
import { OnboardingProjectSetup } from "@/components/onboarding/project-setup";
import { trpc } from "@lib/trpc/client";
import { getEditorHref, useUnifiedEditorFlag } from "@/components/editor-route/unified-flag";

export default function OnboardingSetupPage() {
  const router = useRouter();
  const unified = useUnifiedEditorFlag();
  const setFeature = trpc.features.set.useMutation();
  const createSite = trpc.sites.create.useMutation({
    onSuccess: (site) => {
      const href = getEditorHref(site.id, unified);
      if (unified) router.push(href);
      else window.location.href = href;
    },
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
      onContinue={({ projectName, method, workspaceType }) => {
        // "An agency or team" turns on the agency layer (Clients · Reviews ·
        // Comments · Shared theme nav). Fire-and-forget; project setup proceeds
        // regardless so a flag hiccup never blocks onboarding.
        if (workspaceType === "agency") {
          setFeature.mutate({ key: "agency_layer", enabled: true });
        }
        setupProject.mutate({ projectName, method });
      }}
      onBack={() => router.push("/onboarding/role")}
      loading={setupProject.isPending || createSite.isPending}
    />
  );
}
