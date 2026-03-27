"use client";

import { useState, useEffect } from "react";
import { CheckCircle2, Loader2, Circle, XCircle, RotateCcw } from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { usePublishSSE } from "@/lib/hooks/use-publish-sse";

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
}

export function PublishProgress({ jobId, onComplete, onCancel }: PublishProgressProps) {
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

  function handleRetry() {
    pollStatus.refetch();
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      {/* Error state */}
      {isFailed && (
        <div className="rounded-xl border p-4" style={{ borderColor: "#FCA5A5", backgroundColor: "#FEF2F2" }}>
          <div className="flex items-start gap-3">
            <XCircle className="mt-0.5 h-5 w-5 shrink-0" style={{ color: "#E42313" }} />
            <div className="flex-1">
              <p className="text-sm font-semibold" style={{ color: "#0D0D0D" }}>Publish failed</p>
              <p className="mt-1 text-sm" style={{ color: "#7A7A7A" }}>
                {job?.error ?? "An unexpected error occurred during publishing."}
              </p>
              <button
                onClick={handleRetry}
                className="mt-3 flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium text-white"
                style={{ backgroundColor: "#E42313" }}
              >
                <RotateCcw className="h-4 w-4" />
                Retry
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Progress bar */}
      {!isFailed && (
        <div>
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold" style={{ color: "#0D0D0D" }}>Publishing...</p>
            <p className="text-sm font-medium" style={{ color: "#7A7A7A" }}>{progress}%</p>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full" style={{ backgroundColor: "#F4F4F4" }}>
            <div
              className="h-2 rounded-full transition-all duration-500"
              style={{ width: `${progress}%`, backgroundColor: "#E42313" }}
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
                    <CheckCircle2 className="h-5 w-5 shrink-0" style={{ color: "#22C55E" }} />
                  ) : isActive ? (
                    <Loader2 className="h-5 w-5 shrink-0 animate-spin" style={{ color: "#E42313" }} />
                  ) : isFail ? (
                    <XCircle className="h-5 w-5 shrink-0" style={{ color: "#E42313" }} />
                  ) : (
                    <Circle className="h-5 w-5 shrink-0" style={{ color: "#D4D4D4" }} />
                  )}
                  <span
                    className="text-sm font-medium"
                    style={{ color: isDone ? "#22C55E" : isActive ? "#0D0D0D" : isFail ? "#E42313" : "#B0B0B0" }}
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
                    <CheckCircle2 className="h-5 w-5 shrink-0" style={{ color: "#22C55E" }} />
                  ) : isCurrent ? (
                    <Loader2 className="h-5 w-5 shrink-0 animate-spin" style={{ color: "#E42313" }} />
                  ) : (
                    <Circle className="h-5 w-5 shrink-0" style={{ color: "#D4D4D4" }} />
                  )}
                  <span
                    className="text-sm font-medium"
                    style={{ color: isStepCompleted ? "#22C55E" : isCurrent ? "#0D0D0D" : "#B0B0B0" }}
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
            <div className="flex items-center gap-3 rounded-xl border p-3" style={{ borderColor: "#E8E8E8" }}>
              <p className="text-sm" style={{ color: "#7A7A7A" }}>Cancel this publish?</p>
              <button
                onClick={handleCancelPublish}
                disabled={cancelMutation.isPending}
                className="rounded-lg px-3 py-1 text-sm font-medium text-white"
                style={{ backgroundColor: "#E42313" }}
              >
                {cancelMutation.isPending ? "Cancelling..." : "Yes, cancel"}
              </button>
              <button
                onClick={() => setShowConfirm(false)}
                className="rounded-lg px-3 py-1 text-sm font-medium"
                style={{ color: "#7A7A7A", backgroundColor: "#F4F4F4" }}
              >
                No
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowConfirm(true)}
              className="text-sm font-medium"
              style={{ color: "#7A7A7A" }}
            >
              Cancel publish
            </button>
          )}
        </>
      )}
    </div>
  );
}
