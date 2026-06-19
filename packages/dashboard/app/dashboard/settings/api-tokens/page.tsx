"use client";

import { trpc } from "@lib/trpc/client";
import { ApiTokensTab } from "@/components/settings/api-tokens-tab";

export default function ApiTokensPage() {
  const wsQuery = trpc.account.workspace.get.useQuery();
  const workspaceId = wsQuery.data?.id;

  if (!workspaceId) return <div className="h-64 animate-pulse rounded-xl bg-neutral-100" />;
  return <ApiTokensTab workspaceId={workspaceId} />;
}
