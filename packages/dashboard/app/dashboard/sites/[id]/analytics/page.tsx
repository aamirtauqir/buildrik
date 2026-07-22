"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { trpc } from "@lib/trpc/client";
import { AnalyticsTab } from "@/components/site-detail/analytics-tab";
import { ErrorState } from "@/components/states";

export default function SiteAnalyticsPage() {
  const params = useParams();
  const siteId = params.id as string;
  const [range, setRange] = useState("7d");

  const analyticsQuery = trpc.siteDetail.analytics.useQuery({
    siteId,
    range: range as "today" | "yesterday" | "7d" | "30d" | "90d",
    granularity: "daily",
  });

  // A query error used to arrive as `data: null`, which the tab renders as
  // "No analytics data yet. Publish your site…" — actively misleading.
  if (analyticsQuery.isError) {
    return (
      <ErrorState
        title="Couldn't load analytics"
        description="Something went wrong on our end."
        onRetry={() => analyticsQuery.refetch()}
      />
    );
  }

  return (
    <AnalyticsTab
      data={analyticsQuery.data ?? null}
      range={range}
      onRangeChange={setRange}
      isLoading={analyticsQuery.isLoading}
    />
  );
}
