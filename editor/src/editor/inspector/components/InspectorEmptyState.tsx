import * as React from "react";
import type { Composer } from "../../../engine";
import { EVENTS } from "../../../shared/constants/events";
import { SvgPointer } from "../../../shared/ui/Icons";

/**
 * Empty state shown when no element is selected in the Inspector.
 * Emits Composer events to open Build panel, Templates, or Design panel.
 */

export interface InspectorEmptyStateProps {
  composer?: Composer | null;
}

export const InspectorEmptyState: React.FC<InspectorEmptyStateProps> = ({
  composer,
}) => {
  // Phase 7: Check if template was recently applied
  const [appliedName, setAppliedName] = React.useState<string | null>(null);

  React.useEffect(() => {
    const stored = localStorage.getItem("aqb-last-applied-template");
    if (stored) {
      try {
        const data = JSON.parse(stored) as { name: string; ts: number };
        // Show for 30 minutes
        if (Date.now() - data.ts < 30 * 60 * 1000) {
          setAppliedName(data.name);
        } else {
          localStorage.removeItem("aqb-last-applied-template");
        }
      } catch {
        localStorage.removeItem("aqb-last-applied-template");
      }
    }
  }, []);

  // Phase 7: Post-apply state
  if (appliedName) {
    return (
      <div role="status" aria-live="polite" style={containerStyle}>
        <div style={appliedBannerStyle}>
          <h3 style={{ ...titleStyle, color: "#4ade80", marginBottom: 4 }}>Template applied!</h3>
          <p style={{ ...descriptionStyle, color: "rgba(74, 222, 128, 0.7)", marginBottom: 12 }}>
            {appliedName}
          </p>
          {composer && (
            <button
              onClick={() => composer.emit(EVENTS.UI_OPEN_DESIGN_PANEL, {})}
              style={appliedActionStyle}
              aria-label="Set brand colors in Global Styles"
            >
              Set Brand Colors
            </button>
          )}
        </div>

        {/* Still show default tips below */}
        <div style={{ ...tipStyle, marginTop: 12 }}>
          <span style={{ opacity: 0.7 }}>Tip:</span> Click an element to edit its properties
        </div>
      </div>
    );
  }

  return (
    <div role="status" aria-live="polite" aria-label="No element selected" style={containerStyle}>
      {/* Icon */}
      <div style={iconCircleStyle} aria-hidden="true">
        <SvgPointer style={{ opacity: 0.5 }} />
      </div>

      {/* Title */}
      <h3 style={titleStyle}>Nothing Selected</h3>

      {/* Description */}
      <p style={descriptionStyle}>
        Click an element on the canvas or use the Layers panel to select and edit properties.
      </p>

      {/* CTA Buttons */}
      <div style={ctaContainerStyle}>
        {composer && (
          <>
            <button
              onClick={() => composer.emit(EVENTS.UI_OPEN_BUILD_PANEL, {})}
              style={primaryButtonStyle}
              aria-label="Open Build panel to add elements"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M12 5v14M5 12h14" />
              </svg>
              Open Build Panel
            </button>
            <button
              onClick={() => composer.emit(EVENTS.UI_BROWSE_TEMPLATES, {})}
              style={secondaryButtonStyle}
              aria-label="Browse available templates"
            >
              Browse Templates
            </button>
          </>
        )}
      </div>

      {/* Keyboard Tips */}
      <div style={tipStyle}>
        <span style={{ opacity: 0.7 }}>Tip:</span> Press <kbd style={kbdStyle}>A</kbd> to open Build
        panel{" · "}
        <kbd style={kbdStyle}>Esc</kbd> to deselect
      </div>
    </div>
  );
};

// ============================================================================
// STYLES
// ============================================================================

const containerStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  height: "100%",
  padding: "24px",
  textAlign: "center",
  color: "var(--aqb-text-secondary)",
  marginTop: "40px",
};

const iconCircleStyle: React.CSSProperties = {
  width: 48,
  height: 48,
  borderRadius: "50%",
  background: "rgba(255, 255, 255, 0.03)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  marginBottom: 16,
  border: "1px solid rgba(255, 255, 255, 0.05)",
};

const titleStyle: React.CSSProperties = {
  margin: "0 0 8px 0",
  fontSize: "14px",
  fontWeight: 600,
  color: "var(--aqb-text-primary)",
};

const descriptionStyle: React.CSSProperties = {
  margin: 0,
  fontSize: "13px",
  lineHeight: 1.5,
  color: "var(--aqb-text-tertiary)",
  maxWidth: "220px",
};

const ctaContainerStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "8px",
  marginTop: "20px",
  width: "100%",
  maxWidth: "200px",
};

const primaryButtonStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "6px",
  padding: "8px 16px",
  background: "var(--aqb-primary, #3b82f6)",
  color: "#ffffff",
  border: "none",
  borderRadius: "6px",
  fontSize: "12px",
  fontWeight: 600,
  cursor: "pointer",
  transition: "opacity 0.15s ease",
};

const secondaryButtonStyle: React.CSSProperties = {
  padding: "6px 12px",
  background: "transparent",
  color: "var(--aqb-text-secondary)",
  border: "none",
  borderRadius: "4px",
  fontSize: "12px",
  fontWeight: 500,
  cursor: "pointer",
  textDecoration: "underline",
  textUnderlineOffset: "2px",
  transition: "color 0.15s ease",
};

const tipStyle: React.CSSProperties = {
  marginTop: 20,
  padding: "8px 12px",
  background: "rgba(137, 180, 250, 0.08)",
  borderRadius: 6,
  fontSize: "11px",
  color: "var(--aqb-text-secondary)",
};

const kbdStyle: React.CSSProperties = {
  display: "inline-block",
  padding: "2px 6px",
  background: "rgba(255, 255, 255, 0.08)",
  borderRadius: 4,
  fontSize: "10px",
  fontFamily: "monospace",
  border: "1px solid rgba(255, 255, 255, 0.12)",
};

// Phase 7: Post-apply banner styles
const appliedBannerStyle: React.CSSProperties = {
  padding: "12px 16px",
  background: "rgba(74, 222, 128, 0.07)",
  border: "1px solid rgba(74, 222, 128, 0.2)",
  borderRadius: 8,
  textAlign: "center",
  width: "100%",
  maxWidth: 220,
};

const appliedActionStyle: React.CSSProperties = {
  display: "block",
  width: "100%",
  padding: "6px 10px",
  fontSize: "11px",
  fontFamily: "inherit",
  color: "#a5b4fc",
  background: "rgba(99, 102, 241, 0.08)",
  border: "1px solid rgba(99, 102, 241, 0.15)",
  borderRadius: 6,
  cursor: "pointer",
  textAlign: "center",
};
