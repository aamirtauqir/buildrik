"use client";

import { trpc } from "@lib/trpc/client";
import { MediaLibrary } from "@/components/media/media-library";

export default function MediaPage() {
  const wsQuery = trpc.account.workspace.get.useQuery();
  const workspaceId = wsQuery.data?.id;
  if (!workspaceId) return <div className="h-64 animate-pulse rounded-xl bg-neutral-100" />;
  return <MediaLibrary workspaceId={workspaceId} />;
}
