"use client";

import { useParams } from "next/navigation";
import { trpc } from "@lib/trpc/client";
import { AccessTab } from "@/components/site-detail/access-tab";
import { useToast } from "@/components/dashboard/toast-provider";
import { PLAN_LIMITS, type PlanName } from "@lib/constants/plan-limits";

export default function SiteAccessPage() {
  const params = useParams();
  const siteId = params.id as string;
  const { addToast } = useToast();

  const linksQuery = trpc.siteDetail.sharing.list.useQuery({ siteId });
  // settings.get returns the workspace `plan`; overview does NOT — reading it
  // off overview silently collapsed every workspace to FREE (share-link
  // passwords disabled, expiry capped) regardless of the real plan.
  const settingsQuery = trpc.siteDetail.settings.get.useQuery({ siteId });
  const plan = (settingsQuery.data as { plan?: string } | undefined)?.plan ?? "FREE";
  const planLimits = PLAN_LIMITS[plan as PlanName] ?? PLAN_LIMITS.FREE;

  const createMutation = trpc.siteDetail.sharing.create.useMutation({
    onSuccess: () => {
      linksQuery.refetch();
      addToast("success", "Share link created");
    },
    onError: (err) => addToast("error", "Failed", err.message),
  });

  const revokeMutation = trpc.siteDetail.sharing.revoke.useMutation({
    onSuccess: () => {
      linksQuery.refetch();
      addToast("success", "Share link revoked");
    },
  });

  if (linksQuery.isLoading) {
    return <div className="h-64 animate-pulse rounded-xl" style={{ backgroundColor: "var(--color-bg-subtle)" }} />;
  }

  return (
    <AccessTab
      shareLinks={linksQuery.data ?? []}
      onCreateLink={(data) => createMutation.mutate({ siteId, ...data })}
      onRevokeLink={(id) => revokeMutation.mutate({ id })}
      maxExpiryDays={planLimits.shareLinkExpiryMaxDays as number}
      allowPasswords={!!planLimits.shareLinkPasswords}
    />
  );
}
