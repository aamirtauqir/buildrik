/**
 * OnboardingProgress - "Get Started" widget for new users
 * Shows progress through 9 onboarding steps with dismiss option
 *
 * Inspired by Webflow's "3 of 9 complete!" pattern
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { useOnboarding } from "../../shared/hooks/useOnboarding";

// ============================================================================
// TYPES
// ============================================================================

export interface OnboardingProgressProps {
  /** Custom class name */
  className?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const OnboardingProgress: React.FC<OnboardingProgressProps> = ({ className = "" }) => {
  const { steps, completedCount, totalCount, progress, dismiss, dismissed, isComplete } =
    useOnboarding();

  const [expanded, setExpanded] = React.useState(false);

  // Don't render if dismissed or all steps complete
  if (dismissed || isComplete) return null;

  const containerClass = `aqb-onboarding ${className}`.trim();

  return (
    <div className={containerClass} style={containerStyles}>
      {/* Header - always visible */}
      <div
        className="aqb-onboarding__header"
        onClick={() => setExpanded(!expanded)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setExpanded(!expanded);
          }
        }}
        style={headerStyles}
        role="button"
        tabIndex={0}
        aria-expanded={expanded}
        aria-controls="onboarding-steps"
      >
        <div style={summaryStyles}>
          <span style={titleStyles}>Get started</span>
          <span style={countStyles}>
            {completedCount} of {totalCount} complete!
          </span>
        </div>

        {/* Progress bar */}
        <div style={progressBarStyles}>
          <div
            style={{
              ...progressFillStyles,
              width: `${progress}%`,
            }}
          />
        </div>

        {/* Actions */}
        <div style={actionsStyles}>
          <span style={chevronStyles}>{expanded ? "▲" : "▼"}</span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              dismiss();
            }}
            style={dismissStyles}
            aria-label="Dismiss onboarding"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Steps list - collapsible */}
      {expanded && (
        <ul id="onboarding-steps" style={stepsListStyles}>
          {steps.map((step) => (
            <li
              key={step.id}
              style={{
                ...stepStyles,
                opacity: step.completed ? 0.6 : 1,
              }}
            >
              <span style={stepIconStyles}>{step.completed ? "✓" : "○"}</span>
              <div style={stepContentStyles}>
                <span
                  style={{
                    ...stepLabelStyles,
                    textDecoration: step.completed ? "line-through" : "none",
                  }}
                >
                  {step.label}
                </span>
                <span style={stepDescStyles}>{step.description}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

// ============================================================================
// STYLES
// ============================================================================

const containerStyles: React.CSSProperties = {
  position: "fixed",
  bottom: 24,
  left: "50%",
  transform: "translateX(-50%)",
  background: "var(--aqb-surface-elevated, #1c1e24)",
  border: "1px solid var(--aqb-border-default, rgba(255,255,255,0.1))",
  borderRadius: 12,
  boxShadow: "0 4px 24px rgba(0, 0, 0, 0.3)",
  width: 360,
  maxWidth: "calc(100vw - 48px)",
  zIndex: 1000,
  overflow: "hidden",
  fontFamily: "var(--aqb-font-sans, system-ui)",
};

const headerStyles: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  padding: "12px 16px",
  cursor: "pointer",
  background: "transparent",
  border: "none",
  width: "100%",
  textAlign: "left",
  color: "inherit",
};

const summaryStyles: React.CSSProperties = {
  flex: 1,
  display: "flex",
  flexDirection: "column",
  gap: 2,
};

const titleStyles: React.CSSProperties = {
  fontWeight: 600,
  fontSize: 14,
  color: "var(--aqb-text-primary, #fff)",
};

const countStyles: React.CSSProperties = {
  fontSize: 12,
  color: "var(--aqb-text-secondary, rgba(255,255,255,0.7))",
};

const progressBarStyles: React.CSSProperties = {
  width: 80,
  height: 6,
  background: "var(--aqb-surface-tertiary, rgba(255,255,255,0.1))",
  borderRadius: 3,
  overflow: "hidden",
};

const progressFillStyles: React.CSSProperties = {
  height: "100%",
  background: "var(--aqb-success, #10b981)",
  borderRadius: 3,
  transition: "width 300ms ease",
};

const actionsStyles: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
};

const chevronStyles: React.CSSProperties = {
  fontSize: 10,
  color: "var(--aqb-text-tertiary, rgba(255,255,255,0.5))",
};

const dismissStyles: React.CSSProperties = {
  background: "none",
  border: "none",
  padding: 4,
  cursor: "pointer",
  color: "var(--aqb-text-tertiary, rgba(255,255,255,0.5))",
  fontSize: 14,
  lineHeight: 1,
  borderRadius: 4,
};

const stepsListStyles: React.CSSProperties = {
  listStyle: "none",
  margin: 0,
  padding: "8px 16px 16px",
  borderTop: "1px solid var(--aqb-border-subtle, rgba(255,255,255,0.05))",
};

const stepStyles: React.CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  gap: 10,
  padding: "8px 0",
};

const stepIconStyles: React.CSSProperties = {
  flexShrink: 0,
  width: 16,
  height: 16,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 12,
  color: "var(--aqb-success, #10b981)",
  marginTop: 2,
};

const stepContentStyles: React.CSSProperties = {
  flex: 1,
  display: "flex",
  flexDirection: "column",
  gap: 2,
};

const stepLabelStyles: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 500,
  color: "var(--aqb-text-primary, #fff)",
};

const stepDescStyles: React.CSSProperties = {
  fontSize: 11,
  color: "var(--aqb-text-tertiary, rgba(255,255,255,0.5))",
  lineHeight: 1.4,
};

export default OnboardingProgress;
