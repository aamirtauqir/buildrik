"use client";

import { ClipboardCheck, Check, RotateCcw } from "lucide-react";
import { trpc } from "@lib/trpc/client";
import { useToast } from "@/components/dashboard/toast-provider";
import { SectionCard, Pill, type PillTone } from "@/components/dashboard/primitives";
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

const STATUS_META: Record<string, { label: string; tone: PillTone }> = {
  PENDING: { label: "Awaiting sign-off", tone: "warning" },
  CHANGES_REQUESTED: { label: "Changes requested", tone: "error" },
  APPROVED: { label: "Approved", tone: "success" },
};

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
    <SectionCard title="Review queue">
      {reviewsQuery.isLoading ? (
        <LoadingSkeleton rows={3} variant="list" />
      ) : forbidden ? (
        <DeniedState
          title="Only admins can review submissions"
          description="Ask a workspace admin to review the sites your editors have submitted."
          action={{ label: "Back to projects", href: "/dashboard/projects" }}
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
        <div>
          {reviews.map((r) => {
            const meta = STATUS_META[r.status] ?? STATUS_META.PENDING;
            return (
              <div
                key={r.id}
                className="flex items-start justify-between gap-4 border-b py-4 first:pt-0 last:border-b-0 last:pb-0"
                style={{ borderColor: "var(--color-border-default)" }}
              >
                <div className="flex min-w-0 gap-3">
                  <div
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-eyebrow"
                    style={{ backgroundColor: "var(--color-bg-subtle)", color: "var(--color-text-secondary)" }}
                  >
                    {initials(r.siteName)}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-body font-semibold" style={{ color: "var(--color-text-primary)" }}>
                      {r.siteName}
                    </p>
                    <p className="mt-0.5 text-body-sm" style={{ color: "var(--color-text-muted)" }}>
                      Submitted {timeAgo(r.createdAt)}
                      {r.changeSummary ? ` · ${r.changeSummary}` : ""}
                    </p>
                    {r.note && (
                      <p className="mt-1 text-body-sm" style={{ color: "var(--color-text-secondary)" }}>
                        {r.note}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-2">
                  <Pill tone={meta.tone}>{meta.label}</Pill>
                  <div className="flex gap-2">
                    <button
                      onClick={() => resolveMut.mutate({ id: r.id, status: "CHANGES_REQUESTED" })}
                      disabled={resolveMut.isPending}
                      className="flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-body-sm font-medium disabled:opacity-50"
                      style={{ borderColor: "var(--color-border-default)", color: "var(--color-text-secondary)" }}
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      Request changes
                    </button>
                    <button
                      onClick={() => resolveMut.mutate({ id: r.id, status: "APPROVED" })}
                      disabled={resolveMut.isPending}
                      className="flex items-center gap-1.5 rounded-md px-2.5 py-1 text-body-sm font-medium text-white disabled:opacity-50"
                      style={{ backgroundColor: "var(--color-primary)" }}
                    >
                      <Check className="h-3.5 w-3.5" />
                      Approve
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </SectionCard>
  );
}
