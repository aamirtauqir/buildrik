import { Button } from "@/editor/shared/vibcoder/Button";
/**
 * @lint-hex-policy: component-theme
 *   Intentional component-specific palette (error boundary / overlay / preview
 *   frame / warm neutral / onboarding theme). Chrome-hex lint rules do not apply.
 *
 * OnboardingChecklist — Single-layer "Get started" panel
 *
 * Replaces the old 3-component system (OnboardingModal + TourOverlay +
 * OnboardingProgress) with one cohesive, professional checklist widget.
 *
 * Position: fixed bottom-right, above the canvas toolbar.
 * Behaviour:
 *   - Collapsed: thin header pill showing progress
 *   - Expanded: full accordion checklist, one active step at a time
 *   - Each step: click to expand → description + optional CTA button
 *   - Completed steps: green check, muted, collapses automatically
 *   - Dismiss: inline "Are you sure?" confirmation (not permanent on first click)
 *   - Minimize: collapses to pill without confirming
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { Check, ChevronUp, ChevronDown, Minus, X, ArrowRight } from "lucide-react";
import { Stack } from "@/editor/shared/vibcoder/Stack";
import type { OnboardingStep } from "../../shared/constants/onboardingSteps";

// ── Props ───────────────────────────────────────────────────────────────────

export interface OnboardingChecklistProps {
  steps: OnboardingStep[];
  completedCount: number;
  totalCount: number;
  /** Which step id is currently expanded */
  activeStepId: string | null;
  onSetActiveStepId: (id: string | null) => void;
  /** Called when user clicks a step's CTA button */
  onAction: (actionKey: string) => void;
  /** Permanently close (with confirmation) */
  onDismiss: () => void;
  /** Collapse to pill */
  onMinimize: () => void;
  isMinimized: boolean;
  onRestore: () => void;
}

// ── Component ───────────────────────────────────────────────────────────────

export const OnboardingChecklist: React.FC<OnboardingChecklistProps> = ({
  steps,
  completedCount,
  totalCount,
  activeStepId,
  onSetActiveStepId,
  onAction,
  onDismiss,
  onMinimize,
  isMinimized,
  onRestore,
}) => {
  const [confirmingDismiss, setConfirmingDismiss] = React.useState(false);
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
  const allDone = completedCount === totalCount;

  // Auto-cancel dismiss confirmation if user clicks elsewhere
  const containerRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    if (!confirmingDismiss) return;
    const handler = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) {
        setConfirmingDismiss(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [confirmingDismiss]);

  // ── Minimized pill ──────────────────────────────────────────────────────
  if (isMinimized) {
    return (
      <div style={pillStyles} onClick={onRestore} role="button" tabIndex={0}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") onRestore(); }}
        aria-label={`Get started — ${completedCount} of ${totalCount} complete. Click to expand.`}
      >
        <span style={pillDotStyles(allDone)} />
        <span style={pillTextStyles}>
          {allDone ? "All done!" : `${completedCount} / ${totalCount} done`}
        </span>
        <ChevronUp size={12} style={{ color: "rgba(255,255,255,0.4)", flexShrink: 0 }} />
      </div>
    );
  }

  // ── Full panel ──────────────────────────────────────────────────────────
  return (
    <div ref={containerRef} style={panelStyles} role="region" aria-label="Getting started checklist">
      {/* Header */}
      <div style={headerStyles}>
        <Stack style={{ gap: 2, flex: 1, minWidth: 0 }}>
          <span style={headerTitleStyles}>
            {allDone ? "All done — keep building!" : "Get started"}
          </span>
          <span style={headerCountStyles}>
            {completedCount} of {totalCount} complete
          </span>
        </Stack>

        <div style={headerActionsStyles}>
          {/* Minimize */}
          <Button
            type="button"
            style={iconBtnStyles}
            onClick={onMinimize}
            aria-label="Minimize checklist"
            title="Minimize"
          >
            <Minus size={13} />
          </Button>

          {/* Close / Confirm */}
          {confirmingDismiss ? (
            <div style={confirmRowStyles}>
              <span style={confirmTextStyles}>Hide this?</span>
              <Button type="button" style={confirmYesStyles} onClick={onDismiss}>
                Yes
              </Button>
              <Button type="button" style={confirmNoStyles} onClick={() => setConfirmingDismiss(false)}>
                No
              </Button>
            </div>
          ) : (
            <Button
              type="button"
              style={iconBtnStyles}
              onClick={() => setConfirmingDismiss(true)}
              aria-label="Close checklist"
              title="Close"
            >
              <X size={13} />
            </Button>
          )}
        </div>
      </div>
      {/* Progress bar */}
      <div style={progressTrackStyles}>
        <div
          style={{
            ...progressFillStyles,
            width: `${progress}%`,
            background: allDone ? "var(--buildrick-success)" : "var(--bd-accent)",
          }}
        />
      </div>
      {/* Steps */}
      <ul style={listStyles} aria-label="Onboarding steps">
        {steps.map((step) => {
          const isActive = activeStepId === step.id;
          const isCompleted = step.completed;

          return (
            <li
              key={step.id}
              style={{
                ...stepItemStyles,
                opacity: isCompleted ? 0.55 : 1,
                background: isActive && !isCompleted ? "rgba(45, 109, 255, 0.07)" : "transparent",
                borderLeft: isActive && !isCompleted
                  ? "2px solid var(--bd-accent)"
                  : "2px solid transparent",
              }}
            >
              {/* Step header row */}
              <Button
                type="button"
                style={stepRowStyles}
                onClick={() => onSetActiveStepId(isActive ? null : step.id)}
                aria-expanded={isActive}
              >
                {/* Circle indicator */}
                <span
                  style={{
                    ...circleStyles,
                    background: isCompleted ? "var(--buildrick-success)" : isActive ? "var(--bd-accent)" : "transparent",
                    borderColor: isCompleted ? "var(--buildrick-success)" : isActive ? "var(--bd-accent)" : "rgba(255,255,255,0.2)",
                  }}
                  aria-hidden="true"
                >
                  {isCompleted && <Check size={10} strokeWidth={3} color="#fff" />}
                </span>

                {/* Label */}
                <span
                  style={{
                    ...stepLabelStyles,
                    color: isCompleted ? "rgba(255,255,255,0.45)" : isActive ? "var(--bd-bg-panel)" : "rgba(255,255,255,0.8)",
                    textDecoration: isCompleted ? "line-through" : "none",
                  }}
                >
                  {step.label}
                </span>

                {/* Chevron */}
                {!isCompleted && (
                  <span style={{ color: "rgba(255,255,255,0.3)", flexShrink: 0, marginLeft: "auto" }}>
                    {isActive
                      ? <ChevronUp size={12} />
                      : <ChevronDown size={12} />
                    }
                  </span>
                )}
              </Button>
              {/* Expanded body */}
              {isActive && !isCompleted && (
                <div style={stepBodyStyles}>
                  <p style={stepDescStyles}>{step.description}</p>
                  {step.actionKey && step.actionLabel && (
                    <Button
                      type="button"
                      style={ctaBtnStyles}
                      onClick={() => onAction(step.actionKey!)}
                    >
                      {step.actionLabel}
                      <ArrowRight size={12} style={{ marginLeft: 6, flexShrink: 0 }} />
                    </Button>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>
      {/* All-done footer */}
      {allDone && (
        <div style={allDoneFooterStyles}>
          <p style={allDoneTextStyles}>
            You have completed all the getting started steps. Go build something great.
          </p>
          <Button type="button" style={dismissBtnStyles} onClick={onDismiss}>
            Close checklist
          </Button>
        </div>
      )}
    </div>
  );
};

// ── Styles ──────────────────────────────────────────────────────────────────

const panelStyles: React.CSSProperties = {
  position: "fixed",
  right: 24,
  bottom: 80,
  width: 320,
  maxHeight: 540,
  background: "#1a1d27",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 12,
  boxShadow: "0 8px 40px rgba(0,0,0,0.45), 0 1px 0 rgba(255,255,255,0.04) inset",
  zIndex: 1200,
  overflow: "hidden",
  display: "flex",
  flexDirection: "column",
  fontFamily: "var(--buildrick-font-family)",
};

const pillStyles: React.CSSProperties = {
  position: "fixed",
  right: 24,
  bottom: 80,
  display: "flex",
  alignItems: "center",
  gap: 8,
  padding: "8px 14px",
  background: "#1a1d27",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 999,
  boxShadow: "0 4px 20px rgba(0,0,0,0.35)",
  zIndex: 1200,
  cursor: "pointer",
  fontFamily: "var(--buildrick-font-family)",
  userSelect: "none",
};

const pillDotStyles = (done: boolean): React.CSSProperties => ({
  width: 8,
  height: 8,
  borderRadius: "50%",
  background: done ? "var(--buildrick-success)" : "var(--bd-accent)",
  flexShrink: 0,
});

const pillTextStyles: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 600,
  color: "rgba(255,255,255,0.8)",
  whiteSpace: "nowrap",
};

const headerStyles: React.CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  gap: 10,
  padding: "14px 14px 12px",
};

const headerTitleStyles: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 700,
  color: "var(--bd-bg-panel)",
  letterSpacing: -0.1,
};

const headerCountStyles: React.CSSProperties = {
  fontSize: 11,
  color: "rgba(255,255,255,0.45)",
  fontWeight: 500,
};

const headerActionsStyles: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 2,
  flexShrink: 0,
};

const iconBtnStyles: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: 26,
  height: 26,
  background: "none",
  border: "none",
  borderRadius: 6,
  color: "rgba(255,255,255,0.4)",
  cursor: "pointer",
  padding: 0,
  transition: "background 0.15s, color 0.15s",
};

const confirmRowStyles: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 6,
  paddingLeft: 4,
};

const confirmTextStyles: React.CSSProperties = {
  fontSize: 11,
  color: "rgba(255,255,255,0.55)",
  whiteSpace: "nowrap",
};

const confirmYesStyles: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  color: "#f87171",
  background: "rgba(248,113,113,0.1)",
  border: "none",
  borderRadius: 4,
  padding: "3px 8px",
  cursor: "pointer",
};

const confirmNoStyles: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 500,
  color: "rgba(255,255,255,0.5)",
  background: "none",
  border: "none",
  borderRadius: 4,
  padding: "3px 8px",
  cursor: "pointer",
};

const progressTrackStyles: React.CSSProperties = {
  height: 2,
  background: "rgba(255,255,255,0.06)",
  flexShrink: 0,
};

const progressFillStyles: React.CSSProperties = {
  height: "100%",
  borderRadius: 1,
  transition: "width 400ms ease, background 400ms ease",
};

const listStyles: React.CSSProperties = {
  listStyle: "none",
  margin: 0,
  padding: "6px 0",
  overflowY: "auto",
  flex: 1,
};

const stepItemStyles: React.CSSProperties = {
  transition: "background 0.15s, border-color 0.15s, opacity 0.2s",
  borderRadius: 0,
};

const stepRowStyles: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  width: "100%",
  padding: "9px 14px",
  background: "none",
  border: "none",
  cursor: "pointer",
  textAlign: "left",
  color: "inherit",
};

const circleStyles: React.CSSProperties = {
  width: 18,
  height: 18,
  borderRadius: "50%",
  border: "1.5px solid",
  flexShrink: 0,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  transition: "background 0.2s, border-color 0.2s",
};

const stepLabelStyles: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 500,
  flex: 1,
  minWidth: 0,
  transition: "color 0.15s",
  lineHeight: 1.35,
};

const stepBodyStyles: React.CSSProperties = {
  padding: "2px 14px 12px 42px",
  display: "flex",
  flexDirection: "column",
  gap: 10,
};

const stepDescStyles: React.CSSProperties = {
  margin: 0,
  fontSize: 12,
  lineHeight: 1.55,
  color: "rgba(255,255,255,0.5)",
};

const ctaBtnStyles: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  alignSelf: "flex-start",
  padding: "7px 12px",
  fontSize: 12,
  fontWeight: 600,
  color: "var(--buildrick-text-on-accent)",
  background: "var(--buildrick-accent)",
  border: "none",
  borderRadius: 7,
  cursor: "pointer",
  letterSpacing: -0.1,
  transition: "background 0.15s",
};

const allDoneFooterStyles: React.CSSProperties = {
  padding: "12px 16px 16px",
  borderTop: "1px solid rgba(255,255,255,0.06)",
  display: "flex",
  flexDirection: "column",
  gap: 10,
};

const allDoneTextStyles: React.CSSProperties = {
  margin: 0,
  fontSize: 12,
  color: "rgba(255,255,255,0.5)",
  lineHeight: 1.5,
};

const dismissBtnStyles: React.CSSProperties = {
  padding: "8px 14px",
  fontSize: 12,
  fontWeight: 600,
  color: "rgba(255,255,255,0.6)",
  background: "rgba(255,255,255,0.06)",
  border: "none",
  borderRadius: 7,
  cursor: "pointer",
  alignSelf: "flex-start",
};

export default OnboardingChecklist;
