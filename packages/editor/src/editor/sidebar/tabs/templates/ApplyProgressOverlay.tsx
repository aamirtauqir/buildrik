/**
 * ApplyProgressOverlay — Granular template apply progress
 * Shows 5-step checklist with animated progression during template application.
 * Phase 6 of Templates v2 spec.
 *
 * Steps advance automatically since the actual apply is synchronous.
 * The overlay provides a "loading ceremony" that builds user confidence.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { createPortal } from "react-dom";
import "./ApplyProgressOverlay.css";

// ============================================================================
// TYPES
// ============================================================================

export interface ApplyProgressOverlayProps {
  templateName: string;
  onComplete: () => void;
  onCancel?: () => void;
  onError?: (err: Error) => void;
}

type StepStatus = "todo" | "active" | "done";

interface ProgressStep {
  label: string;
  doneLabel?: string;
}

// ============================================================================
// CONFIG
// ============================================================================

const STEPS: ProgressStep[] = [
  { label: "Saving current version...", doneLabel: "Version saved" },
  { label: "Creating pages...", doneLabel: "Pages created" },
  { label: "Applying styles...", doneLabel: "Styles applied" },
  { label: "Loading assets...", doneLabel: "Assets loaded" },
  { label: "Rendering canvas...", doneLabel: "Canvas ready" },
];

const STEP_DELAY = 300; // ms per step
const COMPLETE_DELAY = 800; // ms to show "ready" state before firing onComplete

// ============================================================================
// COMPONENT
// ============================================================================

export const ApplyProgressOverlay: React.FC<ApplyProgressOverlayProps> = ({
  templateName,
  onComplete,
  onCancel,
  onError,
}) => {
  const [activeStep, setActiveStep] = React.useState(0);

  // Keep latest onComplete in a ref so the completion effect never needs to
  // re-run when the parent re-renders and passes a new function reference.
  // This prevents the completion timer from being canceled mid-flight.
  const onCompleteRef = React.useRef(onComplete);
  React.useLayoutEffect(() => {
    onCompleteRef.current = onComplete;
  });

  // Derived — never goes back to false, so the completion effect below fires
  // exactly once and its cleanup only runs on unmount (not on each re-render).
  const isComplete = activeStep >= STEPS.length;

  // Advance through steps one at a time
  React.useEffect(() => {
    if (activeStep >= STEPS.length) return;
    const timer = setTimeout(() => setActiveStep((prev) => prev + 1), STEP_DELAY);
    return () => clearTimeout(timer);
  }, [activeStep]);

  // Fire onComplete after a brief "done" display period.
  // Depends only on isComplete (transitions false→true exactly once),
  // so the timer is never canceled by a parent re-render.
  React.useEffect(() => {
    if (!isComplete) return;
    const timer = setTimeout(() => onCompleteRef.current(), COMPLETE_DELAY);
    return () => clearTimeout(timer);
  }, [isComplete]);

  // FIX-2: 15-second timeout — fire onError if apply takes too long
  React.useEffect(() => {
    if (!onError) return;
    const timer = setTimeout(() => onError(new Error("Apply timed out")), 15000);
    return () => clearTimeout(timer);
  }, [onError]);

  const getStatus = (index: number): StepStatus => {
    if (index < activeStep) return "done";
    if (index === activeStep) return "active";
    return "todo";
  };

  const progressPercent = Math.min(100, (activeStep / STEPS.length) * 100);

  return createPortal(
    <div className="tmpl-progress" role="status" aria-label="Applying template">
      <div className="tmpl-progress__inner">
        {/* Title */}
        <h3 className="tmpl-progress__title">
          {isComplete ? "Template ready!" : `Applying ${templateName}...`}
        </h3>

        {/* Progress bar */}
        <div className="tmpl-progress__bar">
          <div className="tmpl-progress__fill" style={{ width: `${progressPercent}%` }} />
        </div>

        {/* Steps */}
        <div className="tmpl-progress__steps">
          {STEPS.map((step, i) => {
            const status = getStatus(i);
            return (
              <div key={i} className={`tmpl-progress__step tmpl-progress__step--${status}`}>
                <div className={`tmpl-progress__icon tmpl-progress__icon--${status}`}>
                  {status === "done" && <span>&#10003;</span>}
                  {status === "active" && <span className="tmpl-progress__spinner" />}
                </div>
                <span className="tmpl-progress__label">
                  {status === "done" ? (step.doneLabel ?? step.label) : step.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* FIX-10: Cancel link — visible only during first 2 steps */}
        {activeStep < 2 && onCancel && (
          <button className="tmpl-progress__cancel" onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>
    </div>,
    document.body
  );
};

export default ApplyProgressOverlay;
