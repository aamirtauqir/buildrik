"use client";

import { useParams } from "next/navigation";
import { trpc } from "@lib/trpc/client";
import { RedirectsTab } from "@/components/site-detail/redirects-tab";
import { ErrorState } from "@/components/states";
import { PLAN_LIMITS, type PlanName } from "@lib/constants/plan-limits";

export default function SiteRedirectsPage() {
  const params = useParams();
  const siteId = params.id as string;

  const listQuery = trpc.siteDetail.redirects.list.useQuery({ siteId });
  const wsQuery = trpc.account.workspace.get.useQuery();
  const plan = (wsQuery.data?.plan as PlanName) ?? "FREE";
  const limit = PLAN_LIMITS[plan].urlRedirects as number;

  if (listQuery.isLoading) {
    return <div className="h-64 animate-pulse rounded-lg" style={{ backgroundColor: "var(--color-bg-subtle)" }} />;
  }

  // Query error used to fall into `?? []` and render "No redirects yet".
  if (listQuery.isError) {
    return (
      <ErrorState
        title="Couldn't load redirects"
        description="Something went wrong on our end."
        onRetry={() => listQuery.refetch()}
      />
    );
  }

  // Read-only: redirects are managed in the editor's Site settings (PD-1).
  return <RedirectsTab siteId={siteId} redirects={listQuery.data ?? []} limit={limit} />;
}
