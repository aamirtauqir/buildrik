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
import { ACHIEVEMENT_AUTO_DISMISS_MS, type AchievementPromptState } from "./useOnboardingOrchestrator";
import { Button } from "flowbite-react";

export interface AchievementPromptProps extends AchievementPromptState {
  onDismiss: () => void;
}

export const AchievementPrompt: React.FC<AchievementPromptProps> = ({
  completedStep,
  nextStep,
  isLastStep,
  onDismiss,
}) => {
  // Visual countdown bar — runs 100→0% over ACHIEVEMENT_AUTO_DISMISS_MS,
  // synced to the orchestrator's auto-dismiss setTimeout. Single source of
  // truth lives in useOnboardingOrchestrator (audit Pattern D fix).
  const [progress, setProgress] = React.useState(100);

  React.useEffect(() => {
    const start = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - start;
      const remaining = Math.max(0, 100 - (elapsed / ACHIEVEMENT_AUTO_DISMISS_MS) * 100);
      setProgress(remaining);
      if (remaining === 0) clearInterval(interval);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  // Screen reader announcement on mount
  React.useEffect(() => {
    const el = document.getElementById("bd-achievement-live");
    if (!el) return;
    el.textContent = isLastStep
      ? "Congratulations! You have completed all getting started steps."
      : `Step complete: ${completedStep.label}. Next: ${nextStep?.label ?? ""}`;
  }, [completedStep, nextStep, isLastStep]);

  return (
    <>
      {/* Accessible live region — invisible, read by screen readers on mount */}
      <div
        id="bd-achievement-live"
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
          background: "var(--bk-alpha-ink-40)",
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
          background: "var(--bk-bg-card)",
          border: "1px solid var(--bk-border)",
          borderRadius: "var(--bk-radius-lg)",
          boxShadow: "var(--bk-shadow-overlay)",
          overflow: "hidden",
        }}
      >
        {/* Auto-dismiss countdown bar */}
        <div
          aria-hidden="true"
          style={{
            height: 3,
            background: isLastStep
              ? "var(--bk-success)"
              : "var(--bk-accent)",
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
                borderRadius: "var(--bk-radius-full)",
                // Was a tinted disc with a glyph on top — unreadable once the
                // chrome flipped to the light theme. Solid fill, white glyph.
                background: isLastStep
                  ? "var(--bk-success)"
                  : "var(--bk-accent)",
                color: "var(--bk-accent-on)",
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
                  color: "var(--bk-success)",
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
                  color: "var(--bk-ink)",
                }}
              >
                {isLastStep ? "You're all set!" : completedStep.label}
              </h3>
              {isLastStep && (
                <p
                  style={{
                    margin: "6px 0 0",
                    fontSize: 13,
                    color: "var(--bk-ink-soft)",
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
                // Dark-theme leftover: a 4%-white wash is invisible on the light
                // chrome, so the next-step block had no edge at all (board B9.2).
                background: "var(--bk-bg-app)",
                border: "1px solid var(--bk-border)",
                borderRadius: "var(--bk-radius-lg)",
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
                  color: "var(--bk-ink-muted)",
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
                    color: "var(--bk-ink-muted)",
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
                    color: "var(--bk-ink-soft)",
                    fontWeight: 500,
                  }}
                >
                  {nextStep.label}
                </p>
                <p
                  style={{
                    margin: "2px 0 0",
                    fontSize: 12,
                    color: "var(--bk-ink-muted)",
                    lineHeight: 1.4,
                  }}
                >
                  {nextStep.description}
                </p>
              </div>
            </div>
          )}

          {/* Primary action button */}
          <Button
            type="button"
            onClick={onDismiss}
            autoFocus
            style={{
              width: "100%",
              padding: "11px 20px",
              background: isLastStep
                ? "var(--bk-success)"
                : "var(--bk-accent)",
              border: "none",
              borderRadius: 10,
              color: "var(--bk-accent-on)",
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
              minHeight: 44,
            }}
          >
            {isLastStep ? "Done" : "Continue →"}
          </Button>
        </div>
      </div>
    </>
  );
};

export default AchievementPrompt;
