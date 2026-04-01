"use client";

import { useParams } from "next/navigation";
import { trpc } from "@lib/trpc/client";
import { OverviewTab } from "@/components/site-detail/overview-tab";

export default function SiteOverviewPage() {
  const params = useParams();
  const siteId = params.id as string;

  const overview = trpc.siteDetail.overview.useQuery({ siteId });

  return (
    <OverviewTab
      siteId={siteId}
      stats={overview.data?.stats ?? { totalPages: 0, monthlyVisitors: 0, visitorsChange: 0, teamMembers: 0, formSubmissions: 0, unreadSubmissions: 0, healthScore: 0, healthBreakdown: { seo: 0, content: 0, ssl: 0, favicon: 0 } }}
      activity={overview.data?.recentActivity ?? []}
      lastPublishedAt={overview.data?.site.lastPublishedAt ?? null}
      lastPublishedBy={overview.data?.site.lastPublishedBy}
      formBlocks={overview.data?.formBlocks ?? []}
      isLoading={overview.isLoading}
      isError={overview.isError}
      onRetry={() => overview.refetch()}
    />
  );
}
