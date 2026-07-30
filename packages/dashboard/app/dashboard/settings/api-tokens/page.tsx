"use client";

import { trpc } from "@lib/trpc/client";
import { ApiTokensTab } from "@/components/settings/api-tokens-tab";
import { ErrorState } from "@/components/states";

export default function ApiTokensPage() {
  const wsQuery = trpc.account.workspace.get.useQuery();
  const workspaceId = wsQuery.data?.id;

  // Only skeleton while genuinely loading. On error (workspace.get throws
  // NOT_FOUND with no active workspace) show a retry — the page used to spin
  // forever because workspaceId simply stayed undefined.
  if (wsQuery.isLoading) return <div className="h-64 animate-pulse rounded-lg bg-neutral-100" />;
  if (!workspaceId) {
    return (
      <ErrorState
        title="Couldn't load API tokens"
        description="Something went wrong on our end."
        onRetry={() => wsQuery.refetch()}
      />
    );
  }
  return <ApiTokensTab workspaceId={workspaceId} />;
}
