"use client";

import { useState } from "react";
import { Modal } from "@/components/dashboard/primitives";

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
    <Modal
      open={true}
      onClose={onClose}
      title="Cancel subscription"
      width={448}
      footer={
        <>
          <button
            onClick={onClose}
            className="flex-1 rounded-lg border py-2.5 text-body font-semibold text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: "var(--color-primary)", borderColor: "var(--color-primary)" }}
          >
            Keep My Plan
          </button>
          <button
            onClick={handleSubmit}
            disabled={!reason || isLoading}
            className="flex-1 rounded-lg border py-2.5 text-body font-semibold transition-colors hover:bg-[#FEF2F2] disabled:opacity-40"
            style={{ borderColor: "#EF4444", color: "#EF4444" }}
          >
            {isLoading ? "Cancelling..." : "Cancel Plan"}
          </button>
        </>
      }
    >
      <p className="text-body" style={{ color: "var(--color-text-secondary)" }}>
        We're sorry to see you go.
      </p>

      <div className="mt-4 rounded-lg border border-[#FEE2E2] bg-[#FEF2F2] px-4 py-3 text-body" style={{ color: "#B91C1C" }}>
        Your plan features will remain active until <strong>{formatDate(periodEnd)}</strong>. After that, your workspace will be downgraded to Free.
      </div>

      {planFeatures.length > 0 && (
        <div className="mt-5">
          <h3 className="mb-2 text-body font-semibold" style={{ color: "var(--color-text-primary)" }}>
            Features you'll lose
          </h3>
          <ul className="space-y-1.5">
            {planFeatures.map((feature) => (
              <li key={feature} className="flex items-center gap-2 text-body" style={{ color: "var(--color-text-secondary)" }}>
                <span style={{ color: "#EF4444" }}>✕</span>
                {feature}
              </li>
            ))}
          </ul>
        </div>
      )}

      <fieldset className="mt-5">
        <legend className="mb-2 text-body font-semibold" style={{ color: "var(--color-text-primary)" }}>
          Why are you cancelling?
        </legend>
        <div className="space-y-2">
          {CANCEL_REASONS.map((r) => (
            <label key={r.value} className="flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-[var(--color-bg-page)]" style={{ borderColor: reason === r.value ? "var(--color-primary)" : "var(--color-border-default)" }}>
              <input
                type="radio"
                name="cancel-reason"
                value={r.value}
                checked={reason === r.value}
                onChange={() => setReason(r.value)}
                className="accent-[var(--color-primary)]"
              />
              <span className="text-body" style={{ color: "var(--color-text-primary)" }}>
                {r.label}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="mt-5">
        <label className="mb-1.5 block text-body font-medium" style={{ color: "var(--color-text-primary)" }}>
          Additional feedback{" "}
          <span className="font-normal" style={{ color: "var(--color-text-muted)" }}>
            (optional)
          </span>
        </label>
        <textarea
          value={feedback}
          onChange={(e) => setFeedback(e.target.value.slice(0, 500))}
          maxLength={500}
          rows={3}
          placeholder="Tell us more..."
          className="w-full resize-none rounded-lg border px-3 py-2.5 text-body outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
          style={{ borderColor: "var(--color-border-default)", color: "var(--color-text-primary)" }}
        />
        <div className="mt-1 text-right text-body-sm" style={{ color: "var(--color-text-muted)" }}>
          {feedback.length}/500
        </div>
      </div>
    </Modal>
  );
}
