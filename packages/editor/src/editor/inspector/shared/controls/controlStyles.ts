/**
 * Shared styles for Pro Inspector controls
 * Single source of truth for control styling using CSS variables
 *
 * @description All values reference CSS variables from themes/default.css
 * for consistent theming and easy maintenance.
 *
 * @license BSD-3-Clause
 */

import type * as React from "react";

// ============================================================================
// INSPECTOR TOKENS (CSS Variables)
// ============================================================================

/**
 * Token references for panel control values
 * These map to CSS variables defined in themes/default.css
 */
export const INSPECTOR_TOKENS = {
  accent: "var(--aqb-control-accent)",
  accentAlpha08: "var(--aqb-control-accent-alpha-08)",
  accentAlpha10: "var(--aqb-control-accent-alpha-10)",
  accentAlpha20: "var(--aqb-control-accent-alpha-20)",
  accentAlpha30: "var(--aqb-control-accent-alpha-30)",
  surfaceInput: "var(--aqb-control-surface-input)",
  surfaceSubtle: "var(--aqb-control-surface-subtle)",
  surfaceOverlay: "var(--aqb-control-surface-overlay)",
  borderInput: "var(--aqb-input-border)",
  borderSubtle: "var(--aqb-border-subtle)",
  textPrimary: "var(--aqb-control-text-primary)",
  textSecondary: "var(--aqb-control-text-secondary)",
  textTertiary: "var(--aqb-control-text-tertiary)",
  textMuted: "var(--aqb-control-text-muted)",
} as const;

// ============================================================================
// BASE STYLES
// ============================================================================

export const baseStyles = {
  section: {
    borderBottom: `1px solid ${INSPECTOR_TOKENS.borderSubtle}`,
  },
  // Calmer header: bigger hit area, no hard inner divider when open, no loud
  // left accent bar. The section's own borderBottom provides the only divider.
  sectionHeader: (isOpen: boolean): React.CSSProperties => ({
    width: "100%",
    padding: "10px 14px",
    background: "transparent",
    border: "none",
    color: isOpen ? INSPECTOR_TOKENS.textPrimary : INSPECTOR_TOKENS.textSecondary,
    fontSize: 12,
    fontWeight: 600,
    letterSpacing: "0.01em",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    transition: "color 0.15s",
  }),
  sectionContent: {
    padding: "4px 14px 14px",
  },
  row: {
    display: "flex" as const,
    alignItems: "center" as const,
    gap: 8,
    marginBottom: 8,
  },
  label: {
    fontSize: 12,
    color: INSPECTOR_TOKENS.textTertiary,
    fontWeight: 500,
    minWidth: 60,
    flexShrink: 0,
  },
  input: {
    flex: 1,
    padding: "5px 8px",
    background: INSPECTOR_TOKENS.surfaceInput,
    border: `1px solid ${INSPECTOR_TOKENS.borderInput}`,
    borderRadius: 6,
    color: INSPECTOR_TOKENS.textPrimary,
    fontSize: 12,
    outline: "none",
    transition: "border-color 0.2s, box-shadow 0.2s",
  },
  inputFocus: {
    borderColor: INSPECTOR_TOKENS.accent,
    boxShadow: `0 0 0 2px ${INSPECTOR_TOKENS.accentAlpha30}`,
  },
  select: {
    flex: 1,
    padding: "5px 8px",
    background: INSPECTOR_TOKENS.surfaceInput,
    border: `1px solid ${INSPECTOR_TOKENS.borderInput}`,
    borderRadius: 6,
    color: INSPECTOR_TOKENS.textPrimary,
    fontSize: 12,
    outline: "none",
    cursor: "pointer",
    appearance: "none" as const,
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2371717a' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
    backgroundRepeat: "no-repeat",
    backgroundPosition: "right 8px center",
    paddingRight: 24,
  },
  buttonGroup: {
    display: "flex" as const,
    gap: 2,
    background: INSPECTOR_TOKENS.surfaceSubtle,
    borderRadius: 6,
    padding: 2,
  },
  buttonGroupItem: (active: boolean): React.CSSProperties => ({
    flex: 1,
    padding: "6px 10px",
    background: active ? INSPECTOR_TOKENS.accentAlpha20 : "transparent",
    border: active ? `1px solid ${INSPECTOR_TOKENS.accentAlpha30}` : "1px solid transparent",
    borderRadius: 4,
    color: active ? INSPECTOR_TOKENS.accent : INSPECTOR_TOKENS.textTertiary,
    fontSize: 12,
    fontWeight: 500,
    cursor: "pointer",
    transition: "all 0.15s",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  }),
  compactBtn: (active: boolean): React.CSSProperties => ({
    flex: 1,
    padding: "5px 4px",
    background: active ? INSPECTOR_TOKENS.accentAlpha20 : INSPECTOR_TOKENS.surfaceSubtle,
    border: active ? `1px solid ${INSPECTOR_TOKENS.accentAlpha30}` : "1px solid transparent",
    borderRadius: 4,
    color: active ? INSPECTOR_TOKENS.accent : INSPECTOR_TOKENS.textTertiary,
    fontSize: 12,
    fontWeight: 500,
    cursor: "pointer",
  }),
  sectionTitle: {
    fontSize: 11,
    color: INSPECTOR_TOKENS.textSecondary,
    fontWeight: 600,
    marginBottom: 10,
    marginTop: 16,
  },
  colorInput: {
    width: 32,
    height: 32,
    padding: 0,
    border: `2px solid ${INSPECTOR_TOKENS.borderInput}`,
    borderRadius: 6,
    cursor: "pointer",
    overflow: "hidden" as const,
  },
  unitSelect: {
    width: 50,
    padding: "4px 4px",
    background: INSPECTOR_TOKENS.surfaceInput,
    border: `1px solid ${INSPECTOR_TOKENS.borderInput}`,
    borderLeft: "none",
    borderRadius: "0 4px 4px 0",
    color: INSPECTOR_TOKENS.textTertiary,
    fontSize: 12,
    outline: "none",
    cursor: "pointer",
  },
  inputWithUnit: {
    flex: 1,
    padding: "4px 8px",
    background: INSPECTOR_TOKENS.surfaceInput,
    border: `1px solid ${INSPECTOR_TOKENS.borderInput}`,
    borderRadius: "4px 0 0 4px",
    color: INSPECTOR_TOKENS.textPrimary,
    fontSize: 12,
    outline: "none",
  },
  slider: {
    flex: 1,
    height: 4,
    background: INSPECTOR_TOKENS.borderInput,
    borderRadius: 2,
    appearance: "none" as const,
    cursor: "pointer",
  },
};
