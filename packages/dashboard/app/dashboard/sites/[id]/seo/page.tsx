"use client";

import { useParams } from "next/navigation";
import { trpc } from "@lib/trpc/client";
import { SeoTab } from "@/components/site-detail/seo-tab";
import { ErrorState } from "@/components/states";

export default function SiteSeoPage() {
  const params = useParams();
  const siteId = params.id as string;

  const settingsQuery = trpc.siteDetail.settings.get.useQuery({ siteId });

  if (settingsQuery.isLoading) {
    return <div className="h-64 animate-pulse rounded-lg" style={{ backgroundColor: "var(--color-bg-subtle)" }} />;
  }
  if (settingsQuery.isError) {
    return (
      <ErrorState
        title="Couldn't load SEO"
        description="Something went wrong on our end."
        onRetry={() => settingsQuery.refetch()}
      />
    );
  }

  // SEO content is edited in the editor now; this tab only previews it.
  const site: Record<string, unknown> = settingsQuery.data
    ? { ...settingsQuery.data }
    : { id: siteId };
  return <SeoTab site={site} />;
}
