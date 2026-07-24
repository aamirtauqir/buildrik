"use client";

import { trpc } from "@lib/trpc/client";
import { AICreditsTab } from "@/components/settings/ai-credits-tab";
import { ErrorState } from "@/components/states";

export default function AICreditsPage() {
  const creditsQuery = trpc.account.aiCredits.useQuery();

  if (creditsQuery.isLoading) return <div className="h-64 animate-pulse rounded-xl" style={{ backgroundColor: "var(--color-bg-subtle)" }} />;
  if (!creditsQuery.data) return <ErrorState title="Couldn't load AI credits" onRetry={() => creditsQuery.refetch()} />;

  return (
    <AICreditsTab
      used={creditsQuery.data.used}
      limit={creditsQuery.data.limit}
      history={creditsQuery.data.history}
      dailyPromptsUsed={creditsQuery.data.dailyPromptsUsed}
      dailyPromptsLimit={creditsQuery.data.dailyPromptsLimit}
    />
  );
}
