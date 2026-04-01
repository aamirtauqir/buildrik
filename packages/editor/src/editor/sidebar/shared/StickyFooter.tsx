/**
 * StickyFooter - Save/Apply/Cancel footer for drill-in screens
 * Sticks to bottom of panel, shows unsaved indicator
 * @license BSD-3-Clause
 */

import * as React from "react";

// ============================================
// Types
// ============================================

export interface StickyFooterProps {
  /** Primary button label (e.g., "Save", "Apply") */
  primaryLabel: string;
  /** Primary button click handler */
  onPrimary: () => void;
  /** Secondary button label (e.g., "Cancel", "Reset") */
  secondaryLabel?: string;
  /** Secondary button click handler */
  onSecondary?: () => void;
  /** Disable primary button */
  disabled?: boolean;
  /** Show unsaved changes indicator */
  hasChanges?: boolean;
  /** Optional class name */
  className?: string;
}

// ============================================
// Component
// ============================================

export const StickyFooter: React.FC<StickyFooterProps> = ({
  primaryLabel,
  onPrimary,
  secondaryLabel,
  onSecondary,
  disabled,
  hasChanges,
  className,
}) => {
  return (
    <div className={className} style={containerStyles}>
      <div aria-live="polite" aria-atomic="true" style={indicatorStyles}>
        {hasChanges && (
          <>
            <span style={dotStyles} />
            <span>Unsaved changes</span>
          </>
        )}
      </div>
      <div style={buttonsStyles}>
        {secondaryLabel && onSecondary && (
          <button style={secondaryBtnStyles} onClick={onSecondary}>
            {secondaryLabel}
          </button>
        )}
        <button
          style={{
            ...primaryBtnStyles,
            ...(disabled ? disabledStyles : {}),
          }}
          onClick={onPrimary}
          disabled={disabled}
          aria-disabled={disabled}
        >
          {primaryLabel}
        </button>
      </div>
    </div>
  );
};

// ============================================
// Styles
// ============================================

const containerStyles: React.CSSProperties = {
  position: "sticky",
  bottom: 0,
  display: "flex",
  flexDirection: "column",
  gap: 8,
  padding: "12px",
  background: "var(--aqb-surface-2)",
  borderTop: "1px solid var(--aqb-border)",
  marginTop: "auto",
};

const indicatorStyles: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 6,
  fontSize: 12,
  color: "var(--aqb-warning)",
};

const dotStyles: React.CSSProperties = {
  width: 6,
  height: 6,
  borderRadius: "50%",
  background: "var(--aqb-warning)",
};

const buttonsStyles: React.CSSProperties = {
  display: "flex",
  gap: 8,
};

const primaryBtnStyles: React.CSSProperties = {
  flex: 1,
  padding: "8px 16px",
  height: 32,
  background: "var(--aqb-primary)",
  border: "none",
  borderRadius: 8,
  color: "#fff",
  fontSize: 12,
  fontWeight: 600,
  cursor: "pointer",
  transition: "opacity 0.15s ease",
};

const secondaryBtnStyles: React.CSSProperties = {
  flex: 1,
  padding: "8px 16px",
  height: 32,
  background: "transparent",
  border: "1px solid var(--aqb-border)",
  borderRadius: 8,
  color: "var(--aqb-text-secondary)",
  fontSize: 12,
  fontWeight: 500,
  cursor: "pointer",
  transition: "all 0.15s ease",
};

const disabledStyles: React.CSSProperties = {
  opacity: 0.5,
  cursor: "not-allowed",
};

export default StickyFooter;
