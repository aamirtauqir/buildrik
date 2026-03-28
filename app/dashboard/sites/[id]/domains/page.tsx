"use client";

import { useParams } from "next/navigation";
import { trpc } from "@/lib/trpc/client";
import { DomainsTab } from "@/components/site-detail/domains-tab";
import { useToast } from "@/components/dashboard/toast-provider";

export default function SiteDomainsPage() {
  const params = useParams();
  const siteId = params.id as string;
  const { addToast } = useToast();

  const domainsQuery = trpc.siteDetail.domains.list.useQuery({ siteId });
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
  });

  const setPrimaryMutation = trpc.siteDetail.domains.setPrimary.useMutation({
    onSuccess: () => {
      domainsQuery.refetch();
      addToast("success", "Primary domain updated");
    },
    onError: (err) => addToast("error", "Failed", err.message),
  });

  if (domainsQuery.isLoading) {
    return <div className="h-64 animate-pulse rounded-xl" style={{ backgroundColor: "#F4F4F4" }} />;
  }

  return (
    <DomainsTab
      domains={domainsQuery.data ?? []}
      onConnect={(domain) => connectMutation.mutate({ siteId, domain })}
      onRemove={(id) => removeMutation.mutate({ id, siteId })}
      onSetPrimary={(id) => setPrimaryMutation.mutate({ id, siteId })}
    />
  );
}
