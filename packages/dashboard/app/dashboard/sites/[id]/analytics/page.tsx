"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { trpc } from "@lib/trpc/client";
import { AnalyticsTab } from "@/components/site-detail/analytics-tab";

export default function SiteAnalyticsPage() {
  const params = useParams();
  const siteId = params.id as string;
  const [range, setRange] = useState("7d");

  const analyticsQuery = trpc.siteDetail.analytics.useQuery({
    siteId,
    range: range as "today" | "yesterday" | "7d" | "30d" | "90d",
    granularity: "daily",
  });

  return (
    <AnalyticsTab
      data={analyticsQuery.data ?? null}
      range={range}
      onRangeChange={setRange}
      isLoading={analyticsQuery.isLoading}
    />
  );
}
