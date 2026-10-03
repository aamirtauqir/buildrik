"use client";

import { useParams } from "next/navigation";
import { trpc } from "@lib/trpc/client";
import { DomainsTab } from "@/components/site-detail/domains-tab";
import { ErrorState } from "@/components/states";

export default function SiteDomainsPage() {
  const params = useParams();
  const siteId = params.id as string;

  const domainsQuery = trpc.siteDetail.domains.list.useQuery({ siteId });

  if (domainsQuery.isLoading) {
    return <div className="h-64 animate-pulse rounded-lg" style={{ backgroundColor: "var(--color-bg-subtle)" }} />;
  }

  // Without this the query error fell into `?? []` and the tab rendered as if
  // there were simply no domains — a failure disguised as an empty state.
  if (domainsQuery.isError) {
    return (
      <ErrorState
        title="Couldn't load domains"
        description="Something went wrong on our end."
        onRetry={() => domainsQuery.refetch()}
      />
    );
  }

  // Read-only: domains are managed in the editor's Site settings (PD-1).
  return <DomainsTab siteId={siteId} domains={domainsQuery.data ?? []} />;
}
