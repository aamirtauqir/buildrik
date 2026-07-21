"use client";

import { trpc } from "@lib/trpc/client";
import { MediaLibrary } from "@/components/media/media-library";
import { ErrorState } from "@/components/states";

export default function MediaPage() {
  const wsQuery = trpc.account.workspace.get.useQuery();
  if (wsQuery.isLoading) return <div className="h-64 animate-pulse rounded-xl" style={{ backgroundColor: "var(--color-bg-subtle)" }} />;
  if (!wsQuery.data) return <ErrorState title="Couldn't load your media library" onRetry={() => wsQuery.refetch()} />;
  return <MediaLibrary workspaceId={wsQuery.data.id} />;
}
