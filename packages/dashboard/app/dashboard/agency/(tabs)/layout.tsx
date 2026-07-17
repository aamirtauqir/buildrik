"use client";

import { redirect } from "next/navigation";
import { trpc } from "@lib/trpc/client";
import { LoadingSkeleton, ErrorState } from "@/components/states";
import { PageHeader } from "@/components/dashboard/primitives";
import { AgencyTabs } from "@/components/dashboard/shell/agency-tabs";

/** Agency section chrome (IA v2). The layout owns the PageHeader + tab row
 *  (D10.4 — tab pages provide content only) and the route-level agency guard
 *  (D7): a solo workspace never sees agency chrome — while the features query
 *  is in flight we render a skeleton so tabs never flash, and a non-agency
 *  workspace is redirected to the dashboard. The tRPC layer stays the
 *  security authority; this guard is UX. */
export default function AgencyTabsLayout({ children }: { children: React.ReactNode }) {
  const features = trpc.features.list.useQuery(undefined, { staleTime: 60_000 });

  if (features.isLoading) return <LoadingSkeleton rows={3} variant="card" />;
  if (features.isError) {
    return (
      <ErrorState
        title="Couldn't load workspace features"
        description="Something went wrong on our end."
        onRetry={() => features.refetch()}
      />
    );
  }
  if (!features.data?.agency_layer) redirect("/dashboard");

  return (
    <div>
      <PageHeader title="Agency" description="Clients, sign-off, shared theme, and partner program." />
      <div className="mb-6">
        <AgencyTabs />
      </div>
      {children}
    </div>
  );
}
