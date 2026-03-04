/**
 * ProInspector Styles and Constants
 * Extracted from main component for better organization
 *
 * @license BSD-3-Clause
 */

import type { PseudoStateId } from "../../../shared/types";

// ============================================================================
// SPACING CONSTANTS (4px base grid)
// ============================================================================

export const INSPECTOR_SPACING = {
  // Section container
  sectionPadding: "var(--aqb-space-4)", // 16px
  sectionGap: "var(--aqb-space-3)", // 12px between sections

  // Section header
  headerPaddingY: "var(--aqb-space-2)", // 8px
  headerPaddingX: "var(--aqb-space-4)", // 16px

  // Content area
  contentPadding: "var(--aqb-space-4)", // 16px
  contentGap: "var(--aqb-space-3)", // 12px between control groups

  // Control groups (label + input)
  controlGap: "var(--aqb-space-2)", // 8px between label and input
  inputGap: "var(--aqb-space-2)", // 8px between inputs in a row

  // Labels
  labelMarginBottom: "var(--aqb-space-1)", // 4px
} as const;

// ============================================================================
// TYPOGRAPHY CONSTANTS
// ============================================================================

export const INSPECTOR_TYPOGRAPHY = {
  sectionTitle: {
    fontSize: "12px",
    fontWeight: 600,
    letterSpacing: "0.02em",
  },
  label: {
    fontSize: "11px",
    fontWeight: 500,
    color: "var(--aqb-text-secondary)",
  },
  input: {
    fontSize: "13px",
    fontWeight: 400,
  },
  hint: {
    fontSize: "10px",
    color: "var(--aqb-text-muted)",
  },
} as const;

// ============================================================================
// PANEL STYLES
// ============================================================================

export const panelStyles = {
  panel: {
    height: "100%",
    overflowY: "auto" as const,
    background: "var(--aqb-surface-2)",
    fontFamily: "var(--aqb-font-family)",
  },
  noSelection: {
    height: "100%",
    display: "flex" as const,
    flexDirection: "column" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    textAlign: "center" as const,
    padding: 40,
    color: "var(--aqb-text-tertiary)",
  },
  header: {
    padding: "var(--aqb-space-4)",
    background: "linear-gradient(135deg, rgba(99,102,241,0.12) 0%, rgba(99,102,241,0.06) 100%)",
    borderBottom: "1px solid var(--aqb-border)",
    position: "sticky" as const,
    top: 0,
    zIndex: 10,
    backdropFilter: "blur(10px)",
  },
  elementInfo: {
    display: "flex" as const,
    alignItems: "center" as const,
    gap: 12,
  },
  elementIcon: {
    width: 44,
    height: 44,
    borderRadius: 8,
    background: "var(--aqb-surface-3)", // Neutral background
    display: "flex" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    fontSize: 22,
  },
  elementName: {
    fontSize: "var(--aqb-text-md)",
    fontWeight: 600,
    color: "var(--aqb-text-primary)",
    marginBottom: 2,
  },
  elementId: {
    fontSize: "var(--aqb-text-sm)",
    color: "var(--aqb-text-tertiary)",
    fontFamily: "var(--aqb-font-mono)",
  },
  tagBadge: {
    marginLeft: 6,
    padding: "2px 6px",
    background: "var(--aqb-primary-light)",
    borderRadius: 4,
    fontSize: 12,
    color: "var(--aqb-primary)",
  },
  tabs: {
    display: "flex" as const,
    gap: 4,
    padding: "var(--aqb-space-3) var(--aqb-space-4)",
    background: "rgba(0,0,0,0.2)",
    borderBottom: "1px solid var(--aqb-border)",
  },
  tab: (active: boolean) => ({
    flex: 1,
    padding: "10px 12px",
    background: active ? "var(--aqb-primary-light)" : "transparent",
    border: active ? "1px solid rgba(99,102,241,0.3)" : "1px solid transparent",
    borderRadius: 6,
    color: active ? "var(--aqb-primary)" : "var(--aqb-text-tertiary)",
    fontSize: "var(--aqb-text-sm)",
    fontWeight: 600,
    cursor: "pointer" as const,
    transition: "var(--aqb-transition-fast)",
    display: "flex" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    gap: 6,
  }),
  content: {
    padding: "var(--aqb-space-2) 0",
  },
  deleteBtn: {
    position: "absolute" as const,
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 6,
    background: "var(--aqb-error-light)",
    border: "1px solid var(--aqb-error-border, rgba(239,68,68,0.3))",
    color: "var(--aqb-error)",
    cursor: "pointer" as const,
    display: "flex" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    fontSize: 14,
    transition: "var(--aqb-transition-fast)",
  },
  breakpointIndicator: {
    display: "flex" as const,
    alignItems: "center" as const,
    gap: 6,
    padding: "6px 12px",
    marginTop: 12,
    borderRadius: 6,
    fontSize: "var(--aqb-text-sm)",
    fontWeight: 600,
    transition: "var(--aqb-transition-fast)",
  },
  stateSelector: {
    display: "flex" as const,
    alignItems: "center" as const,
    gap: 4,
    padding: "var(--aqb-space-2) var(--aqb-space-3)",
    marginTop: 8,
    background: "rgba(0,0,0,0.2)",
    borderRadius: 6,
  },
  stateBtn: (active: boolean, state: PseudoStateId) => {
    // BUG-010 FIX: Changed active state to green for better visual contrast
    const colors: Record<PseudoStateId, string> = {
      normal: "var(--aqb-text-tertiary)",
      hover: "var(--aqb-accent-purple)",
      focus: "var(--aqb-info)",
      active: "var(--aqb-success)",
      disabled: "var(--aqb-text-muted)",
    };
    const rawColors: Record<PseudoStateId, string> = {
      normal: "#6c7086",
      hover: "#a855f7",
      focus: "#3b82f6",
      active: "#22c55e",
      disabled: "#6b7280",
    };
    return {
      flex: 1,
      padding: "6px 8px",
      background: active ? `${rawColors[state]}20` : "transparent",
      border: active ? `1px solid ${rawColors[state]}50` : "1px solid transparent",
      borderRadius: 6,
      color: active ? colors[state] : "var(--aqb-text-tertiary)",
      fontSize: "var(--aqb-text-xs)",
      fontWeight: 600,
      cursor: "pointer" as const,
      transition: "var(--aqb-transition-fast)",
      textAlign: "center" as const,
    };
  },
};

// ============================================================================
// ELEMENT ICONS
// ============================================================================

// ELEMENT_ICONS removed - replaced by components/ui/Icons
