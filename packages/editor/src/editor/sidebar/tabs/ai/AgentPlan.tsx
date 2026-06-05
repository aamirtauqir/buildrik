import * as React from "react";
import { Button } from "@/editor/shared/vibcoder/Button";
import { Checkbox } from "@/editor/shared/vibcoder/Checkbox";
import { DiffRows } from "./DiffRows";
import type { RunStep, RunPhase } from "./hooks/useAgentRunner";

/**
 * P4 agent run surface: the ordered plan with per-step status, and on the step
 * awaiting approval, the proposed diff + Approve / Skip / Stop controls. Reuses
 * DiffRows (the same diff surface as single-element edits).
 */
export interface AgentPlanProps {
  phase: RunPhase;
  steps: RunStep[];
  currentIndex: number;
  error: string | null;
  autoApply: boolean;
  onAutoApplyChange: (on: boolean) => void;
  onApprove: () => void;
  onSkip: () => void;
  onStop: () => void;
}

const STATUS_LABEL: Record<RunStep["status"], string> = {
  pending: "·",
  running: "…",
  awaiting: "review",
  applied: "✓ applied",
  skipped: "skipped",
  nochange: "no change",
  failed: "failed",
};

export const AgentPlan: React.FC<AgentPlanProps> = ({
  phase,
  steps,
  currentIndex,
  error,
  autoApply,
  onAutoApplyChange,
  onApprove,
  onSkip,
  onStop,
}) => {
  const autoApplyToggle = (
    <Checkbox
      className="bd-ai-agent-autoapply"
      checked={autoApply}
      onChange={(e) => onAutoApplyChange(e.target.checked)}
      label="Auto-apply steps (skip per-step approval)"
    />
  );
  if (phase === "idle") {
    return (
      <div className="bd-ai-agent-empty">
        {autoApplyToggle}
        Describe what to build. The agent will plan it, then walk each step
        {autoApply ? " and apply automatically" : " for your approval"}.
      </div>
    );
  }
  if (phase === "planning") {
    return <div className="bd-ai-agent-planning">Planning the steps…</div>;
  }
  return (
    <div className="bd-ai-agent">
      {phase === "running" && (
        <div className="bd-ai-agent-bar">
          <span className="bd-ai-agent-progress">
            Step {Math.min(currentIndex + 1, steps.length)} of {steps.length}
          </span>
          <Button type="button" variant="bare" aria-label="Stop run" onClick={onStop}>
            Stop
          </Button>
        </div>
      )}
      <ol className="bd-ai-agent-steps">
        {steps.map((s, i) => (
          <li
            key={`${i}-${s.plan.title}`}
            className={`bd-ai-agent-step bd-ai-agent-step-${s.status}${i === currentIndex ? " bd-ai-agent-step-current" : ""}`}
          >
            <div className="bd-ai-agent-step-head">
              <span className="bd-ai-agent-step-title">{s.plan.title}</span>
              <span className="bd-ai-agent-step-status">{STATUS_LABEL[s.status]}</span>
            </div>
            {s.status === "awaiting" && s.edit ? (
              <div className="bd-ai-agent-step-review">
                <DiffRows edit={{ ...s.edit, state: "pending" }} />
                <div className="bd-ai-agent-step-actions">
                  <Button type="button" variant="bare" aria-label="Skip step" onClick={onSkip}>
                    Skip
                  </Button>
                  <Button type="button" aria-label="Apply step" onClick={onApprove}>
                    Apply
                  </Button>
                </div>
              </div>
            ) : null}
          </li>
        ))}
      </ol>
      {error ? (
        <p className="bd-ai-agent-error" role="alert">
          {error}
        </p>
      ) : null}
      {phase === "done" && !error ? (
        <p className="bd-ai-agent-done">
          Run complete — {steps.filter((s) => s.status === "applied").length} applied
          {steps.some((s) => s.status === "skipped")
            ? `, ${steps.filter((s) => s.status === "skipped").length} skipped`
            : ""}
          .
        </p>
      ) : null}
    </div>
  );
};
