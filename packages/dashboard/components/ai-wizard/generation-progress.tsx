"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Loader2, CheckCircle, XCircle } from "lucide-react";

export const GENERATION_STEPS = [
  { key: "QUEUED", label: "Queued" },
  { key: "GENERATING_STRUCTURE", label: "Generating page structure" },
  { key: "GENERATING_CONTENT", label: "Creating content" },
  { key: "GENERATING_STYLES", label: "Applying styles" },
  { key: "COMPLETED", label: "Finalizing site" },
] as const;

const editorUrl = process.env.NEXT_PUBLIC_EDITOR_URL || "http://localhost:5050";

type StepKey = (typeof GENERATION_STEPS)[number]["key"];

const STEP_ORDER: StepKey[] = ["QUEUED", "GENERATING_STRUCTURE", "GENERATING_CONTENT", "GENERATING_STYLES", "COMPLETED"];

function getStepStatus(stepKey: StepKey, currentStatus: string): "completed" | "in_progress" | "pending" | "failed" {
  const currentIdx = STEP_ORDER.indexOf(currentStatus as StepKey);
  const stepIdx = STEP_ORDER.indexOf(stepKey);
  if (currentStatus === "FAILED") {
    return stepIdx < currentIdx ? "completed" : stepIdx === currentIdx ? "failed" : "pending";
  }
  if (stepIdx < currentIdx) return "completed";
  if (stepIdx === currentIdx) return currentStatus === "COMPLETED" ? "completed" : "in_progress";
  return "pending";
}

interface GenerationProgressProps {
  status: string;
  progress: number;
  steps: Array<{ step: string; status: string }> | null;
  error: string | null;
  onCancel: () => void;
  onRetry: () => void;
  onViewSite: (siteId: string) => void;
  siteId: string | null;
  creditsExhausted?: boolean;
  onUpgrade?: () => void;
  onUseTemplate?: () => void;
  onStartBlank?: () => void;
}

export function GenerationProgress({
  status,
  progress,
  steps,
  error,
  onCancel,
  onRetry,
  onViewSite,
  siteId,
  creditsExhausted,
  onUpgrade,
  onUseTemplate,
  onStartBlank,
}: GenerationProgressProps) {
  const router = useRouter();
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showCreditsModal, setShowCreditsModal] = useState(false);
  const [failCount, setFailCount] = useState(0);

  const isFailed = status === "FAILED";
  const isComplete = status === "COMPLETED";
  const isInProgress = !isComplete && !isFailed;

  // Track failure count
  useEffect(() => {
    if (isFailed) {
      setFailCount((prev) => prev + 1);
    }
  }, [isFailed]);

  // Show credits modal when credits exhausted
  useEffect(() => {
    if (creditsExhausted) {
      setShowCreditsModal(true);
    }
  }, [creditsExhausted]);

  // Redirect to editor on completion
  useEffect(() => {
    if (isComplete && siteId) {
      const timeout = setTimeout(() => {
        window.location.href = `${editorUrl}/?siteId=${siteId}`;
      }, 1500);
      return () => clearTimeout(timeout);
    }
  }, [isComplete, siteId, router]);

  // Navigation guard: warn on page leave during generation
  const handleBeforeUnload = useCallback(
    (e: BeforeUnloadEvent) => {
      if (isInProgress) {
        e.preventDefault();
      }
    },
    [isInProgress]
  );

  useEffect(() => {
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [handleBeforeUnload]);

  const handleCancelClick = () => {
    setShowCancelModal(true);
  };

  const handleConfirmCancel = () => {
    setShowCancelModal(false);
    onCancel();
  };

  return (
    <div className="mx-auto max-w-[500px] text-center">
      {/* Progress bar */}
      <div className="h-2 rounded-full" style={{ backgroundColor: "#F4F4F4" }}>
        <div
          className="h-2 rounded-full transition-all duration-500"
          style={{ width: `${progress}%`, backgroundColor: isFailed ? "#E42313" : "#22C55E" }}
        />
      </div>
      <p className="mt-2 text-sm font-medium" style={{ color: "#0D0D0D" }}>
        {progress}%
      </p>

      {/* Steps */}
      <div className="mt-8 space-y-3 text-left">
        {GENERATION_STEPS.map((step) => {
          const stepStatus = steps
            ? (steps.find((s) => s.step === step.key)?.status as "completed" | "in_progress" | "pending" | "failed" | undefined) ?? "pending"
            : getStepStatus(step.key, status);
          return (
            <div key={step.key} className="flex items-center gap-3">
              {stepStatus === "completed" && (
                <CheckCircle className="h-5 w-5 shrink-0" style={{ color: "#22C55E" }} />
              )}
              {stepStatus === "in_progress" && (
                <Loader2 className="h-5 w-5 shrink-0 animate-spin" style={{ color: "#E42313" }} />
              )}
              {stepStatus === "pending" && (
                <div
                  className="h-5 w-5 shrink-0 rounded-full border-2"
                  style={{ borderColor: "#E8E8E8" }}
                />
              )}
              {stepStatus === "failed" && (
                <XCircle className="h-5 w-5 shrink-0" style={{ color: "#E42313" }} />
              )}
              <span
                className="text-sm"
                style={{ color: stepStatus === "pending" ? "#B0B0B0" : "#0D0D0D" }}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Error state */}
      {isFailed && error && (
        <div className="mt-6 rounded-lg p-4" style={{ backgroundColor: "#FEF2F2" }}>
          <p className="text-sm" style={{ color: "#991B1B" }}>
            {error}
          </p>
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            {failCount < 2 && (
              <button
                onClick={onRetry}
                className="rounded-lg px-4 py-1.5 text-sm font-medium text-white"
                style={{ backgroundColor: "#E42313" }}
              >
                Retry
              </button>
            )}
            {onUseTemplate && (
              <button
                onClick={onUseTemplate}
                className="rounded-lg border px-4 py-1.5 text-sm font-medium"
                style={{ borderColor: "#E8E8E8", color: "#0D0D0D" }}
              >
                Use Template Instead
              </button>
            )}
            {onStartBlank && (
              <button
                onClick={onStartBlank}
                className="rounded-lg px-4 py-1.5 text-sm font-medium"
                style={{ color: "#7A7A7A" }}
              >
                Start Blank
              </button>
            )}
          </div>
        </div>
      )}

      {/* Success state */}
      {isComplete && siteId && (
        <div className="mt-6">
          <p className="text-sm font-medium" style={{ color: "#22C55E" }}>
            Site generated successfully!
          </p>
          <button
            onClick={() => onViewSite(siteId)}
            className="mt-3 rounded-lg px-6 py-2 text-sm font-medium text-white"
            style={{ backgroundColor: "#E42313" }}
          >
            Open in Editor
          </button>
        </div>
      )}

      {/* Cancel button */}
      {isInProgress && (
        <button
          onClick={handleCancelClick}
          className="mt-6 text-sm font-medium"
          style={{ color: "#7A7A7A" }}
        >
          Cancel
        </button>
      )}

      {/* Cancel confirmation modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="mx-4 w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
            <h2 className="text-base font-semibold" style={{ color: "#0D0D0D" }}>
              Cancel generation?
            </h2>
            <p className="mt-2 text-sm" style={{ color: "#7A7A7A" }}>
              All progress will be lost.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setShowCancelModal(false)}
                className="rounded-lg border px-4 py-2 text-sm font-medium"
                style={{ borderColor: "#E8E8E8", color: "#0D0D0D" }}
              >
                Keep Generating
              </button>
              <button
                onClick={handleConfirmCancel}
                className="rounded-lg px-4 py-2 text-sm font-medium text-white"
                style={{ backgroundColor: "#E42313" }}
              >
                Cancel Generation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Credits exhausted modal */}
      {showCreditsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="mx-4 w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
            <h2 className="text-base font-semibold" style={{ color: "#0D0D0D" }}>
              AI credits used up
            </h2>
            <p className="mt-2 text-sm" style={{ color: "#7A7A7A" }}>
              Upgrade for more AI generations.
            </p>
            <div className="mt-5 flex flex-col gap-2">
              {onUpgrade && (
                <button
                  onClick={() => {
                    setShowCreditsModal(false);
                    onUpgrade();
                  }}
                  className="rounded-lg px-4 py-2 text-sm font-medium text-white"
                  style={{ backgroundColor: "#E42313" }}
                >
                  Upgrade Plan
                </button>
              )}
              {onUseTemplate && (
                <button
                  onClick={() => {
                    setShowCreditsModal(false);
                    onUseTemplate();
                  }}
                  className="rounded-lg border px-4 py-2 text-sm font-medium"
                  style={{ borderColor: "#E8E8E8", color: "#0D0D0D" }}
                >
                  Use a Template Instead
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
