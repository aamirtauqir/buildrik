/**
 * MoreSettingsToggle - Progressive disclosure toggle for advanced properties
 * Shows "More settings ▸" / "Less ▾" to reveal/hide advanced props in a group
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { INSPECTOR_TOKENS } from "./controlStyles";

// ============================================================================
// TYPES
// ============================================================================

export interface MoreSettingsToggleProps {
  /** Whether advanced section is currently open */
  isOpen: boolean;
  /** Callback when toggled */
  onToggle: (isOpen: boolean) => void;
  /** Number of advanced properties (shown as count) */
  advancedCount?: number;
  /** Custom label when collapsed */
  collapsedLabel?: string;
  /** Custom label when expanded */
  expandedLabel?: string;
}

// ============================================================================
// STYLES
// ============================================================================

const toggleStyles = {
  button: (isOpen: boolean): React.CSSProperties => ({
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    padding: "8px 12px",
    marginTop: 8,
    background: isOpen ? "rgba(0, 115, 230, 0.08)" : "rgba(255, 255, 255, 0.02)",
    border: "1px solid",
    borderColor: isOpen ? "rgba(0, 115, 230, 0.2)" : "rgba(255, 255, 255, 0.06)",
    borderRadius: 6,
    cursor: "pointer",
    transition: "all 0.15s ease",
    color: isOpen ? INSPECTOR_TOKENS.accent : INSPECTOR_TOKENS.textSecondary,
    fontSize: 11,
    fontWeight: 500,
  }),
  label: {
    display: "flex",
    alignItems: "center",
    gap: 6,
  } as React.CSSProperties,
  count: {
    background: "rgba(255, 255, 255, 0.06)",
    padding: "2px 6px",
    borderRadius: 4,
    fontSize: 10,
    color: INSPECTOR_TOKENS.textTertiary,
  } as React.CSSProperties,
  chevron: (isOpen: boolean): React.CSSProperties => ({
    fontSize: 10,
    transform: isOpen ? "rotate(90deg)" : "rotate(0)",
    transition: "transform 0.15s ease",
  }),
};

// ============================================================================
// COMPONENT
// ============================================================================

export const MoreSettingsToggle: React.FC<MoreSettingsToggleProps> = ({
  isOpen,
  onToggle,
  advancedCount,
  collapsedLabel = "More settings",
  expandedLabel = "Less",
}) => {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onToggle(!isOpen);
  };

  return (
    <button
      type="button"
      style={toggleStyles.button(isOpen)}
      onClick={handleClick}
      aria-expanded={isOpen}
      aria-label={isOpen ? expandedLabel : collapsedLabel}
    >
      <span style={toggleStyles.label}>
        {isOpen ? expandedLabel : collapsedLabel}
        {!isOpen && advancedCount && advancedCount > 0 && (
          <span style={toggleStyles.count}>{advancedCount}</span>
        )}
      </span>
      <span style={toggleStyles.chevron(isOpen)}>▶</span>
    </button>
  );
};

export default MoreSettingsToggle;
