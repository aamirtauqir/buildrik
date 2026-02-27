/**
 * DevModeToggle - Toggle for showing/hiding developer-only features
 * When ON: Shows "All CSS" group, raw CSS editor, advanced debugging tools
 * When OFF (default): Hides dev-only features for cleaner UX
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { INSPECTOR_TOKENS } from "./controls/controlStyles";

// ============================================================================
// TYPES
// ============================================================================

export interface DevModeToggleProps {
  /** Whether dev mode is enabled */
  enabled: boolean;
  /** Callback when toggled */
  onToggle: (enabled: boolean) => void;
}

// ============================================================================
// STYLES
// ============================================================================

const toggleStyles = {
  container: {
    display: "flex",
    alignItems: "center",
    gap: 6,
  } as React.CSSProperties,
  label: {
    fontSize: 10,
    fontWeight: 500,
    color: INSPECTOR_TOKENS.textTertiary,
    textTransform: "uppercase" as const,
    letterSpacing: "0.5px",
  } as React.CSSProperties,
  toggle: (enabled: boolean): React.CSSProperties => ({
    position: "relative",
    width: 32,
    height: 18,
    background: enabled ? "rgba(0, 115, 230, 0.6)" : "rgba(255, 255, 255, 0.1)",
    borderRadius: 9,
    cursor: "pointer",
    border: "none",
    padding: 0,
    transition: "background 0.2s ease",
  }),
  knob: (enabled: boolean): React.CSSProperties => ({
    position: "absolute",
    top: 2,
    left: enabled ? 16 : 2,
    width: 14,
    height: 14,
    background: enabled ? "#fff" : "rgba(255, 255, 255, 0.5)",
    borderRadius: "50%",
    transition: "left 0.2s ease, background 0.2s ease",
    boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
  }),
  indicator: (enabled: boolean): React.CSSProperties => ({
    width: 6,
    height: 6,
    borderRadius: "50%",
    background: enabled ? "#22c55e" : INSPECTOR_TOKENS.textTertiary,
    marginLeft: 4,
  }),
};

// ============================================================================
// COMPONENT
// ============================================================================

export const DevModeToggle: React.FC<DevModeToggleProps> = ({ enabled, onToggle }) => {
  const handleClick = () => {
    onToggle(!enabled);
  };

  return (
    <div style={toggleStyles.container} title={enabled ? "Dev mode enabled" : "Enable dev mode"}>
      <span style={toggleStyles.label}>Dev</span>
      <button
        type="button"
        style={toggleStyles.toggle(enabled)}
        onClick={handleClick}
        aria-pressed={enabled}
        aria-label={enabled ? "Disable developer mode" : "Enable developer mode"}
      >
        <span style={toggleStyles.knob(enabled)} />
      </button>
      <span style={toggleStyles.indicator(enabled)} />
    </div>
  );
};

export default DevModeToggle;
