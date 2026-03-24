"use client";

import { useParams } from "next/navigation";
import { trpc } from "@/lib/trpc/client";
import { OverviewTab } from "@/components/site-detail/overview-tab";

export default function SiteOverviewPage() {
  const params = useParams();
  const siteId = params.id as string;

  const overview = trpc.siteDetail.overview.useQuery({ siteId });

  if (overview.isLoading) {
    return (
      <div className="grid grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="h-24 animate-pulse rounded-xl" style={{ backgroundColor: "#F4F4F4" }} />
        ))}
      </div>
    );
  }

  if (!overview.data) return null;

  return (
    <OverviewTab
      siteId={siteId}
      stats={overview.data.stats}
      activity={overview.data.recentActivity}
      lastPublishedAt={overview.data.site.lastPublishedAt}
    />
  );
}
