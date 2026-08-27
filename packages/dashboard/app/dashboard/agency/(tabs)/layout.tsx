"use client";

import { redirect, usePathname, useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { trpc } from "@lib/trpc/client";
import { LoadingSkeleton, ErrorState } from "@/components/states";
import { PageHeader, Button } from "@/components/dashboard/primitives";
import { AgencyTabs } from "@/components/dashboard/shell/agency-tabs";

/** Agency section chrome (IA v2). The layout owns the PageHeader + tab row
 *  (D10.4 — tab pages provide content only) and the route-level agency guard
 *  (D7): a solo workspace never sees agency chrome — while the features query
 *  is in flight we render a skeleton so tabs never flash, and a non-agency
 *  workspace is redirected to the dashboard. The tRPC layer stays the
 *  security authority; this guard is UX. */
export default function AgencyTabsLayout({ children }: { children: React.ReactNode }) {
  const features = trpc.features.list.useQuery(undefined, { staleTime: 60_000 });
  const health = trpc.dashboard.health.useQuery();
  const canManageClients = health.data?.role === "OWNER" || health.data?.role === "ADMIN";
  const pathname = usePathname();
  const router = useRouter();
  // The Clients tab's primary action lives in the section header (audit A3 —
  // it used to float in a dead-space row inside the tab). It opens the create
  // dialog via a ?new=1 param the ClientsView consumes, so the button can sit
  // in the shared PageHeader without the layout owning the dialog state.
  const onClientsTab = pathname === "/dashboard/agency";

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
      <PageHeader
        title="Agency"
        /* Partner is closed — its route redirects and its tab is gone, because
           nothing writes a `Referral` row. Naming it here advertised it anyway. */
        description="Clients, sign-off, shared theme, and a shared component library."
        actions={
          onClientsTab ? (
            <Button
              onClick={() => router.push("/dashboard/agency?new=1")}
              className="gap-1.5"
              /* clients.ts gates creation on ADMIN. A Designer got the New
                 client dialog and a refusal only after filling it in. */
              disabled={!canManageClients}
              title={canManageClients ? undefined : "Only workspace admins can add clients."}
            >
              <Plus className="h-4 w-4" />
              Add client
            </Button>
          ) : undefined
        }
      />
      <div className="mb-6">
        <AgencyTabs />
      </div>
      {children}
    </div>
  );
}
