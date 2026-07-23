"use client";

import { MessageSquare } from "lucide-react";
import { trpc } from "@lib/trpc/client";
import { SectionCard, MetricValue } from "@/components/dashboard/primitives";
import { StateEmpty, LoadingSkeleton, ErrorState, DeniedState } from "@/components/states";

function timeAgo(d: Date | string): string {
  const diff = Date.now() - new Date(d).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p.charAt(0).toUpperCase()).join("") || "?";
}

export function CommentQueue() {
  // Read-only feed of the most recent open client comments (newest first,
  // server-ordered). Admin-gated server-side; FORBIDDEN means this member can't see them.
  // Cursor-paginated (bounded pages) so a busy workspace never scans every comment.
  const commentsQuery = trpc.comments.workspaceList.useInfiniteQuery(
    { status: "OPEN" },
    { retry: false, getNextPageParam: (last) => last.nextCursor ?? undefined },
  );

  const comments = commentsQuery.data?.pages.flatMap((p) => p.items) ?? [];
  const forbidden = commentsQuery.error?.data?.code === "FORBIDDEN";

  return (
    <SectionCard title="Latest comments">
      {commentsQuery.isLoading ? (
        <LoadingSkeleton rows={3} variant="list" />
      ) : forbidden ? (
        <DeniedState
          title="Only admins can see client comments"
          description="Ask a workspace admin to review the change-requests clients have left."
          action={{ label: "Back to projects", href: "/dashboard/projects" }}
        />
      ) : commentsQuery.isError ? (
        <ErrorState
          title="Couldn't load comments"
          description="Something went wrong on our end."
          onRetry={() => commentsQuery.refetch()}
        />
      ) : comments.length === 0 ? (
        <StateEmpty
          icon={<MessageSquare className="h-7 w-7" />}
          title="No open comments"
          description="When a client pins a change-request on a site preview, it shows up here."
        />
      ) : (
        <div>
          {comments.map((c) => (
            <div
              key={c.id}
              className="flex gap-3 border-b py-3.5 first:pt-0 last:border-b-0 last:pb-0"
              style={{ borderColor: "var(--color-border-default)" }}
            >
              <div
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-pill text-eyebrow"
                style={{ backgroundColor: "var(--color-bg-subtle)", color: "var(--color-text-secondary)" }}
              >
                {initials(c.siteName)}
              </div>
              <div className="min-w-0">
                <p className="text-body" style={{ color: "var(--color-text-primary)" }}>
                  {c.body}
                </p>
                <p className="mt-1 text-eyebrow" style={{ color: "var(--color-text-muted)" }}>
                  <MetricValue>
                    {c.siteName} · {timeAgo(c.createdAt)}
                  </MetricValue>
                </p>
              </div>
            </div>
          ))}
          {commentsQuery.hasNextPage && (
            <button
              onClick={() => commentsQuery.fetchNextPage()}
              disabled={commentsQuery.isFetchingNextPage}
              className="mt-3 w-full rounded-md border py-2 text-body-sm font-medium disabled:opacity-50"
              style={{ borderColor: "var(--color-border-default)", color: "var(--color-text-secondary)" }}
            >
              {commentsQuery.isFetchingNextPage ? "Loading…" : "Load more"}
            </button>
          )}
        </div>
      )}
    </SectionCard>
  );
}
