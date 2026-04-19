/**
 * AchievementPrompt — Game-like step completion overlay
 *
 * Shown when a checklist step is completed via a composer event.
 * Dims the background, shows the completed step + next step preview.
 * Auto-dismisses after 4 seconds (orchestrator handles the timer).
 * Manual dismiss via button or overlay click.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { AchievementPromptState } from "./useOnboardingOrchestrator";

export interface AchievementPromptProps extends AchievementPromptState {
  onDismiss: () => void;
}

export const AchievementPrompt: React.FC<AchievementPromptProps> = ({
  completedStep,
  nextStep,
  isLastStep,
  onDismiss,
}) => {
  // Visual countdown bar — runs 0→100% over 4s, matching the orchestrator timer
  const [progress, setProgress] = React.useState(100);

  React.useEffect(() => {
    const start = Date.now();
    const duration = 4000;
    const interval = setInterval(() => {
      const elapsed = Date.now() - start;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remaining);
      if (remaining === 0) clearInterval(interval);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  // Screen reader announcement on mount
  React.useEffect(() => {
    const el = document.getElementById("buildrick-achievement-live");
    if (!el) return;
    el.textContent = isLastStep
      ? "Congratulations! You have completed all getting started steps."
      : `Step complete: ${completedStep.label}. Next: ${nextStep?.label ?? ""}`;
  }, [completedStep, nextStep, isLastStep]);

  return (
    <>
      {/* Accessible live region — invisible, read by screen readers on mount */}
      <div
        id="buildrick-achievement-live"
        role="status"
        aria-live="polite"
        aria-atomic="true"
        style={{
          position: "absolute",
          width: 1,
          height: 1,
          overflow: "hidden",
          opacity: 0,
          pointerEvents: "none",
        }}
      />

      {/* Dim overlay — click to dismiss */}
      <div
        onClick={onDismiss}
        aria-hidden="true"
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.55)",
          zIndex: 10000,
          cursor: "pointer",
        }}
      />

      {/* Achievement card */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="achievement-title"
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          zIndex: 10001,
          width: 380,
          maxWidth: "calc(100vw - 48px)",
          background: "var(--buildrick-bg-panel, #1c1e24)",
          border: "1px solid var(--buildrick-border, rgba(255,255,255,0.1))",
          borderRadius: 16,
          boxShadow: "0 24px 64px rgba(0,0,0,0.6)",
          overflow: "hidden",
        }}
      >
        {/* Auto-dismiss countdown bar */}
        <div
          aria-hidden="true"
          style={{
            height: 3,
            background: isLastStep
              ? "var(--buildrick-success, #10b981)"
              : "var(--buildrick-accent, #3b82f6)",
            width: `${progress}%`,
            transition: "width 50ms linear",
          }}
        />

        <div style={{ padding: "24px 24px 20px" }}>
          {/* Completed step header */}
          <div
            style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 20 }}
          >
            <div
              aria-hidden="true"
              style={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                background: isLastStep
                  ? "rgba(16,185,129,0.15)"
                  : "rgba(59,130,246,0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                fontSize: 20,
              }}
            >
              {isLastStep ? "🎉" : "✓"}
            </div>

            <div>
              <p
                style={{
                  margin: "0 0 4px",
                  fontSize: 11,
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: 0.8,
                  color: "var(--buildrick-success, #10b981)",
                }}
              >
                {isLastStep ? "All done!" : "Step complete"}
              </p>
              <h3
                id="achievement-title"
                style={{
                  margin: 0,
                  fontSize: 16,
                  fontWeight: 700,
                  color: "var(--buildrick-text-primary, #fff)",
                }}
              >
                {isLastStep ? "You're all set!" : completedStep.label}
              </h3>
              {isLastStep && (
                <p
                  style={{
                    margin: "6px 0 0",
                    fontSize: 13,
                    color: "var(--buildrick-text-secondary, rgba(255,255,255,0.6))",
                    lineHeight: 1.5,
                  }}
                >
                  You've completed all the getting started steps. Go build something great.
                </p>
              )}
            </div>
          </div>

          {/* Next step preview — only shown when not the last step */}
          {!isLastStep && nextStep && (
            <div
              style={{
                padding: "12px 14px",
                background: "rgba(255,255,255,0.04)",
                borderRadius: 10,
                marginBottom: 20,
                display: "flex",
                alignItems: "flex-start",
                gap: 10,
              }}
            >
              <span
                aria-hidden="true"
                style={{
                  fontSize: 16,
                  color: "var(--buildrick-text-tertiary, rgba(255,255,255,0.4))",
                  flexShrink: 0,
                  marginTop: 2,
                }}
              >
                →
              </span>
              <div>
                <p
                  style={{
                    margin: "0 0 2px",
                    fontSize: 11,
                    color: "var(--buildrick-text-tertiary, rgba(255,255,255,0.4))",
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: 0.8,
                  }}
                >
                  Next up
                </p>
                <p
                  style={{
                    margin: 0,
                    fontSize: 13,
                    color: "var(--buildrick-text-secondary, rgba(255,255,255,0.7))",
                    fontWeight: 500,
                  }}
                >
                  {nextStep.label}
                </p>
                <p
                  style={{
                    margin: "2px 0 0",
                    fontSize: 12,
                    color: "var(--buildrick-text-tertiary, rgba(255,255,255,0.4))",
                    lineHeight: 1.4,
                  }}
                >
                  {nextStep.description}
                </p>
              </div>
            </div>
          )}

          {/* Primary action button */}
          <button
            type="button"
            onClick={onDismiss}
            autoFocus
            style={{
              width: "100%",
              padding: "11px 20px",
              background: isLastStep
                ? "var(--buildrick-success, #10b981)"
                : "var(--buildrick-accent, #3b82f6)",
              border: "none",
              borderRadius: 10,
              color: "#fff",
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
              minHeight: 44,
            }}
          >
            {isLastStep ? "Done" : "Continue →"}
          </button>
        </div>
      </div>
    </>
  );
};

export default AchievementPrompt;
