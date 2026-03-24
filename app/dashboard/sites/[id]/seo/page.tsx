"use client";

import { useParams } from "next/navigation";
import { trpc } from "@/lib/trpc/client";
import { SeoTab } from "@/components/site-detail/seo-tab";
import { useToast } from "@/components/dashboard/toast-provider";

export default function SiteSeoPage() {
  const params = useParams();
  const siteId = params.id as string;
  const { addToast } = useToast();

  const settingsQuery = trpc.siteDetail.settings.get.useQuery({ siteId });
  const redirectsQuery = trpc.siteDetail.redirects.list.useQuery({ siteId });

  const updateSeo = trpc.siteDetail.settings.update.useMutation({
    onSuccess: () => {
      settingsQuery.refetch();
      addToast("success", "SEO settings saved");
    },
  });

  const addRedirect = trpc.siteDetail.redirects.create.useMutation({
    onSuccess: () => {
      redirectsQuery.refetch();
      addToast("success", "Redirect added");
    },
    onError: (err) => addToast("error", "Failed", err.message),
  });

  const deleteRedirect = trpc.siteDetail.redirects.delete.useMutation({
    onSuccess: () => {
      redirectsQuery.refetch();
      addToast("success", "Redirect removed");
    },
  });

  if (settingsQuery.isLoading) {
    return <div className="h-64 animate-pulse rounded-xl" style={{ backgroundColor: "#F4F4F4" }} />;
  }

  return (
    <SeoTab
      site={settingsQuery.data ?? {}}
      redirects={redirectsQuery.data ?? []}
      onSaveSeo={(data) => updateSeo.mutate({ id: siteId, ...data })}
      onAddRedirect={(data) => addRedirect.mutate({ siteId, ...data })}
      onDeleteRedirect={(id) => deleteRedirect.mutate({ id })}
    />
  );
}
