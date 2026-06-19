"use client";

import { useState } from "react";
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
  const [tab, setTab] = useState<"OPEN" | "RESOLVED">("OPEN");
  const openQuery = trpc.comments.workspaceList.useQuery({ status: "OPEN" }, { retry: false });
  const resolvedQuery = trpc.comments.workspaceList.useQuery({ status: "RESOLVED" }, { retry: false });
  const commentsQuery = tab === "OPEN" ? openQuery : resolvedQuery;

  const refetchAll = () => { openQuery.refetch(); resolvedQuery.refetch(); };

  const resolveMut = trpc.comments.resolve.useMutation({
    onSuccess: () => { addToast("success", "Comment resolved"); refetchAll(); },
    onError: (err) => addToast("error", "Couldn't resolve", err.message),
  });

  const comments = commentsQuery.data ?? [];
  const openCount = openQuery.data?.length ?? 0;
  const resolvedCount = resolvedQuery.data?.length ?? 0;
  const forbidden = commentsQuery.error?.data?.code === "FORBIDDEN";

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-xl font-bold" style={{ color: "var(--color-text-primary)" }}>Comments</h1>
        <p className="mt-1 text-sm" style={{ color: "var(--color-text-secondary)" }}>
          Change-requests your clients pinned on their site previews.
        </p>
      </header>

      {!forbidden && (
        <div className="mb-4 flex gap-1 border-b" style={{ borderColor: "var(--color-border-default)" }}>
          {([
            { key: "OPEN" as const, label: "Open", count: openCount },
            { key: "RESOLVED" as const, label: "Done", count: resolvedCount },
          ]).map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors"
              style={{
                color: tab === t.key ? "var(--color-primary)" : "var(--color-text-secondary)",
                borderBottom: tab === t.key ? "2px solid var(--color-primary)" : "2px solid transparent",
              }}
            >
              {t.label}
              <span className="rounded-full px-1.5 py-0.5 text-xs" style={{ backgroundColor: "var(--color-bg-subtle)", color: "var(--color-text-secondary)" }}>{t.count}</span>
            </button>
          ))}
        </div>
      )}

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
          title={tab === "OPEN" ? "No open comments" : "Nothing resolved yet"}
          description={tab === "OPEN"
            ? "When a client pins a change-request on a site preview, it shows up here to resolve."
            : "Comments you resolve will be archived here."}
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
                <p className="mt-1.5 text-sm" style={{ color: "var(--color-text-secondary)", textDecoration: tab === "RESOLVED" ? "line-through" : "none" }}>{c.body}</p>
              </div>
              {tab === "OPEN" ? (
                <button
                  onClick={() => resolveMut.mutate({ id: c.id, siteId: c.siteId, status: "RESOLVED" })}
                  disabled={resolveMut.isPending}
                  className="flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
                  style={{ backgroundColor: "var(--color-primary)" }}
                >
                  <Check className="h-3.5 w-3.5" />
                  Resolve
                </button>
              ) : (
                <span className="flex shrink-0 items-center gap-1 text-xs font-medium" style={{ color: "var(--color-success)" }}>
                  <Check className="h-3.5 w-3.5" /> Done
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
