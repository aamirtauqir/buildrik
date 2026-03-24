"use client";
import { Loader2, CheckCircle, XCircle } from "lucide-react";

export const GENERATION_STEPS = [
  { key: "structure", label: "Generating page structure" },
  { key: "content", label: "Creating content" },
  { key: "styles", label: "Applying styles" },
  { key: "finalizing", label: "Finalizing site" },
] as const;

interface GenerationProgressProps {
  status: string;
  progress: number;
  steps: Array<{ step: string; status: string }> | null;
  error: string | null;
  onCancel: () => void;
  onRetry: () => void;
  onViewSite: (siteId: string) => void;
  siteId: string | null;
}

export function GenerationProgress({ status, progress, steps, error, onCancel, onRetry, onViewSite, siteId }: GenerationProgressProps) {
  const isFailed = status === "FAILED";
  const isComplete = status === "COMPLETED";
  return (
    <div className="mx-auto max-w-[500px] text-center">
      {/* Progress bar */}
      <div className="h-2 rounded-full" style={{ backgroundColor: "#F4F4F4" }}>
        <div className="h-2 rounded-full transition-all duration-500" style={{ width: `${progress}%`, backgroundColor: isFailed ? "#E42313" : "#22C55E" }} />
      </div>
      <p className="mt-2 text-sm font-medium" style={{ color: "#0D0D0D" }}>{progress}%</p>

      {/* Steps */}
      <div className="mt-8 space-y-3 text-left">
        {GENERATION_STEPS.map((step) => {
          const stepData = steps?.find((s) => s.step === step.key);
          const stepStatus = stepData?.status ?? "pending";
          return (
            <div key={step.key} className="flex items-center gap-3">
              {stepStatus === "completed" && <CheckCircle className="h-5 w-5 shrink-0" style={{ color: "#22C55E" }} />}
              {stepStatus === "in_progress" && <Loader2 className="h-5 w-5 shrink-0 animate-spin" style={{ color: "#E42313" }} />}
              {stepStatus === "pending" && <div className="h-5 w-5 shrink-0 rounded-full border-2" style={{ borderColor: "#E8E8E8" }} />}
              {stepStatus === "failed" && <XCircle className="h-5 w-5 shrink-0" style={{ color: "#E42313" }} />}
              <span className="text-sm" style={{ color: stepStatus === "pending" ? "#B0B0B0" : "#0D0D0D" }}>{step.label}</span>
            </div>
          );
        })}
      </div>

      {/* Error state */}
      {isFailed && error && (
        <div className="mt-6 rounded-lg p-4" style={{ backgroundColor: "#FEF2F2" }}>
          <p className="text-sm" style={{ color: "#991B1B" }}>{error}</p>
          <button onClick={onRetry} className="mt-2 rounded-lg px-4 py-1.5 text-sm font-medium text-white" style={{ backgroundColor: "#E42313" }}>Retry</button>
        </div>
      )}

      {/* Success state */}
      {isComplete && siteId && (
        <div className="mt-6">
          <p className="text-sm font-medium" style={{ color: "#22C55E" }}>Site generated successfully!</p>
          <button onClick={() => onViewSite(siteId)} className="mt-3 rounded-lg px-6 py-2 text-sm font-medium text-white" style={{ backgroundColor: "#E42313" }}>Open in Editor</button>
        </div>
      )}

      {/* Cancel */}
      {!isComplete && !isFailed && (
        <button onClick={onCancel} className="mt-6 text-sm font-medium" style={{ color: "#7A7A7A" }}>Cancel</button>
      )}
    </div>
  );
}
