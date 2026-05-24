"use client";

import { useState } from "react";

export const CANCEL_REASONS = [
  { value: "TOO_EXPENSIVE", label: "Too expensive" },
  { value: "MISSING_FEATURES", label: "Missing features I need" },
  { value: "SWITCHING", label: "Switching to another service" },
  { value: "NOT_USING", label: "Not using it enough" },
  { value: "TEMPORARY", label: "Temporary, I'll be back" },
  { value: "OTHER", label: "Other" },
] as const;

type CancelReason = (typeof CANCEL_REASONS)[number]["value"];

interface CancelModalProps {
  periodEnd: Date;
  planFeatures?: string[];
  onConfirm: (reason: CancelReason, feedback?: string) => void;
  onClose: () => void;
  isLoading?: boolean;
}

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

export function CancelModal({ periodEnd, planFeatures = [], onConfirm, onClose, isLoading = false }: CancelModalProps) {
  const [reason, setReason] = useState<CancelReason | "">("");
  const [feedback, setFeedback] = useState("");

  function handleSubmit() {
    if (!reason) return;
    onConfirm(reason, feedback.trim() || undefined);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-5 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold" style={{ color: "#0D0D0D" }}>
              Cancel subscription
            </h2>
            <p className="mt-1 text-sm" style={{ color: "#7A7A7A" }}>
              We're sorry to see you go.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 transition-colors hover:bg-[#F3F4F6]"
            style={{ color: "#7A7A7A" }}
          >
            ✕
          </button>
        </div>

        <div className="mb-5 rounded-lg border border-[#FEE2E2] bg-[#FEF2F2] px-4 py-3 text-sm" style={{ color: "#B91C1C" }}>
          Your plan features will remain active until <strong>{formatDate(periodEnd)}</strong>. After that, your workspace will be downgraded to Free.
        </div>

        {planFeatures.length > 0 && (
          <div className="mb-5">
            <h3 className="mb-2 text-sm font-semibold" style={{ color: "#0D0D0D" }}>
              Features you'll lose
            </h3>
            <ul className="space-y-1.5">
              {planFeatures.map((feature) => (
                <li key={feature} className="flex items-center gap-2 text-sm" style={{ color: "#7A7A7A" }}>
                  <span style={{ color: "#EF4444" }}>✕</span>
                  {feature}
                </li>
              ))}
            </ul>
          </div>
        )}

        <fieldset className="mb-4">
          <legend className="mb-2 text-sm font-semibold" style={{ color: "#0D0D0D" }}>
            Why are you cancelling?
          </legend>
          <div className="space-y-2">
            {CANCEL_REASONS.map((r) => (
              <label key={r.value} className="flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-[#FAFAFA]" style={{ borderColor: reason === r.value ? "var(--color-primary)" : "#E8E8E8" }}>
                <input
                  type="radio"
                  name="cancel-reason"
                  value={r.value}
                  checked={reason === r.value}
                  onChange={() => setReason(r.value)}
                  className="accent-[var(--color-primary)]"
                />
                <span className="text-sm" style={{ color: "#0D0D0D" }}>
                  {r.label}
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <div className="mb-5">
          <label className="mb-1.5 block text-sm font-medium" style={{ color: "#0D0D0D" }}>
            Additional feedback{" "}
            <span className="font-normal" style={{ color: "#B0B0B0" }}>
              (optional)
            </span>
          </label>
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value.slice(0, 500))}
            maxLength={500}
            rows={3}
            placeholder="Tell us more..."
            className="w-full resize-none rounded-lg border px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
            style={{ borderColor: "#E8E8E8", color: "#0D0D0D" }}
          />
          <div className="mt-1 text-right text-xs" style={{ color: "#B0B0B0" }}>
            {feedback.length}/500
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-lg border py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: "var(--color-primary)", borderColor: "var(--color-primary)" }}
          >
            Keep My Plan
          </button>
          <button
            onClick={handleSubmit}
            disabled={!reason || isLoading}
            className="flex-1 rounded-lg border py-2.5 text-sm font-semibold transition-colors hover:bg-[#FEF2F2] disabled:opacity-40"
            style={{ borderColor: "#EF4444", color: "#EF4444" }}
          >
            {isLoading ? "Cancelling..." : "Cancel Plan"}
          </button>
        </div>
      </div>
    </div>
  );
}
