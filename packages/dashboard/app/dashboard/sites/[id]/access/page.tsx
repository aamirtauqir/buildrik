"use client";

import { useParams } from "next/navigation";
import { trpc } from "@lib/trpc/client";
import { AccessTab } from "@/components/site-detail/access-tab";
import { useToast } from "@/components/dashboard/toast-provider";
import { ErrorState } from "@/components/states";
import { PLAN_LIMITS, type PlanName } from "@lib/constants/plan-limits";
import { ROLE_RANK, type UserRoleType } from "@lib/constants/enums";

export default function SiteAccessPage() {
  const params = useParams();
  const siteId = params.id as string;
  const { addToast } = useToast();

  const linksQuery = trpc.siteDetail.sharing.list.useQuery({ siteId });
  // sharing.revoke requires ADMIN on the server (checkSiteRole in
  // site-detail.ts) — Revoke must not render for anyone below that, not
  // just VIEWER. myRole is the same effective-role resolver the chrome
  // already uses to disable controls the server would refuse (sites.ts
  // comment above myRole).
  const roleQuery = trpc.sites.myRole.useQuery({ siteId });
  const canRevoke = roleQuery.data ? ROLE_RANK[roleQuery.data.role as UserRoleType] >= ROLE_RANK.ADMIN : false;
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
    onError: (err) => addToast("error", "Couldn't revoke link", err.message),
  });

  if (linksQuery.isLoading) {
    return <div className="h-64 animate-pulse rounded-lg" style={{ backgroundColor: "var(--color-bg-subtle)" }} />;
  }

  // Query error used to fall into `?? []` and render "No share links yet".
  if (linksQuery.isError) {
    return (
      <ErrorState
        title="Couldn't load share links"
        description="Something went wrong on our end."
        onRetry={() => linksQuery.refetch()}
      />
    );
  }

  return (
    <AccessTab
      shareLinks={linksQuery.data ?? []}
      onCreateLink={(data) => createMutation.mutate({ siteId, ...data })}
      onRevokeLink={(id) => revokeMutation.mutate({ id })}
      maxExpiryDays={planLimits.shareLinkExpiryMaxDays as number}
      allowPasswords={!!planLimits.shareLinkPasswords}
      canRevoke={canRevoke}
    />
  );
}
