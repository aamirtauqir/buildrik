"use client";

import { useParams } from "next/navigation";
import { trpc } from "@lib/trpc/client";
import { CommentPreview } from "@/components/comments/comment-preview";
import { ErrorState } from "@/components/states";

export default function SiteFeedbackPage() {
  const params = useParams();
  const siteId = params.id as string;

  const settingsQuery = trpc.siteDetail.settings.get.useQuery({ siteId });

  if (settingsQuery.isLoading) {
    return <div className="h-96 animate-pulse rounded-xl" style={{ backgroundColor: "var(--color-bg-subtle)" }} />;
  }
  if (settingsQuery.isError) {
    return <ErrorState title="Couldn't load the preview" onRetry={() => settingsQuery.refetch()} />;
  }

  const site = settingsQuery.data as
    | { name?: string; publishedUrl?: string | null; thumbnail?: string | null }
    | undefined;

  return (
    <CommentPreview
      siteId={siteId}
      siteName={site?.name ?? "Site"}
      previewUrl={site?.publishedUrl ?? null}
      thumbnail={site?.thumbnail ?? null}
      canResolve
    />
  );
}
