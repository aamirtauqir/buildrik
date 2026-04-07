"use client";

import { trpc } from "@lib/trpc/client";
import { AICreditsTab } from "@/components/settings/ai-credits-tab";

export default function AICreditsPage() {
  const creditsQuery = trpc.account.aiCredits.useQuery();

  if (creditsQuery.isLoading) return <div className="h-64 animate-pulse rounded-xl" style={{ backgroundColor: "#F4F4F4" }} />;
  if (!creditsQuery.data) return null;

  return (
    <AICreditsTab
      used={creditsQuery.data.used}
      limit={creditsQuery.data.limit}
      history={creditsQuery.data.history}
    />
  );
}
