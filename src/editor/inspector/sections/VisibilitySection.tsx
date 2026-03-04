/**
 * Visibility Section
 * Per-breakpoint visibility toggles for responsive hiding
 * @license BSD-3-Clause
 */

import * as React from "react";
import { Section } from "../shared/Controls";

// ============================================================================
// TYPES
// ============================================================================

interface VisibilitySectionProps {
  styles: Record<string, string>;
  onChange: (property: string, value: string) => void;
  /** Controlled open state for auto-expand functionality */
  isOpen?: boolean;
}

// ============================================================================
// BREAKPOINT CONFIGURATION
// ============================================================================

interface Breakpoint {
  id: string;
  label: string;
  icon: string;
  minWidth: number | null;
  maxWidth: number | null;
  cssClass: string;
}

const BREAKPOINTS: Breakpoint[] = [
  {
    id: "desktop",
    label: "Desktop",
    icon: "🖥️",
    minWidth: 1024,
    maxWidth: null,
    cssClass: "hide-desktop",
  },
  {
    id: "tablet",
    label: "Tablet",
    icon: "📱",
    minWidth: 768,
    maxWidth: 1023,
    cssClass: "hide-tablet",
  },
  {
    id: "mobile",
    label: "Mobile",
    icon: "📲",
    minWidth: null,
    maxWidth: 767,
    cssClass: "hide-mobile",
  },
];

// ============================================================================
// STYLES
// ============================================================================

const styles = {
  container: {
    display: "flex",
    flexDirection: "column" as const,
    gap: 8,
  },
  row: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "10px 12px",
    background: "rgba(255,255,255,0.03)",
    borderRadius: 8,
    border: "1px solid rgba(255,255,255,0.06)",
  },
  breakpointInfo: {
    display: "flex",
    alignItems: "center",
    gap: 10,
  },
  icon: {
    fontSize: 18,
    width: 28,
    textAlign: "center" as const,
  },
  labelContainer: {
    display: "flex",
    flexDirection: "column" as const,
    gap: 2,
  },
  label: {
    fontSize: 12,
    fontWeight: 500,
    color: "#e4e4e7",
  },
  range: {
    fontSize: 12,
    color: "#52525b",
  },
  toggle: (isVisible: boolean): React.CSSProperties => ({
    width: 44,
    height: 24,
    borderRadius: 12,
    background: isVisible ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)",
    border: `1px solid ${isVisible ? "rgba(34,197,94,0.5)" : "rgba(239,68,68,0.5)"}`,
    cursor: "pointer",
    position: "relative",
    transition: "all 0.2s",
  }),
  toggleKnob: (isVisible: boolean): React.CSSProperties => ({
    position: "absolute",
    top: 2,
    left: isVisible ? 22 : 2,
    width: 18,
    height: 18,
    borderRadius: 9,
    background: isVisible ? "#22c55e" : "#ef4444",
    transition: "all 0.2s",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 12,
  }),
  hint: {
    fontSize: 12,
    color: "#52525b",
    padding: "8px 0 0",
    borderTop: "1px solid rgba(255,255,255,0.06)",
    marginTop: 8,
  },
  hiddenIndicator: {
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
    padding: "2px 6px",
    background: "rgba(239,68,68,0.15)",
    borderRadius: 4,
    fontSize: 12,
    color: "#ef4444",
    marginTop: 8,
  },
};

// ============================================================================
// COMPONENT
// ============================================================================

export const VisibilitySection: React.FC<VisibilitySectionProps> = ({
  styles: elementStyles,
  onChange,
  isOpen,
}) => {
  // Parse visibility from custom CSS property or class names
  // Using data attributes for breakpoint visibility
  const getVisibility = (breakpointId: string): boolean => {
    const hideKey = `--hide-${breakpointId}`;
    return elementStyles[hideKey] !== "true";
  };

  const toggleVisibility = (breakpointId: string) => {
    const hideKey = `--hide-${breakpointId}`;
    const isCurrentlyVisible = getVisibility(breakpointId);

    if (isCurrentlyVisible) {
      // Hide on this breakpoint
      onChange(hideKey, "true");
    } else {
      // Show on this breakpoint (remove the hide property)
      onChange(hideKey, "");
    }
  };

  // Count hidden breakpoints
  const hiddenCount = BREAKPOINTS.filter((bp) => !getVisibility(bp.id)).length;

  return (
    <Section title="Visibility" icon="Eye" isOpen={isOpen} id="inspector-section-visibility">
      <div style={styles.container}>
        {BREAKPOINTS.map((bp) => {
          const isVisible = getVisibility(bp.id);
          const rangeText =
            bp.minWidth && bp.maxWidth
              ? `${bp.minWidth}px - ${bp.maxWidth}px`
              : bp.minWidth
                ? `≥ ${bp.minWidth}px`
                : `≤ ${bp.maxWidth}px`;

          return (
            <div key={bp.id} style={styles.row}>
              <div style={styles.breakpointInfo}>
                <span style={styles.icon}>{bp.icon}</span>
                <div style={styles.labelContainer}>
                  <span style={styles.label}>{bp.label}</span>
                  <span style={styles.range}>{rangeText}</span>
                </div>
              </div>

              <button
                style={styles.toggle(isVisible)}
                onClick={() => toggleVisibility(bp.id)}
                title={isVisible ? `Hide on ${bp.label}` : `Show on ${bp.label}`}
                aria-label={`${isVisible ? "Visible" : "Hidden"} on ${bp.label}`}
                aria-pressed={isVisible}
              >
                <span style={styles.toggleKnob(isVisible)}>{isVisible ? "👁" : "👁‍🗨"}</span>
              </button>
            </div>
          );
        })}

        {hiddenCount > 0 && (
          <div style={styles.hiddenIndicator}>
            👁‍🗨 Hidden on {hiddenCount} breakpoint{hiddenCount > 1 ? "s" : ""}
          </div>
        )}

        <div style={styles.hint}>
          Toggle visibility per device. Hidden elements appear dimmed in editor but invisible in
          preview/publish.
        </div>
      </div>
    </Section>
  );
};

export default VisibilitySection;
