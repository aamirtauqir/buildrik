"use client";

import { MessageSquare, Check, Globe } from "lucide-react";
import { trpc } from "@lib/trpc/client";
import { useToast } from "@/components/dashboard/toast-provider";
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

export function CommentQueue() {
  const { addToast } = useToast();
  const commentsQuery = trpc.comments.workspaceList.useQuery({ status: "OPEN" }, { retry: false });

  const resolveMut = trpc.comments.resolve.useMutation({
    onSuccess: () => {
      addToast("success", "Comment resolved");
      commentsQuery.refetch();
    },
    onError: (err) => addToast("error", "Couldn't resolve", err.message),
  });

  const comments = commentsQuery.data ?? [];
  const forbidden = commentsQuery.error?.data?.code === "FORBIDDEN";

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-xl font-bold" style={{ color: "var(--color-text-primary)" }}>Comments</h1>
        <p className="mt-1 text-sm" style={{ color: "var(--color-text-secondary)" }}>
          Change-requests your clients pinned on their site previews.
        </p>
      </header>

      {commentsQuery.isLoading ? (
        <LoadingSkeleton rows={3} variant="list" />
      ) : forbidden ? (
        <DeniedState
          title="Only admins can triage comments"
          description="Ask a workspace admin to review the change-requests clients have left."
          action={{ label: "Back to sites", href: "/dashboard/sites" }}
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
          description="When a client pins a change-request on a site preview, it shows up here to resolve."
        />
      ) : (
        <div className="space-y-2">
          {comments.map((c) => (
            <div
              key={c.id}
              className="flex items-start justify-between gap-4 rounded-xl border bg-white p-4"
              style={{ borderColor: "var(--color-border-default)" }}
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 shrink-0" style={{ color: "var(--color-text-muted)" }} />
                  <span className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>{c.siteName}</span>
                  <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>{timeAgo(c.createdAt)}</span>
                </div>
                <p className="mt-1.5 text-sm" style={{ color: "var(--color-text-secondary)" }}>{c.body}</p>
              </div>
              <button
                onClick={() => resolveMut.mutate({ id: c.id, siteId: c.siteId, status: "RESOLVED" })}
                disabled={resolveMut.isPending}
                className="flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
                style={{ backgroundColor: "var(--color-primary)" }}
              >
                <Check className="h-3.5 w-3.5" />
                Resolve
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
