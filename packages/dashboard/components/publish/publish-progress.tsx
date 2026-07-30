"use client";

import { useState, useEffect } from "react";
import { CheckCircle2, Loader2, Circle, XCircle, RotateCcw } from "lucide-react";
import { trpc } from "@lib/trpc/client";
import { usePublishSSE } from "@lib/hooks/use-publish-sse";
import { Button } from "@/components/dashboard/primitives";

export const PUBLISH_STEPS = [
  "Generating pages",
  "Optimizing images",
  "Deploying to CDN",
  "Verifying SSL",
  "Performance check",
] as const;

interface PublishProgressProps {
  jobId: string;
  onComplete: (job: { id: string; siteId: string; deploymentId: string | null }) => void;
  onCancel: () => void;
  /** Re-run the publish (mint a fresh job) after a failed terminal state. */
  onRetry: () => void;
}

export function PublishProgress({ jobId, onComplete, onCancel, onRetry }: PublishProgressProps) {
  const [showConfirm, setShowConfirm] = useState(false);

  const sseJob = usePublishSSE(jobId);
  // Fall back to tRPC polling if SSE hasn't delivered data yet
  const pollStatus = trpc.sites.publishStatus.useQuery(
    { jobId },
    { refetchInterval: sseJob ? false : 2000, enabled: !sseJob }
  );

  const cancelMutation = trpc.sites.cancelPublish.useMutation({
    onSuccess() {
      onCancel();
    },
  });

  const job = sseJob ?? pollStatus.data;
  const progress = job?.progress ?? 0;
  const isFailed = job?.status === "FAILED";
  const isCompleted = job?.status === "COMPLETED";

  useEffect(() => {
    if (isCompleted && job) {
      onComplete({ id: job.id, siteId: job.siteId, deploymentId: job.deploymentId });
    }
  }, [isCompleted, job, onComplete]);

  const steps = Array.isArray(job?.steps) ? (job.steps as Array<{ name: string; status: string }>) : null;

  function currentStepIndex(): number {
    return Math.min(Math.floor((progress / 100) * PUBLISH_STEPS.length), PUBLISH_STEPS.length - 1);
  }

  function handleCancelPublish() {
    cancelMutation.mutate({ jobId });
  }


  return (
    <div className="mx-auto max-w-lg space-y-6">
      {/* Error state */}
      {isFailed && (
        <div className="rounded-xl border p-4" style={{ borderColor: "#F8B4B4", backgroundColor: "#FDF2F2" }}>
          <div className="flex items-start gap-3">
            <XCircle className="mt-0.5 h-5 w-5 shrink-0" style={{ color: "var(--color-error)" }} />
            <div className="flex-1">
              <p className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>Publish failed</p>
              <p className="mt-1 text-sm" style={{ color: "var(--color-text-secondary)" }}>
                {job?.error ?? "An unexpected error occurred during publishing."}
              </p>
              <Button onClick={onRetry} className="mt-3">
                <RotateCcw className="h-4 w-4" />
                Retry
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Progress bar */}
      {!isFailed && (
        <div>
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>Publishing...</p>
            <p className="text-sm font-medium" style={{ color: "var(--color-text-secondary)" }}>{progress}%</p>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full" style={{ backgroundColor: "var(--color-bg-subtle)" }}>
            <div
              className="h-2 rounded-full transition-all duration-500"
              style={{ width: `${progress}%`, backgroundColor: "var(--color-primary)" }}
            />
          </div>
        </div>
      )}

      {/* Steps */}
      <div className="space-y-3">
        {steps
          ? steps.map((step) => {
              const isDone = step.status === "done";
              const isActive = step.status === "active";
              const isFail = step.status === "failed";
              return (
                <div key={step.name} className="flex items-center gap-3">
                  {isDone ? (
                    <CheckCircle2 className="h-5 w-5 shrink-0" style={{ color: "var(--color-success)" }} />
                  ) : isActive ? (
                    <Loader2 className="h-5 w-5 shrink-0 animate-spin" style={{ color: "var(--color-primary)" }} />
                  ) : isFail ? (
                    <XCircle className="h-5 w-5 shrink-0" style={{ color: "var(--color-error)" }} />
                  ) : (
                    <Circle className="h-5 w-5 shrink-0" style={{ color: "var(--color-border-strong)" }} />
                  )}
                  <span
                    className="text-sm font-medium"
                    style={{ color: isDone ? "var(--color-success)" : isActive ? "var(--color-text-primary)" : isFail ? "var(--color-error)" : "var(--color-text-muted)" }}
                  >
                    {step.name}
                  </span>
                </div>
              );
            })
          : PUBLISH_STEPS.map((step, i) => {
              const stepIdx = currentStepIndex();
              const isStepCompleted = i < stepIdx;
              const isCurrent = i === stepIdx;
              return (
                <div key={step} className="flex items-center gap-3">
                  {isStepCompleted ? (
                    <CheckCircle2 className="h-5 w-5 shrink-0" style={{ color: "var(--color-success)" }} />
                  ) : isCurrent ? (
                    <Loader2 className="h-5 w-5 shrink-0 animate-spin" style={{ color: "var(--color-primary)" }} />
                  ) : (
                    <Circle className="h-5 w-5 shrink-0" style={{ color: "var(--color-border-strong)" }} />
                  )}
                  <span
                    className="text-sm font-medium"
                    style={{ color: isStepCompleted ? "var(--color-success)" : isCurrent ? "var(--color-text-primary)" : "var(--color-text-muted)" }}
                  >
                    {step}
                  </span>
                </div>
              );
            })}
      </div>

      {/* Cancel */}
      {!isFailed && !isCompleted && (
        <>
          {showConfirm ? (
            <div className="flex items-center gap-3 rounded-xl border p-3" style={{ borderColor: "var(--color-border-default)" }}>
              <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>Cancel this publish?</p>
              <Button size="sm" onClick={handleCancelPublish} disabled={cancelMutation.isPending}>
                {cancelMutation.isPending ? "Cancelling..." : "Yes, cancel"}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setShowConfirm(false)}>
                No
              </Button>
            </div>
          ) : (
            <button
              onClick={() => setShowConfirm(true)}
              className="text-sm font-medium"
              style={{ color: "var(--color-text-secondary)" }}
            >
              Cancel publish
            </button>
          )}
        </>
      )}
    </div>
  );
}
