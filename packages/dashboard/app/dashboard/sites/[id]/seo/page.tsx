"use client";

import { useParams } from "next/navigation";
import { trpc } from "@lib/trpc/client";
import { SeoTab } from "@/components/site-detail/seo-tab";
import { useToast } from "@/components/dashboard/toast-provider";

export default function SiteSeoPage() {
  const params = useParams();
  const siteId = params.id as string;
  const { addToast } = useToast();

  const settingsQuery = trpc.siteDetail.settings.get.useQuery({ siteId });

  const updateSeo = trpc.siteDetail.settings.update.useMutation({
    onSuccess: () => {
      settingsQuery.refetch();
      addToast("success", "SEO settings saved");
    },
    onError: (err) => addToast("error", "Failed", err.message),
  });

  if (settingsQuery.isLoading) {
    return <div className="h-64 animate-pulse rounded-xl" style={{ backgroundColor: "#F4F4F4" }} />;
  }

  // settingsQuery.data may be undefined during initial load. SeoTab's prop
  // type uses `[key: string]: unknown` for forward-compat, but the rich
  // Site row from settings query has typed nullable Date columns that don't
  // structurally match the catch-all when wrapped in `?? {}`. Spread into a
  // fresh record so we hand SeoTab a plain Record<string, unknown> view.
  const site: Record<string, unknown> = settingsQuery.data
    ? { ...settingsQuery.data }
    : { id: siteId };
  return (
    <SeoTab
      site={site}
      onSaveSeo={(data) => updateSeo.mutate({ id: siteId, ...data })}
    />
  );
}
