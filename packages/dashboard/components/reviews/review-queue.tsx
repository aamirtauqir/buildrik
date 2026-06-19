"use client";

import { ClipboardCheck, Check, RotateCcw, Globe } from "lucide-react";
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

export function ReviewQueue() {
  const { addToast } = useToast();
  // list is Admin-gated server-side; a FORBIDDEN means this member can't review.
  const reviewsQuery = trpc.reviews.list.useQuery({ status: "PENDING" }, { retry: false });

  const resolveMut = trpc.reviews.resolve.useMutation({
    onSuccess: (_d, vars) => {
      addToast("success", vars.status === "APPROVED" ? "Approved" : "Changes requested");
      reviewsQuery.refetch();
    },
    onError: (err) => addToast("error", "Couldn't resolve", err.message),
  });

  const reviews = reviewsQuery.data ?? [];
  const forbidden = reviewsQuery.error?.data?.code === "FORBIDDEN";

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-xl font-bold" style={{ color: "var(--color-text-primary)" }}>Reviews</h1>
        <p className="mt-1 text-sm" style={{ color: "var(--color-text-secondary)" }}>
          Sites your content editors have submitted for review.
        </p>
      </header>

      {reviewsQuery.isLoading ? (
        <LoadingSkeleton rows={3} variant="list" />
      ) : forbidden ? (
        <DeniedState
          title="Only admins can review submissions"
          description="Ask a workspace admin to review the sites your editors have submitted."
          action={{ label: "Back to sites", href: "/dashboard/sites" }}
        />
      ) : reviewsQuery.isError ? (
        <ErrorState
          title="Couldn't load the review queue"
          description="Something went wrong on our end."
          onRetry={() => reviewsQuery.refetch()}
        />
      ) : reviews.length === 0 ? (
        <StateEmpty
          icon={<ClipboardCheck className="h-7 w-7" />}
          title="No reviews waiting"
          description="When a content editor sends a site for review, it shows up here for you to approve."
        />
      ) : (
        <div className="space-y-2">
          {reviews.map((r) => (
            <div
              key={r.id}
              className="flex items-start justify-between gap-4 rounded-xl border bg-white p-4"
              style={{ borderColor: "var(--color-border-default)" }}
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 shrink-0" style={{ color: "var(--color-text-muted)" }} />
                  <span className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>{r.siteName}</span>
                  <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>{timeAgo(r.createdAt)}</span>
                </div>
                {r.changeSummary && (
                  <p className="mt-1.5 inline-flex items-center gap-1.5 rounded-md bg-[var(--color-bg-subtle)] px-2 py-1 text-xs font-medium" style={{ color: "var(--color-text-secondary)" }}>
                    <span className="text-[var(--color-primary)]">Changed:</span> {r.changeSummary}
                  </p>
                )}
                {r.note && (
                  <p className="mt-1.5 text-sm" style={{ color: "var(--color-text-secondary)" }}>{r.note}</p>
                )}
              </div>
              <div className="flex shrink-0 gap-2">
                <button
                  onClick={() => resolveMut.mutate({ id: r.id, status: "CHANGES_REQUESTED" })}
                  disabled={resolveMut.isPending}
                  className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium disabled:opacity-50"
                  style={{ borderColor: "var(--color-border-default)", color: "var(--color-text-secondary)" }}
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Request changes
                </button>
                <button
                  onClick={() => resolveMut.mutate({ id: r.id, status: "APPROVED" })}
                  disabled={resolveMut.isPending}
                  className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
                  style={{ backgroundColor: "var(--color-primary)" }}
                >
                  <Check className="h-3.5 w-3.5" />
                  Approve
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
