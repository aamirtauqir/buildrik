"use client";

import { useState } from "react";
import { CheckCircle2, Loader2, Circle } from "lucide-react";

export const PUBLISH_STEPS = [
  "Generating pages",
  "Optimizing images",
  "Deploying to CDN",
  "Verifying SSL",
  "Performance check",
] as const;

interface PublishProgressProps {
  progress: number;
  currentStep: number;
  onCancel: () => void;
}

export function PublishProgress({ progress, currentStep, onCancel }: PublishProgressProps) {
  const [showConfirm, setShowConfirm] = useState(false);

  return (
    <div className="mx-auto max-w-lg space-y-6">
      {/* Progress bar */}
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

      {/* Steps */}
      <div className="space-y-3">
        {PUBLISH_STEPS.map((step, i) => {
          const isCompleted = i < currentStep;
          const isCurrent = i === currentStep;
          return (
            <div key={step} className="flex items-center gap-3">
              {isCompleted ? (
                <CheckCircle2 className="h-5 w-5 shrink-0" style={{ color: "#22C55E" }} />
              ) : isCurrent ? (
                <Loader2 className="h-5 w-5 shrink-0 animate-spin" style={{ color: "#E42313" }} />
              ) : (
                <Circle className="h-5 w-5 shrink-0" style={{ color: "#D4D4D4" }} />
              )}
              <span
                className="text-sm font-medium"
                style={{ color: isCompleted ? "#22C55E" : isCurrent ? "#0D0D0D" : "#B0B0B0" }}
              >
                {step}
              </span>
            </div>
          );
        })}
      </div>

      {/* Cancel */}
      {showConfirm ? (
        <div className="flex items-center gap-3 rounded-xl border p-3" style={{ borderColor: "#E8E8E8" }}>
          <p className="text-sm" style={{ color: "#7A7A7A" }}>Cancel this publish?</p>
          <button
            onClick={onCancel}
            className="rounded-lg px-3 py-1 text-sm font-medium text-white"
            style={{ backgroundColor: "#E42313" }}
          >
            Yes, cancel
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
    </div>
  );
}
