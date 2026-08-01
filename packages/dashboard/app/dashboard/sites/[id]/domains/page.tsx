"use client";

import { useParams } from "next/navigation";
import { trpc } from "@lib/trpc/client";
import { DomainsTab } from "@/components/site-detail/domains-tab";
import { useToast } from "@/components/dashboard/toast-provider";
import { ErrorState } from "@/components/states";

export default function SiteDomainsPage() {
  const params = useParams();
  const siteId = params.id as string;
  const { addToast } = useToast();

  const domainsQuery = trpc.siteDetail.domains.list.useQuery({ siteId });
  const wsQuery = trpc.account.workspace.get.useQuery();
  const hasPending = domainsQuery.data?.some((d: { status: string }) => d.status === "PENDING");

  // Re-query with polling when there are pending domains
  trpc.siteDetail.domains.list.useQuery(
    { siteId },
    { refetchInterval: hasPending ? 30000 : false, enabled: !!hasPending },
  );

  const connectMutation = trpc.siteDetail.domains.connect.useMutation({
    onSuccess: () => {
      domainsQuery.refetch();
      addToast("success", "Domain connected — verifying DNS...");
    },
    onError: (err) => addToast("error", "Failed", err.message),
  });

  const removeMutation = trpc.siteDetail.domains.remove.useMutation({
    onSuccess: () => {
      domainsQuery.refetch();
      addToast("success", "Domain removed");
    },
    onError: (err) => addToast("error", "Couldn't remove domain", err.message),
  });

  const setPrimaryMutation = trpc.siteDetail.domains.setPrimary.useMutation({
    onSuccess: () => {
      domainsQuery.refetch();
      addToast("success", "Primary domain updated");
    },
    onError: (err) => addToast("error", "Failed", err.message),
  });

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

  return (
    <DomainsTab
      domains={domainsQuery.data ?? []}
      plan={wsQuery.data?.plan}
      onConnect={(domain) => connectMutation.mutate({ siteId, domain })}
      onRemove={(id) => removeMutation.mutate({ id })}
      onSetPrimary={(id) => setPrimaryMutation.mutate({ id, siteId })}
    />
  );
}
