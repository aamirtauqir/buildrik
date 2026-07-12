"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useOnboardingFlow } from "@lib/hooks/use-onboarding-flow";
import { AuthCard } from "@/components/auth/auth-card";
import { Loader2 } from "lucide-react";
import { trpc } from "@lib/trpc/client";

export default function AuthRedirectPage() {
  const router = useRouter();
  const { status } = useSession();
  const { isLoading, navigateToCurrentStep } = useOnboardingFlow();
  const workspacesQuery = trpc.account.workspace.listMine.useQuery(undefined, {
    enabled: status === "authenticated",
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/auth?reason=session-required");
      return;
    }
    if (status === "authenticated" && !isLoading && !workspacesQuery.isLoading) {
      // Removed from every workspace (no ACTIVE membership) → access-removed.
      if (workspacesQuery.data && workspacesQuery.data.length === 0) {
        router.replace("/auth/access-removed");
        return;
      }
      navigateToCurrentStep();
    }
  }, [status, isLoading, workspacesQuery.isLoading, workspacesQuery.data, navigateToCurrentStep, router]);

  return (
    <AuthCard noArt>
      <div className="flex flex-col items-center gap-5 py-6">
        <Loader2 className="w-8 h-8 text-auth-cta animate-spin" />
        <p className="text-auth-subtitle text-auth-text-muted">Signing you in…</p>
      </div>
    </AuthCard>
  );
}
