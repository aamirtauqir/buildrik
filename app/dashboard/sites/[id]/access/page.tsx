"use client";

import { useParams } from "next/navigation";
import { trpc } from "@/lib/trpc/client";
import { AccessTab } from "@/components/site-detail/access-tab";
import { useToast } from "@/components/dashboard/toast-provider";

export default function SiteAccessPage() {
  const params = useParams();
  const siteId = params.id as string;
  const { addToast } = useToast();

  const linksQuery = trpc.siteDetail.sharing.list.useQuery({ siteId });

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
    return <div className="h-64 animate-pulse rounded-xl" style={{ backgroundColor: "#F4F4F4" }} />;
  }

  return (
    <AccessTab
      shareLinks={linksQuery.data ?? []}
      onCreateLink={(data) => createMutation.mutate({ siteId, ...data })}
      onRevokeLink={(id) => revokeMutation.mutate({ id })}
    />
  );
}
