import { Button } from "@/editor/shared/vibcoder/Button";
/**
 * ApplyProgressOverlay — shows 4-step progress while template apply runs.
 *
 * P2 fix (codex A8): was a single spinner; now sequenced status flow
 * matching v3 prototype § 8: Importing → Resolving tokens → Rendering → Saving.
 * Each step ≈300ms. onComplete fires after final step.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { createPortal } from "react-dom";
import "./ApplyProgressOverlay.css";

export interface ApplyProgressOverlayProps {
  templateName: string;
  onComplete: () => void;
  onCancel?: () => void;
  onError?: (err: Error) => void;
}

interface Step {
  id: string;
  label: string;
}

const STEPS: Step[] = [
  { id: "import", label: "Importing template HTML" },
  { id: "tokens", label: "Resolving brand tokens" },
  { id: "render", label: "Rendering on canvas" },
  { id: "save", label: "Saving applied state" },
];

const STEP_DURATION = 300; // ms per step
const FINAL_HOLD = 200; // ms hold on completed state before onComplete

export const ApplyProgressOverlay: React.FC<ApplyProgressOverlayProps> = ({
  templateName,
  onComplete,
  onCancel,
  onError,
}) => {
  const [stepIndex, setStepIndex] = React.useState(0);
  const onCompleteRef = React.useRef(onComplete);
  React.useLayoutEffect(() => { onCompleteRef.current = onComplete; });

  React.useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    // Advance through each step.
    for (let i = 1; i <= STEPS.length; i++) {
      timers.push(
        setTimeout(() => setStepIndex(i), STEP_DURATION * i)
      );
    }
    // Fire complete after all steps + final hold.
    timers.push(
      setTimeout(
        () => onCompleteRef.current(),
        STEP_DURATION * STEPS.length + FINAL_HOLD
      )
    );
    return () => timers.forEach((t) => clearTimeout(t));
  }, []);

  React.useEffect(() => {
    if (!onError) return;
    const timer = setTimeout(() => onError(new Error("Apply timed out")), 15000);
    return () => clearTimeout(timer);
  }, [onError]);

  return createPortal(
    <div className="tmpl-progress" role="status" aria-label="Applying template" aria-live="polite">
      <div className="tmpl-progress__inner">
        <span className="tmpl-progress__spinner" style={{ width: 32, height: 32, borderWidth: 3 }} />
        <h3 className="tmpl-progress__title">Applying {templateName}…</h3>
        <ol
          style={{
            listStyle: "none",
            padding: 0,
            margin: "12px 0 0",
            display: "flex",
            flexDirection: "column",
            gap: 4,
            fontSize: 12,
            color: "var(--bk-ink-muted)",
            textAlign: "left",
            minWidth: 220,
          }}
        >
          {STEPS.map((s, i) => {
            const done = i < stepIndex;
            const active = i === stepIndex;
            return (
              <li
                key={s.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  color: done
                    ? "var(--bk-success)"
                    : active
                      ? "var(--bk-accent)"
                      : "var(--bk-ink-disabled)",
                  fontWeight: active ? 500 : 400,
                }}
              >
                <span style={{ width: 14, display: "inline-flex", justifyContent: "center" }}>
                  {done ? "✓" : active ? "→" : "○"}
                </span>
                {s.label}
              </li>
            );
          })}
        </ol>
        {onCancel && (
          <Button className="tmpl-progress__cancel" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </div>,
    document.body
  );
};

export default ApplyProgressOverlay;
