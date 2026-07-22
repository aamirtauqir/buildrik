"use client";

import { useParams } from "next/navigation";
import { trpc } from "@lib/trpc/client";
import { RedirectsTab } from "@/components/site-detail/redirects-tab";
import { useToast } from "@/components/dashboard/toast-provider";
import { ErrorState } from "@/components/states";
import { PLAN_LIMITS, type PlanName } from "@lib/constants/plan-limits";

export default function SiteRedirectsPage() {
  const params = useParams();
  const siteId = params.id as string;
  const { addToast } = useToast();

  const utils = trpc.useUtils();
  const listQuery = trpc.siteDetail.redirects.list.useQuery({ siteId });
  const wsQuery = trpc.account.workspace.get.useQuery();
  const plan = (wsQuery.data?.plan as PlanName) ?? "FREE";
  const limit = PLAN_LIMITS[plan].urlRedirects as number;

  const createMutation = trpc.siteDetail.redirects.create.useMutation({
    onSuccess: () => { listQuery.refetch(); addToast("success", "Redirect added"); },
    onError: (err) => addToast("error", "Failed", err.message),
  });
  const deleteMutation = trpc.siteDetail.redirects.delete.useMutation({
    onSuccess: () => { listQuery.refetch(); addToast("success", "Redirect removed"); },
    onError: (err) => addToast("error", "Couldn't remove redirect", err.message),
  });
  const importMutation = trpc.siteDetail.redirects.import_csv.useMutation({
    onSuccess: () => { listQuery.refetch(); addToast("success", "Redirects imported"); },
    onError: (err) => addToast("error", "Import failed", err.message),
  });
  const handleExport = async () => {
    const res = await utils.siteDetail.redirects.export_csv.fetch({ siteId });
    const blob = new Blob([res.csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `redirects-${siteId}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (listQuery.isLoading) {
    return <div className="h-64 animate-pulse rounded-xl" style={{ backgroundColor: "var(--color-bg-subtle)" }} />;
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

  return (
    <RedirectsTab
      redirects={listQuery.data ?? []}
      limit={limit}
      canEdit
      onCreate={(data) => createMutation.mutate({ siteId, ...data })}
      onDelete={(id) => deleteMutation.mutate({ id })}
      onImport={(csv) => importMutation.mutate({ siteId, csv })}
      onExport={handleExport}
      saving={createMutation.isPending || importMutation.isPending}
    />
  );
}
